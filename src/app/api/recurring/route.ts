import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
