"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { CURRENCIES, formatMoney } from "@/lib/utils";
import { X, DollarSign, Sparkles, Check, Loader2 } from "lucide-react";

interface EditIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditIncomeModal({ isOpen, onClose }: EditIncomeModalProps) {
  const { metrics, currency, updateSharedIncome, refreshData } = useApp();
  const currentIncome = metrics?.combinedTotalIncome || 7800;

  const [incomeAmount, setIncomeAmount] = useState(currentIncome.toString());
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const presets = [5000, 7500, 10000, 15000];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(incomeAmount);
    if (isNaN(num) || num < 0) return;

    try {
      setIsSaving(true);
      await updateSharedIncome(num);
      await refreshData();
      onClose();
    } catch (err) {
      console.error("Failed to update shared income:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-sm bg-card border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Combined Monthly Income</h3>
              <p className="text-xs text-muted-foreground">Adjust couple cashflow baseline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Quick Select Preset
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setIncomeAmount(p.toString())}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    incomeAmount === p.toString()
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-secondary/40 hover:bg-secondary text-foreground"
                  }`}
                >
                  {formatMoney(p, currency)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Monthly Household Income
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                {CURRENCIES[currency]?.symbol}
              </span>
              <input
                type="number"
                step="50"
                required
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-base font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Used to calculate joint savings rate, cashflow runway, and projected surplus.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving || !incomeAmount}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Shared Income</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
