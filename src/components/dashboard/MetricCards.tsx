"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { PiggyBank, TrendingUp, Wallet, ArrowDownRight } from "lucide-react";

export function MetricCards() {
  const { metrics, currency, goals, openIncomeModal } = useApp();

  const netSavings = metrics?.combinedNetSavings || 0;
  const savingsRate = metrics?.savingsRate || 0;
  const income = metrics?.combinedTotalIncome || 0;
  const expenses = metrics?.combinedTotalExpenses || 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Combined Net Savings */}
      <div className="bg-card border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Net Savings
          </span>
          <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight">
            {formatMoney(netSavings, currency)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Across {goals.length} active goals
          </span>
        </div>
      </div>

      {/* Net Savings Rate */}
      <div className="bg-card border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Savings Rate
          </span>
          <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
            {savingsRate}%
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, savingsRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Shared Income (Clickable to Edit) */}
      <div
        onClick={openIncomeModal}
        className="bg-card border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-500/40 hover:bg-secondary/40 transition-all group"
        title="Tap to edit combined monthly income"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors flex items-center gap-1">
            <span>Shared Income</span>
            <span className="text-[9px] lowercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-normal">edit</span>
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight">
            {formatMoney(income, currency)}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Monthly baseline ✎
          </span>
        </div>
      </div>

      {/* Shared Expenses */}
      <div className="bg-card border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Expenses MTD
          </span>
          <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight">
            {formatMoney(expenses, currency)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Month to date
          </span>
        </div>
      </div>
    </div>
  );
}
