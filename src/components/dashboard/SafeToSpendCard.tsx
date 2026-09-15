"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { ShieldCheck, Calendar, Zap, AlertCircle } from "lucide-react";

export function SafeToSpendCard() {
  const { metrics, currency } = useApp();

  const safeDaily = metrics?.safeToSpendDaily || 0;
  const daysLeft = metrics?.daysRemainingInMonth || 1;

  // Status gauge
  const isHealthy = safeDaily >= 40;
  const isTight = safeDaily < 20;

  return (
    <div data-tour="safe-to-spend" className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-indigo-900/90 via-indigo-950 to-slate-950 text-white shadow-xl border border-indigo-500/20">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-36 h-36 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>Daily Spending Allowance</span>
          </div>

          <div className="flex items-center space-x-1 text-xs text-white/70">
            <Calendar className="w-3.5 h-3.5" />
            <span>{daysLeft} days left</span>
          </div>
        </div>

        {/* Hero Daily Amount */}
        <div className="mt-3">
          <div className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
            {formatMoney(safeDaily, currency)}
            <span className="text-sm font-normal text-white/60 ml-1.5">/ day</span>
          </div>
          <p className="text-xs text-white/70 mt-1">
            Safe pace to finish this month comfortably within your joint budget.
          </p>
        </div>

        {/* Status Indicator Pill */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <div
              className={`w-2 h-2 rounded-full ${safeDaily <= 0
                  ? "bg-slate-400"
                  : isTight
                    ? "bg-amber-400 animate-ping"
                    : "bg-teal-400"
                }`}
            />
            <span className="text-white/80 font-medium">
              {safeDaily <= 0
                ? "Set monthly income or category budgets to calculate pace"
                : isTight
                  ? "Budget tight — conserve discretionary spend"
                  : "Pace is optimal and on track"}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-teal-300 font-semibold text-[11px]">
            <Zap className="w-3 h-3" />
            <span>Smart Forecast</span>
          </div>
        </div>
      </div>
    </div>
  );
}
