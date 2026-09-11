"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { Scale, CheckCircle2, ArrowRightLeft, Sparkles } from "lucide-react";

export function DebtSettlementCard() {
  const { currentUser, metrics, currency, refreshData, triggerConfetti } = useApp();
  const [isSettling, setIsSettling] = useState(false);

  const iou = metrics?.netIOU;
  const isSettled = !iou || iou.amount <= 0;

  const partnerAName = currentUser.partnerKey === "partner_a" ? (currentUser.nickname || currentUser.name || "Partner A") : "Partner A";
  const partnerBName = currentUser.partnerKey === "partner_b" ? (currentUser.nickname || currentUser.name || "Partner B") : "Partner B";

  const debtorName = iou?.from === "partner_a" ? partnerAName : partnerBName;
  const creditorName = iou?.to === "partner_a" ? partnerAName : partnerBName;

  const handleSettle = async () => {
    if (!iou || iou.amount <= 0) return;
    setIsSettling(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: iou.amount,
          description: `IOU Settlement: ${debtorName} paid ${creditorName}`,
          category: "Personal",
          date: new Date().toISOString().split("T")[0],
          paidBy: iou.from,
          splitRatio: "0/100", // pure individual settlement
          notes: "Settled up via Babi-Savings IOU tracker",
        }),
      });

      if (res.ok) {
        await refreshData();
        triggerConfetti();
      }
    } catch (err) {
      console.error("Settlement error:", err);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Couple IOU & Split Tracker
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          Auto-balanced
        </span>
      </div>

      {isSettled ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-xs font-bold">You two are completely square!</p>
              <p className="text-[10px] opacity-80">All shared expenses are evenly balanced.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border">
          <div>
            <div className="text-xs text-muted-foreground flex items-center space-x-1">
              <span className="font-semibold text-foreground">{debtorName}</span>
              <span>owes</span>
              <span className="font-semibold text-foreground">{creditorName}</span>
            </div>
            <div className="text-xl font-extrabold text-foreground mt-0.5">
              {formatMoney(iou.amount, currency)}
            </div>
          </div>

          <button
            onClick={handleSettle}
            disabled={isSettling}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{isSettling ? "Settling..." : "Settle Up"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
