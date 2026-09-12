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
  ShoppingBag,
  HeartPulse,
  Tag,
  Repeat,
  AlertTriangle,
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Loader2,
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
  Housing: Home,
  "Housing & Utilities": Home,
  Entertainment: Film,
  Utilities: Zap,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Personal: Tag,
};

export function CategoryBudgetBar({ budget }: CategoryBudgetBarProps) {
  const { currency, transactions, refreshData } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newLimit, setNewLimit] = useState(budget.monthlyLimit.toString());
  const [isRollover, setIsRollover] = useState(budget.rolloverEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const Icon = CATEGORY_ICONS[budget.category] || Tag;
  const totalLimit = budget.totalAvailable ?? (budget.monthlyLimit + (budget.rolloverEnabled ? budget.rolloverAccumulated : 0));
  const spentPercent = budget.spentPercentage ?? (totalLimit > 0 ? Math.round((budget.spentAmount / totalLimit) * 100) : 0);

  // Status color styles
  const statusColor = budget.statusColor || (spentPercent >= 90 ? "red" : spentPercent >= 75 ? "yellow" : "green");
  const barColor =
    statusColor === "red"
      ? "bg-rose-500"
      : statusColor === "yellow"
      ? "bg-amber-500"
      : "bg-emerald-500";

  // Filter current month transactions under this category
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const categoryTransactions = transactions.filter(
    (t) => (t.type || "expense") === "expense" && t.category === budget.category && t.date?.startsWith(currentMonthPrefix)
  );

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numLimit = parseFloat(newLimit);
    if (isNaN(numLimit) || numLimit <= 0) return;

    setIsSaving(true);
    try {
      await fetch("/api/budgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: budget.id,
          monthlyLimit: numLimit,
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/budgets?id=${budget.id}`, {
        method: "DELETE",
      });
      await refreshData();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to delete budget:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-card border rounded-3xl p-4 shadow-xs transition-all hover:border-primary/30">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2.5 cursor-pointer flex-1 select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-foreground shrink-0 shadow-2xs">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-bold text-xs text-foreground">{budget.category}</h4>
              {budget.rolloverEnabled && (
                <span className="flex items-center space-x-0.5 px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold">
                  <Repeat className="w-2.5 h-2.5" />
                  <span>+{formatMoney(budget.rolloverAccumulated, currency)}</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              {formatMoney(budget.spentAmount, currency)} of {formatMoney(totalLimit, currency)} limit
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
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
            onClick={() => {
              setIsEditing(!isEditing);
              setShowDeleteConfirm(false);
            }}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            title="Edit Budget"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden mt-2.5">
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
            <b>Velocity Warning:</b> Projected to reach <b>{formatMoney(budget.projectedMonthEndSpend || 0, currency)}</b> by end of month.
          </span>
        </div>
      )}

      {/* Inline Edit Form */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t text-xs animate-in fade-in">
          {showDeleteConfirm ? (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
              <p className="font-bold text-xs text-rose-800 dark:text-rose-300">
                Delete &quot;{budget.category}&quot; budget?
              </p>
              <div className="flex justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center space-x-1"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Delete</span>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                    Monthly Limit ({currency})
                  </label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full bg-background border rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="p-2 rounded-xl bg-secondary/50 border flex items-center justify-between cursor-pointer">
                    <span className="text-[11px] font-medium">Auto-Rollover</span>
                    <input
                      type="checkbox"
                      checked={isRollover}
                      onChange={(e) => setIsRollover(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Category</span>
                </button>

                <div className="flex space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 flex items-center space-x-1"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expanded Category Transactions Drawer */}
      {isExpanded && !isEditing && (
        <div className="mt-3 pt-3 border-t text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>This Month&apos;s Purchases ({categoryTransactions.length})</span>
            <span>Total: {formatMoney(budget.spentAmount, currency)}</span>
          </div>

          {categoryTransactions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic py-1 text-center">
              No transactions logged in {budget.category} yet this month.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {categoryTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2 rounded-xl bg-secondary/50 border flex items-center justify-between text-[11px]"
                >
                  <div>
                    <span className="font-semibold text-foreground block truncate max-w-[180px]">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {tx.date} • {tx.paidBy === "partner_a" ? "Partner A" : "Partner B"}
                    </span>
                  </div>
                  <div className="text-right font-bold text-foreground">
                    {formatMoney(tx.amount, currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
