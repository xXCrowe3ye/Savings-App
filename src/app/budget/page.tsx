"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { CategoryBudgetBar } from "@/components/budget/CategoryBudgetBar";
import { PieChart, Sparkles, Repeat, AlertCircle } from "lucide-react";

export default function BudgetPage() {
  const { budgets, currency } = useApp();

  const totalLimit = budgets.reduce(
    (acc, b) => acc + b.monthlyLimit + (b.rolloverEnabled ? b.rolloverAccumulated : 0),
    0
  );
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const remaining = Math.max(0, totalLimit - totalSpent);
  const totalRollover = budgets.reduce(
    (acc, b) => acc + (b.rolloverEnabled ? b.rolloverAccumulated : 0),
    0
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Hero Budget Overview */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-teal-600 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-teal-200" />
            <h2 className="font-bold text-base">Monthly Shared Budget</h2>
          </div>
          {totalRollover > 0 && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/10 text-teal-200 text-xs font-semibold backdrop-blur-sm">
              <Repeat className="w-3 h-3" />
              <span>+{formatMoney(totalRollover, currency)} Rollover</span>
            </span>
          )}
        </div>

        <div className="mt-2">
          <div className="text-3xl font-extrabold tracking-tight">
            {formatMoney(remaining, currency)}
            <span className="text-sm font-normal text-white/70 ml-1.5">remaining</span>
          </div>
          <p className="text-xs text-white/80 mt-0.5">
            Spent {formatMoney(totalSpent, currency)} of {formatMoney(totalLimit, currency)} total limit
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2 bg-black/20 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-teal-300 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (totalSpent / (totalLimit || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Category Spending Bars */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Category Limits &amp; Rollovers
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {budgets.length} Categories
          </span>
        </div>

        {budgets.map((b) => (
          <CategoryBudgetBar key={b.id} budget={b} />
        ))}
      </div>
    </div>
  );
}
