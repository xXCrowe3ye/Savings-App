import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { sanitizeHtml, stripFormulaTriggers } from "@/lib/sanitize";
import { calculateRoundUp } from "@/lib/utils";

const createTransactionSchema = z.object({
  type: z.enum(["expense", "savings", "income"]).default("expense"),
  date: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().min(1),
  paidBy: z.enum(["partner_a", "partner_b"]),
  splitRatio: z.enum(["50/50", "60/40", "70/30", "100/0", "0/100", "custom"]).default("50/50"),
  partnerASplitPercentage: z.number().min(0).max(100).optional(),
  goalId: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

export async function GET() {
  try {
    const transactions = await db.getTransactions();
    const metrics = await db.getDashboardMetrics();
    return NextResponse.json({ transactions, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // Formula injection & XSS sanitization
    const sanitizedDescription = stripFormulaTriggers(sanitizeHtml(data.description));
    const sanitizedNotes = data.notes ? stripFormulaTriggers(sanitizeHtml(data.notes)) : "";

    // High expense approval badge threshold: >= $200 (for expenses only)
    const needsApproval = data.type === "expense" && data.amount >= 200;
    const approvedByPartner = !needsApproval;

    const newTx = await db.addTransaction({
      type: data.type,
      date: data.date,
      amount: data.amount,
      category: data.category,
      description: sanitizedDescription,
      paidBy: data.paidBy,
      splitRatio: data.splitRatio,
      partnerASplitPercentage: data.partnerASplitPercentage ?? 50,
      goalId: data.goalId,
      isRecurring: data.isRecurring || false,
      needsApproval,
      approvedByPartner,
      receiptUrl: data.receiptUrl,
      notes: sanitizedNotes,
    });

    // If type is savings deposit and a goal is targeted, credit the goal immediately!
    if (data.type === "savings" && data.goalId) {
      const goals = await db.getGoals();
      const targetGoal = goals.find((g) => g.id === data.goalId);
      if (targetGoal) {
        let addA = 0;
        let addB = 0;
        if (data.splitRatio === "50/50") {
          addA = data.amount / 2;
          addB = data.amount / 2;
        } else if (data.paidBy === "partner_a" || data.splitRatio === "100/0") {
          addA = data.amount;
          addB = 0;
        } else {
          addA = 0;
          addB = data.amount;
        }

        await db.updateGoal(targetGoal.id, {
          currentAmount: targetGoal.currentAmount + data.amount,
          partnerAContribution: targetGoal.partnerAContribution + addA,
          partnerBContribution: targetGoal.partnerBContribution + addB,
          status: targetGoal.currentAmount + data.amount >= targetGoal.targetAmount ? "achieved" : targetGoal.status,
        });
      }
    }

    // Round-up Savings Engine sweep check (for expenses):
    let sweepAmount = 0;
    let activeRoundupGoalTitle: string | undefined;

    if (data.type === "expense") {
      const goals = await db.getGoals();
      const activeRoundupGoal = goals.find((g) => g.roundupEnabled && g.status === "active");

      if (activeRoundupGoal) {
        sweepAmount = calculateRoundUp(data.amount, activeRoundupGoal.roundupUnit || 1);
        if (sweepAmount > 0) {
          activeRoundupGoalTitle = activeRoundupGoal.title;
          const isPartnerA = data.paidBy === "partner_a";
          await db.updateGoal(activeRoundupGoal.id, {
            currentAmount: activeRoundupGoal.currentAmount + sweepAmount,
            partnerAContribution: activeRoundupGoal.partnerAContribution + (isPartnerA ? sweepAmount : 0),
            partnerBContribution: activeRoundupGoal.partnerBContribution + (!isPartnerA ? sweepAmount : 0),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      transaction: newTx,
      roundupSwept: sweepAmount,
      roundupGoal: activeRoundupGoalTitle,
    });
  } catch (error: any) {
    console.error("Add transaction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, approvedByPartner, notes } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing transaction id" }, { status: 400 });

    const updates: Record<string, any> = {};
    if (typeof approvedByPartner === "boolean") {
      updates.approvedByPartner = approvedByPartner;
      if (approvedByPartner) {
        updates.needsApproval = false;
      }
    }
    if (typeof notes === "string") {
      updates.notes = stripFormulaTriggers(sanitizeHtml(notes));
    }

    const updated = await db.updateTransaction(id, updates);
    return NextResponse.json({ success: true, transaction: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.deleteTransaction(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
