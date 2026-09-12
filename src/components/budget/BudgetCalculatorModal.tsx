"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { CURRENCIES, formatMoney } from "@/lib/utils";
import { X, Sparkles, Scale, Check, ShieldCheck, HeartHandshake, PiggyBank, ArrowRight } from "lucide-react";

interface BudgetCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BudgetCalculatorModal({ isOpen, onClose }: BudgetCalculatorModalProps) {
  const { metrics, currency, refreshData, triggerConfetti } = useApp();
  const baselineIncome = metrics?.combinedTotalIncome || 0;

  const [income, setIncome] = useState(baselineIncome > 0 ? baselineIncome.toString() : "5000");
  const [needsPct, setNeedsPct] = useState(50);
  const [wantsPct, setWantsPct] = useState(30);
  const [savingsPct, setSavingsPct] = useState(20);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const numIncome = parseFloat(income) || 0;
  const needsAmount = Math.round((numIncome * needsPct) / 100);
  const wantsAmount = Math.round((numIncome * wantsPct) / 100);
  const savingsAmount = Math.round((numIncome * savingsPct) / 100);

  const handleApplyRecommended = async () => {
    setIsApplying(true);
    try {
      // Create recommended default category budgets based on 50/30 distribution
      const recommendedBudgets = [
        { category: "Housing & Rent", monthlyLimit: Math.round(needsAmount * 0.55), icon: "Home" },
        { category: "Groceries", monthlyLimit: Math.round(needsAmount * 0.25), icon: "Utensils" },
        { category: "Utilities & Bills", monthlyLimit: Math.round(needsAmount * 0.20), icon: "Zap" },
        { category: "Food & Dining", monthlyLimit: Math.round(wantsAmount * 0.45), icon: "Coffee" },
        { category: "Entertainment", monthlyLimit: Math.round(wantsAmount * 0.30), icon: "Film" },
        { category: "Shopping & Personal", monthlyLimit: Math.round(wantsAmount * 0.25), icon: "ShoppingBag" },
      ];

      for (const b of recommendedBudgets) {
        await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...b,
            rolloverEnabled: true,
            alertThreshold: 0.9,
          }),
        });
      }

      await refreshData();
      triggerConfetti();
      onClose();
    } catch (err) {
      console.error("Failed to apply framework budgets:", err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-card border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">50/30/20 Smart Budget Tool</h3>
              <p className="text-xs text-muted-foreground">Optimal couple allocation framework</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Monthly Income Input */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Joint Monthly Net Income ({CURRENCIES[currency]?.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                {CURRENCIES[currency]?.symbol}
              </span>
              <input
                type="number"
                step="50"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-base font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* 3 Pillar Cards */}
          <div className="space-y-2.5">
            {/* Needs */}
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-300">50% Needs &amp; Essentials</h4>
                  <p className="text-[10px] text-muted-foreground">Rent, groceries, utilities, transit</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                  {formatMoney(needsAmount, currency)}
                </span>
                <span className="text-[10px] text-muted-foreground block">/ month</span>
              </div>
            </div>

            {/* Wants */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-300">30% Wants &amp; Lifestyle</h4>
                  <p className="text-[10px] text-muted-foreground">Dining out, hobbies, shopping, entertainment</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  {formatMoney(wantsAmount, currency)}
                </span>
                <span className="text-[10px] text-muted-foreground block">/ month</span>
              </div>
            </div>

            {/* Savings */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-300">20% Joint Savings &amp; Goals</h4>
                  <p className="text-[10px] text-muted-foreground">Emergency fund, vacation, investments</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(savingsAmount, currency)}
                </span>
                <span className="text-[10px] text-muted-foreground block">/ month</span>
              </div>
            </div>
          </div>

          {/* Quick Auto-Deploy */}
          <button
            onClick={handleApplyRecommended}
            disabled={isApplying || numIncome <= 0}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 text-white font-bold text-xs shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isApplying ? "Deploying Categories..." : "Auto-Generate Category Budgets"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
