"use client";

import React, { useState } from "react";
import { SavingsGoal, PartnerKey } from "@/types";
import { useApp } from "@/context/AppContext";
import { CURRENCIES, formatMoney } from "@/lib/utils";
import { X, Gift, Sparkles, Check } from "lucide-react";

interface WindfallBoostModalProps {
  goal: SavingsGoal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WindfallBoostModal({ goal, isOpen, onClose }: WindfallBoostModalProps) {
  const { currency, boostGoal } = useApp();
  const [amount, setAmount] = useState("100");
  const [partnerKey, setPartnerKey] = useState<PartnerKey | "both">("both");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !goal) return null;

  const quickAmounts = [50, 100, 250, 500];

  const handleBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;

    setIsSubmitting(true);
    await boostGoal(goal.id, num, partnerKey);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-sm bg-card border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Windfall Boost</h3>
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                {goal.emoji} {goal.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Pills */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
            Quick Amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => setAmount(q.toString())}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  amount === q.toString()
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-secondary/40 hover:bg-secondary text-foreground"
                }`}
              >
                +{CURRENCIES[currency]?.symbol}{q}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleBoost} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Custom Amount ({CURRENCIES[currency]?.symbol})
            </label>
            <input
              type="number"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-base font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Contribution Attribution */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Funded By
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPartnerKey("both")}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                  partnerKey === "both"
                    ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                    : "bg-secondary/40 hover:bg-secondary text-foreground"
                }`}
              >
                50/50 Both
              </button>
              <button
                type="button"
                onClick={() => setPartnerKey("partner_a")}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                  partnerKey === "partner_a"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-secondary/40 hover:bg-secondary text-foreground"
                }`}
              >
                Alex Only
              </button>
              <button
                type="button"
                onClick={() => setPartnerKey("partner_b")}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                  partnerKey === "partner_b"
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                    : "bg-secondary/40 hover:bg-secondary text-foreground"
                }`}
              >
                Sam Only
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Allocating..." : "Apply Boost to Goal"}
          </button>
        </form>
      </div>
    </div>
  );
}
