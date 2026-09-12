import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { sanitizeHtml, stripFormulaTriggers } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const createRecurringSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(["monthly", "yearly", "weekly"]).default("monthly"),
  billingDay: z.number().min(1).max(31).default(1),
  category: z.string().default("Utilities"),
  paidBy: z.enum(["partner_a", "partner_b"]).default("partner_a"),
  lastBilledDate: z.string().optional(),
  previousAmount: z.number().optional(),
  lastActiveDate: z.string().optional(),
  status: z.enum(["active", "paused", "cancelled", "flagged"]).default("active"),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const recurring = await db.getRecurring();

    // Check for inflation/price hikes and dormant/unused subscriptions (>60 days)
    const enhancedRecurring = recurring.map((bill) => {
      let isPriceHike = false;
      let priceHikeDiff = 0;
      if (bill.previousAmount && bill.amount > bill.previousAmount) {
        isPriceHike = true;
        priceHikeDiff = Math.round((bill.amount - bill.previousAmount) * 100) / 100;
      }

      let isUnusedWarning = false;
      let daysInactive = 0;
      if (bill.lastActiveDate) {
        const lastActive = new Date(bill.lastActiveDate).getTime();
        const diffDays = Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24));
        if (diffDays >= 60) {
          isUnusedWarning = true;
          daysInactive = diffDays;
        }
      }

      return {
        ...bill,
        isPriceHike,
        priceHikeDiff,
        isUnusedWarning,
        daysInactive,
      };
    });

    const totalMonthlyRecurring = enhancedRecurring
      .filter((b) => b.frequency === "monthly" && b.status !== "cancelled")
      .reduce((acc, b) => acc + b.amount, 0);

    return NextResponse.json({
      recurring: enhancedRecurring,
      totalMonthlyRecurring: Math.round(totalMonthlyRecurring * 100) / 100,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createRecurringSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid recurring bill parameters", details: parsed.error }, { status: 400 });
    }

    const data = parsed.data;
    const sanitizedTitle = stripFormulaTriggers(sanitizeHtml(data.title));
    const sanitizedNotes = data.notes ? stripFormulaTriggers(sanitizeHtml(data.notes)) : undefined;

    const newBill = await db.addRecurring({
      title: sanitizedTitle,
      amount: data.amount,
      frequency: data.frequency,
      billingDay: data.billingDay,
      category: data.category,
      paidBy: data.paidBy,
      lastBilledDate: data.lastBilledDate,
      previousAmount: data.previousAmount,
      lastActiveDate: data.lastActiveDate || new Date().toISOString().split("T")[0],
      status: data.status,
      notes: sanitizedNotes,
    });

    return NextResponse.json({ success: true, bill: newBill });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, title, amount, frequency, billingDay, category, paidBy, status, notes, lastActiveDate, previousAmount, lastBilledDate } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing bill id" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = stripFormulaTriggers(sanitizeHtml(String(title)));
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return NextResponse.json({ error: "Invalid bill amount" }, { status: 400 });
      }
      updates.amount = numAmount;
    }
    if (frequency !== undefined) updates.frequency = frequency;
    if (billingDay !== undefined) updates.billingDay = Number(billingDay);
    if (category !== undefined) updates.category = category;
    if (paidBy !== undefined) updates.paidBy = paidBy;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes ? stripFormulaTriggers(sanitizeHtml(String(notes))) : null;
    if (lastActiveDate !== undefined) updates.lastActiveDate = lastActiveDate;
    if (previousAmount !== undefined) updates.previousAmount = Number(previousAmount);
    if (lastBilledDate !== undefined) updates.lastBilledDate = lastBilledDate;

    const updated = await db.updateRecurring(id, updates);
    return NextResponse.json({ success: true, bill: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing bill id" }, { status: 400 });
    }

    await db.deleteRecurring(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
