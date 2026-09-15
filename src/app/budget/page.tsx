"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { CategoryBudgetBar } from "@/components/budget/CategoryBudgetBar";
import { BudgetWizardModal } from "@/components/budget/BudgetWizardModal";
import { BudgetCalculatorModal } from "@/components/budget/BudgetCalculatorModal";
import {
  PieChart,
  Sparkles,
  Repeat,
  Plus,
  Scale,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  Layers,
} from "lucide-react";

export default function BudgetPage() {
  const { budgets, currency, metrics } = useApp();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

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

  const spentPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const daysLeft = metrics?.daysRemainingInMonth || 1;
  const dailyPace = Math.round((remaining / daysLeft) * 100) / 100;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Hero Budget Overview */}
      <div data-tour="budget-hero" className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-teal-600 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-teal-200" />
            <h2 className="font-bold text-base">Monthly Shared Budget</h2>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 active:scale-95 transition-all flex items-center space-x-1 backdrop-blur-sm"
              title="50/30/20 Smart Calculator"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>50/30/20</span>
            </button>

            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-3 py-1 rounded-full bg-white text-indigo-900 text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all flex items-center space-x-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Category</span>
            </button>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-3xl font-extrabold tracking-tight">
            {formatMoney(remaining, currency)}
            <span className="text-sm font-normal text-white/70 ml-1.5">remaining</span>
          </div>
          <p className="text-xs text-white/80 mt-0.5">
            Spent {formatMoney(totalSpent, currency)} of {formatMoney(totalLimit, currency)} total limit ({spentPercent}%)
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2.5 bg-black/20 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              spentPercent >= 90 ? "bg-rose-300" : spentPercent >= 75 ? "bg-amber-300" : "bg-teal-300"
            }`}
            style={{ width: `${Math.min(100, spentPercent)}%` }}
          />
        </div>

        {/* Footer badges */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-200" />
            <span>Pace: <b>{formatMoney(dailyPace, currency)}/day</b> for next {daysLeft} days</span>
          </div>

          {totalRollover > 0 && (
            <span className="flex items-center space-x-1 text-teal-200 font-semibold text-[11px]">
              <Repeat className="w-3 h-3" />
              <span>+{formatMoney(totalRollover, currency)} Rollover</span>
            </span>
          )}
        </div>
      </div>

      {/* Category Spending Bars */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Category Limits &amp; Rollovers
          </h3>
          <span className="text-[11px] text-muted-foreground font-medium">
            {budgets.length} Categories Active
          </span>
        </div>

        {budgets.length === 0 ? (
          <div className="bg-card border rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">No Category Budgets Yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Set monthly spending guardrails for groceries, housing, dining, and utilities.
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-1">
              <button
                onClick={() => setIsCalculatorOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>50/30/20 Framework</span>
              </button>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>
          </div>
        ) : (
          budgets.map((b) => (
            <CategoryBudgetBar key={b.id} budget={b} />
          ))
        )}
      </div>

      {/* Modals */}
      <BudgetWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      <BudgetCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
}
