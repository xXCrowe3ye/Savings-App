"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { CURRENCIES, formatMoney } from "@/lib/utils";
import {
  X,
  Sparkles,
  PieChart,
  Utensils,
  Coffee,
  Car,
  Home,
  Film,
  Zap,
  ShoppingBag,
  HeartPulse,
  Tag,
  Loader2,
  Check,
} from "lucide-react";

interface BudgetWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_TEMPLATES = [
  { name: "Groceries", icon: "Utensils", defaultLimit: 600 },
  { name: "Food & Dining", icon: "Coffee", defaultLimit: 400 },
  { name: "Housing & Rent", icon: "Home", defaultLimit: 1800 },
  { name: "Transportation", icon: "Car", defaultLimit: 300 },
  { name: "Utilities & Wifi", icon: "Zap", defaultLimit: 250 },
  { name: "Entertainment", icon: "Film", defaultLimit: 200 },
  { name: "Shopping", icon: "ShoppingBag", defaultLimit: 250 },
  { name: "Health & Fitness", icon: "HeartPulse", defaultLimit: 150 },
  { name: "Personal & Gifts", icon: "Tag", defaultLimit: 150 },
];

export function BudgetWizardModal({ isOpen, onClose }: BudgetWizardModalProps) {
  const { currency, budgets, refreshData, triggerConfetti } = useApp();

  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [icon, setIcon] = useState("Tag");
  const [rolloverEnabled, setRolloverEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectTemplate = (tpl: typeof CATEGORY_TEMPLATES[0]) => {
    setCategory(tpl.name);
    setIcon(tpl.icon);
    setMonthlyLimit(tpl.defaultLimit.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(monthlyLimit);
    if (!category.trim() || isNaN(numLimit) || numLimit <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category.trim(),
          monthlyLimit: numLimit,
          icon,
          rolloverEnabled,
          alertThreshold: 0.9,
        }),
      });

      if (res.ok) {
        await refreshData();
        triggerConfetti();
        onClose();
        setCategory("");
        setMonthlyLimit("");
      }
    } catch (err) {
      console.error("Failed to add category budget:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-card border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">New Category Budget</h3>
              <p className="text-xs text-muted-foreground">Set spending guardrail &amp; rollover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
            Quick Category Templates
          </label>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => selectTemplate(tpl)}
                className={`px-3 py-2 rounded-2xl border text-left shrink-0 transition-all flex items-center space-x-2 ${
                  category === tpl.name
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-secondary/60 hover:bg-secondary text-foreground"
                }`}
              >
                <div>
                  <div className="text-xs font-bold leading-none">{tpl.name}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">
                    {CURRENCIES[currency]?.symbol}{tpl.defaultLimit}/mo
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Category Name */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Groceries, Gym & Fitness, Travel"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Monthly Limit ({CURRENCIES[currency]?.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                {CURRENCIES[currency]?.symbol}
              </span>
              <input
                type="number"
                step="1"
                required
                placeholder="500"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-base font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Auto-Rollover */}
          <div className="p-3 rounded-2xl bg-secondary/50 border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">Monthly Rollover</span>
              <span className="text-[11px] text-muted-foreground">
                Unspent funds carry forward to boost next month&apos;s limit
              </span>
            </div>
            <input
              type="checkbox"
              checked={rolloverEnabled}
              onChange={(e) => setRolloverEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !category.trim() || !monthlyLimit}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-500 text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Category Budget</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
