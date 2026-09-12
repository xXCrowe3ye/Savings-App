import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculateRequiredPace } from "@/lib/utils";
import { PriorityLevel } from "@/types";

const createGoalSchema = z.object({
  title: z.string().min(1),
  emoji: z.string().default("🎯"),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().default(0),
  targetDate: z.string().min(1),
  category: z.string().default("General"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  partnerAContribution: z.number().nonnegative().default(0),
  partnerBContribution: z.number().nonnegative().default(0),
  roundupEnabled: z.boolean().default(false),
  roundupUnit: z.union([z.literal(1), z.literal(5)]).default(1),
});

export async function GET() {
  try {
    const goals = await db.getGoals();

    // Enhance goals with milestones and pace calculation
    const enhancedGoals = goals.map((g) => {
      const pace = calculateRequiredPace(g.currentAmount, g.targetAmount, g.targetDate);
      const progressPercent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

      const milestones = {
        reached25: progressPercent >= 25,
        reached50: progressPercent >= 50,
        reached75: progressPercent >= 75,
        reached100: progressPercent >= 100,
      };

      // Velocity: average monthly contribution
      const totalContributed = g.partnerAContribution + g.partnerBContribution || g.currentAmount;
      const partnerARatio = totalContributed > 0 ? Math.round((g.partnerAContribution / totalContributed) * 100) : 50;
      const partnerBRatio = 100 - partnerARatio;

      return {
        ...g,
        progressPercent,
        milestones,
        requiredMonthlyPace: pace.monthlyPace,
        requiredWeeklyPace: pace.weeklyPace,
        daysRemaining: pace.daysLeft,
        partnerARatio,
        partnerBRatio,
      };
    });

    return NextResponse.json({ goals: enhancedGoals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;
    const newGoal = await db.addGoal({
      ...data,
      status: "active",
    });

    return NextResponse.json({ success: true, goal: newGoal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, action, amount, partnerKey, roundupEnabled, roundupUnit } = body;

    if (!id) return NextResponse.json({ error: "Missing goal ID" }, { status: 400 });

    const goals = await db.getGoals();
    const targetGoal = goals.find((g) => g.id === id);
    if (!targetGoal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const updates: Record<string, any> = {};

    // General Goal Property Edits (Edit Modal)
    if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
    if (typeof body.emoji === "string") updates.emoji = body.emoji;
    if (typeof body.targetAmount === "number" && body.targetAmount > 0) updates.targetAmount = body.targetAmount;
    if (typeof body.currentAmount === "number" && body.currentAmount >= 0) updates.currentAmount = body.currentAmount;
    if (typeof body.targetDate === "string") updates.targetDate = body.targetDate;
    if (typeof body.category === "string") updates.category = body.category;
    if (body.priority === "high" || body.priority === "medium" || body.priority === "low") updates.priority = body.priority;
    if (body.status === "active" || body.status === "achieved" || body.status === "paused") updates.status = body.status;
    if (typeof body.partnerAContribution === "number") updates.partnerAContribution = body.partnerAContribution;
    if (typeof body.partnerBContribution === "number") updates.partnerBContribution = body.partnerBContribution;

    // Windfall Boost or Deposit Allocation
    if (action === "boost" || action === "deposit") {
      const boostAmount = Number(amount);
      if (isNaN(boostAmount) || boostAmount <= 0) {
        return NextResponse.json({ error: "Invalid allocation amount" }, { status: 400 });
      }

      const isA = partnerKey === "partner_a";
      const isB = partnerKey === "partner_b";
      const is5050 = !partnerKey || partnerKey === "both";

      const addA = is5050 ? boostAmount / 2 : isA ? boostAmount : 0;
      const addB = is5050 ? boostAmount / 2 : isB ? boostAmount : 0;

      updates.currentAmount = targetGoal.currentAmount + boostAmount;
      updates.partnerAContribution = targetGoal.partnerAContribution + addA;
      updates.partnerBContribution = targetGoal.partnerBContribution + addB;

      if (updates.currentAmount >= targetGoal.targetAmount) {
        updates.status = "achieved";
      }

      // Record savings transaction so it reflects in transactions and activity history
      await db.addTransaction({
        type: "savings",
        date: new Date().toISOString().split("T")[0],
        amount: boostAmount,
        category: "Savings",
        description: `Boost into ${targetGoal.title}`,
        paidBy: isB ? "partner_b" : "partner_a",
        splitRatio: is5050 ? "50/50" : isA ? "100/0" : "0/100",
        partnerASplitPercentage: is5050 ? 50 : isA ? 100 : 0,
        goalId: id,
        notes: "Allocated via Windfall Boost",
        needsApproval: false,
        approvedByPartner: true,
      });
    }

    // Toggle round-up
    if (typeof roundupEnabled === "boolean") {
      updates.roundupEnabled = roundupEnabled;
    }
    if (roundupUnit === 1 || roundupUnit === 5) {
      updates.roundupUnit = roundupUnit;
    }

    const updated = await db.updateGoal(id, updates);
    return NextResponse.json({ success: true, goal: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing goal ID" }, { status: 400 });

    await db.deleteGoal(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
