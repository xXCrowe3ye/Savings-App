"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { SubscriptionCard } from "@/components/recurring/SubscriptionCard";
import { BillCalendarView } from "@/components/recurring/BillCalendarView";
import { Calendar, List, AlertTriangle, ShieldCheck } from "lucide-react";

export default function RecurringPage() {
  const { recurring, currency } = useApp();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const totalMonthly = recurring
    .filter((b) => b.frequency === "monthly" && b.status !== "cancelled")
    .reduce((acc, b) => acc + b.amount, 0);

  const priceHikeCount = recurring.filter(
    (b) => b.previousAmount && b.amount > b.previousAmount
  ).length;

  const unusedCount = recurring.filter((b) => {
    if (!b.lastActiveDate) return false;
    const diffDays = Math.floor(
      (Date.now() - new Date(b.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 60;
  }).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Summary */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white border border-indigo-500/20 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base">Recurring Subscriptions</h2>
          </div>

          {/* View Toggle */}
          <div className="flex bg-white/10 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-white/70"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                viewMode === "calendar" ? "bg-white text-slate-900 shadow-xs" : "text-white/70"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-3xl font-extrabold tracking-tight text-white">
            {formatMoney(totalMonthly, currency)}
            <span className="text-sm font-normal text-white/60 ml-1.5">/ month</span>
          </div>
          <p className="text-xs text-white/70 mt-0.5">
            Across {recurring.length} recurring services &amp; monthly lease bills
          </p>
        </div>

        {/* Anomaly / Unused Flag Counter */}
        {(priceHikeCount > 0 || unusedCount > 0) && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center space-x-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-white/90">
              {priceHikeCount > 0 && `${priceHikeCount} price hike detected. `}
              {unusedCount > 0 && `${unusedCount} unused subscription flagged.`}
            </span>
          </div>
        )}
      </div>

      {/* Main View: Calendar or List */}
      {viewMode === "calendar" ? (
        <BillCalendarView bills={recurring} />
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Subscriptions &amp; Bills List
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {recurring.length} items
            </span>
          </div>

          {recurring.map((bill) => (
            <SubscriptionCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  );
}
