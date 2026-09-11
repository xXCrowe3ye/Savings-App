"use client";

import React, { useState } from "react";
import { CategoryBudget } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import {
  Utensils,
  Coffee,
  Car,
  Home,
  Film,
  Zap,
  Repeat,
  AlertTriangle,
  Check,
  Edit2,
} from "lucide-react";

interface CategoryBudgetBarProps {
  budget: CategoryBudget & {
    spentPercentage?: number;
    statusColor?: "green" | "yellow" | "red";
    projectedMonthEndSpend?: number;
    isForecastingOverBudget?: boolean;
    totalAvailable?: number;
  };
}

const CATEGORY_ICONS: Record<string, any> = {
  Groceries: Utensils,
  "Food & Dining": Coffee,
  Transportation: Car,
  "Housing & Utilities": Home,
  Entertainment: Film,
  Utilities: Zap,
};

export function CategoryBudgetBar({ budget }: CategoryBudgetBarProps) {
  const { currency, refreshData } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [newLimit, setNewLimit] = useState(budget.monthlyLimit.toString());
  const [isRollover, setIsRollover] = useState(budget.rolloverEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const Icon = CATEGORY_ICONS[budget.category] || Utensils;
  const totalLimit = budget.totalAvailable ?? (budget.monthlyLimit + (budget.rolloverEnabled ? budget.rolloverAccumulated : 0));
  const spentPercent = budget.spentPercentage ?? Math.round((budget.spentAmount / totalLimit) * 100);

  // Status color styles
  const statusColor = budget.statusColor || (spentPercent >= 90 ? "red" : spentPercent >= 75 ? "yellow" : "green");
  const barColor =
    statusColor === "red"
      ? "bg-rose-500"
      : statusColor === "yellow"
      ? "bg-amber-500"
      : "bg-emerald-500";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/budgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: budget.id,
          monthlyLimit: parseFloat(newLimit) || budget.monthlyLimit,
          rolloverEnabled: isRollover,
        }),
      });
      await refreshData();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update budget:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-foreground">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-bold text-xs text-foreground">{budget.category}</h4>
              {budget.rolloverEnabled && (
                <span className="flex items-center space-x-0.5 px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold">
                  <Repeat className="w-2.5 h-2.5" />
                  <span>+{formatMoney(budget.rolloverAccumulated, currency)} rollover</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {formatMoney(budget.spentAmount, currency)} of {formatMoney(totalLimit, currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              statusColor === "red"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : statusColor === "yellow"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {spentPercent}%
          </span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, spentPercent)}%` }}
        />
      </div>

      {/* Mid-Month Forecast Alert */}
      {budget.isForecastingOverBudget && (
        <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            <b>Mid-Month Forecast:</b> At current velocity, projected to hit{" "}
            <b>{formatMoney(budget.projectedMonthEndSpend || 0, currency)}</b> by month end.
          </span>
        </div>
      )}

      {/* Inline Edit Form */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs animate-in fade-in">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
              Monthly Limit ({currency})
            </label>
            <input
              type="number"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="w-full bg-secondary border rounded-lg px-2.5 py-1 text-xs outline-none"
            />
          </div>
          <div className="flex items-center justify-between pt-3">
            <label className="text-[11px] flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isRollover}
                onChange={(e) => setIsRollover(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span>Rollover</span>
            </label>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold hover:opacity-90 flex items-center space-x-1"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
