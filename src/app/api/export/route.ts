import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const [transactions, budgets, goals, recurring, settlements] = await Promise.all([
      db.getTransactions(),
      db.getBudgets(),
      db.getGoals(),
      db.getRecurring(),
      db.getSettlements(),
    ]);

    if (format === "csv") {
      // Generate CSV of transactions
      const headers = ["ID", "Date", "Amount", "Category", "Description", "PaidBy", "SplitRatio", "Notes"];
      const rows = transactions.map((t) => [
        `"${t.id}"`,
        `"${t.date}"`,
        t.amount,
        `"${t.category.replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.paidBy}"`,
        `"${t.splitRatio}"`,
        `"${(t.notes || "").replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="babi_savings_transactions_${Date.now()}.csv"`,
        },
      });
    }

    // Default JSON database dump
    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        budgets,
        goals,
        recurring,
        settlements,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="babi_savings_backup_${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
