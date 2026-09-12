import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDaysRemainingInMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const budgets = await db.getBudgets();
    const transactions = await db.getTransactions();

    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);
    const dayOfMonth = now.getDate();
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgressRatio = dayOfMonth / totalDaysInMonth; // e.g. 0.40 on day 12 of 30

    // Compute actual spent per category from transactions of this month (expenses only)
    const categorySpentMap: Record<string, number> = {};
    for (const t of transactions) {
      if ((t.type || "expense") === "expense" && t.date.startsWith(currentMonthPrefix)) {
        categorySpentMap[t.category] = (categorySpentMap[t.category] || 0) + t.amount;
      }
    }

    // Enhance budgets with mid-month forecasts and status indicators
    const enhancedBudgets = budgets.map((b) => {
      const spent = categorySpentMap[b.category] !== undefined ? categorySpentMap[b.category] : b.spentAmount;
      const totalAvailable = b.monthlyLimit + (b.rolloverEnabled ? b.rolloverAccumulated : 0);
      const spentPercentage = totalAvailable > 0 ? (spent / totalAvailable) * 100 : 0;

      // Forecasted end-of-month spend based on current pace
      const projectedMonthEndSpend = monthProgressRatio > 0 ? Math.round((spent / monthProgressRatio) * 100) / 100 : spent;
      const isForecastingOverBudget = projectedMonthEndSpend > totalAvailable;

      // Status color thresholds: Green < 75%, Yellow 75-90%, Red > 90%
      let statusColor: "green" | "yellow" | "red" = "green";
      if (spentPercentage >= 90) {
        statusColor = "red";
      } else if (spentPercentage >= 75) {
        statusColor = "yellow";
      }

      return {
        ...b,
        spentAmount: Math.round(spent * 100) / 100,
        totalAvailable: Math.round(totalAvailable * 100) / 100,
        spentPercentage: Math.round(spentPercentage * 10) / 10,
        statusColor,
        projectedMonthEndSpend,
        isForecastingOverBudget,
      };
    });

    return NextResponse.json({ budgets: enhancedBudgets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, monthlyLimit, icon, rolloverEnabled, alertThreshold } = body;

    if (!category || typeof monthlyLimit !== "number" || monthlyLimit <= 0) {
      return NextResponse.json({ error: "Category and positive monthly limit are required." }, { status: 400 });
    }

    const newBudget = await db.addBudget({
      category: category.trim(),
      icon: icon || "Tag",
      monthlyLimit,
      spentAmount: 0,
      rolloverEnabled: Boolean(rolloverEnabled),
      rolloverAccumulated: 0,
      alertThreshold: typeof alertThreshold === "number" ? alertThreshold : 0.9,
      monthYear: new Date().toISOString().slice(0, 7),
    });

    return NextResponse.json({ success: true, budget: newBudget });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, category, monthlyLimit, icon, rolloverEnabled, rolloverAccumulated, alertThreshold } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing budget ID" }, { status: 400 });

    const updates: Record<string, any> = {};
    if (typeof category === "string" && category.trim()) updates.category = category.trim();
    if (typeof monthlyLimit === "number") updates.monthlyLimit = monthlyLimit;
    if (typeof icon === "string") updates.icon = icon;
    if (typeof rolloverEnabled === "boolean") updates.rolloverEnabled = rolloverEnabled;
    if (typeof rolloverAccumulated === "number") updates.rolloverAccumulated = rolloverAccumulated;
    if (typeof alertThreshold === "number") updates.alertThreshold = alertThreshold;

    const updated = await db.updateBudget(id, updates);
    return NextResponse.json({ success: true, budget: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing budget ID" }, { status: 400 });

    await db.deleteBudget(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
