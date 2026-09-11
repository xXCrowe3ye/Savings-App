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
  const { currency, boostGoal, partnerAName, partnerBName } = useApp();
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
              <p className="text-xs text-muted-foreground">{goal.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleBoost} className="mt-4 space-y-4">
          {/* Quick Amount Chips */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Select or Enter Boost Amount
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(q.toString())}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    amount === q.toString()
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }`}
                >
                  {formatMoney(q, currency)}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                {CURRENCIES[currency]?.symbol}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-base font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Partner Contribution Assignment */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Credit Boost Towards
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPartnerKey("both")}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                  partnerKey === "both"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
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
                {partnerAName} Only
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
                {partnerBName} Only
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
