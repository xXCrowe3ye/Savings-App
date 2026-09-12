"use client";

import React, { useState } from "react";
import { RecurringBill } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import {
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Tv,
  Music,
  Activity,
  Wifi,
  Home,
  Edit2,
  Receipt,
  PauseCircle,
  XCircle,
  ShieldAlert,
  Loader2,
} from "lucide-react";

interface SubscriptionCardProps {
  bill: RecurringBill & {
    isPriceHike?: boolean;
    priceHikeDiff?: number;
    isUnusedWarning?: boolean;
    daysInactive?: number;
  };
  onEdit?: (bill: RecurringBill) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  Housing: Home,
  Entertainment: Tv,
  "Health & Fitness": Activity,
  Utilities: Wifi,
};

export function SubscriptionCard({ bill, onEdit }: SubscriptionCardProps) {
  const { currency, getPartnerName, logTransaction, refreshData, triggerConfetti } = useApp();
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const Icon = CATEGORY_ICONS[bill.category] || Calendar;
  const isPartnerA = bill.paidBy === "partner_a";
  const partnerName = getPartnerName(bill.paidBy);
  const isPaused = bill.status === "paused";
  const isCancelled = bill.status === "cancelled";

  // Quick 1-click action to log this bill as a transaction for this month
  const handleLogPayment = async () => {
    try {
      setIsLoggingPayment(true);
      await logTransaction({
        type: "expense",
        amount: bill.amount,
        description: `${bill.title} (${new Date().toLocaleString("default", { month: "short" })} bill)`,
        category: bill.category,
        date: new Date().toISOString().split("T")[0],
        paidBy: bill.paidBy,
        splitRatio: "50/50",
        notes: `Auto-logged from recurring bill: ${bill.title}`,
        isRecurring: true,
      });

      // Update lastBilledDate on the bill
      await fetch("/api/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bill.id,
          lastBilledDate: new Date().toISOString().split("T")[0],
          lastActiveDate: new Date().toISOString().split("T")[0],
        }),
      });

      await refreshData();
      triggerConfetti();
      setLoggedSuccess(true);
      setTimeout(() => setLoggedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to log bill payment:", err);
    } finally {
      setIsLoggingPayment(false);
    }
  };

  return (
    <div
      className={`bg-card border rounded-2xl p-4 shadow-xs space-y-2.5 transition-all ${
        isCancelled
          ? "opacity-60 bg-muted/30 border-dashed"
          : isPaused
          ? "border-amber-500/30 bg-amber-500/5"
          : "hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCancelled
                ? "bg-muted text-muted-foreground"
                : isPaused
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : isPartnerA
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-xs text-foreground">{bill.title}</h4>
              {isPaused && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  Paused
                </span>
              )}
              {isCancelled && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-400">
                  Cancelled
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-muted-foreground mt-0.5">
              <span>Day {bill.billingDay} of month</span>
              <span>•</span>
              <span
                className={`font-semibold ${
                  isPartnerA
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-teal-600 dark:text-teal-400"
                }`}
              >
                {partnerName} pays
              </span>
              <span>•</span>
              <span className="capitalize">{bill.frequency}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="text-right">
            <div className="font-bold text-sm text-foreground">
              {formatMoney(bill.amount, currency)}
            </div>
            <span className="text-[10px] text-muted-foreground">/ {bill.frequency === "monthly" ? "mo" : bill.frequency}</span>
          </div>

          {onEdit && (
            <button
              onClick={() => onEdit(bill)}
              className="p-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              title="Edit or Delete Recurring Bill"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inflation / Anomaly Alert */}
      {bill.isPriceHike && (
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] flex items-center space-x-1.5">
          <TrendingUp className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>
            <b>Inflation Alert:</b> Monthly charge increased by{" "}
            <b>+{formatMoney(bill.priceHikeDiff || 0, currency)}</b> (was {formatMoney(bill.previousAmount || 0, currency)}).
          </span>
        </div>
      )}

      {/* Unused Subscription Alert */}
      {bill.isUnusedWarning && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[11px] flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>
            <b>Unused Subscription Warning:</b> Not logged as used in <b>{bill.daysInactive} days</b>. Review if couple still needs this!
          </span>
        </div>
      )}

      {/* Bottom Bar: 1-Click Log Payment & Notes */}
      <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate max-w-[200px]">
          {bill.notes || (bill.lastBilledDate ? `Last logged: ${bill.lastBilledDate}` : `Renews on day ${bill.billingDay}`)}
        </span>

        {bill.status === "active" && (
          <button
            onClick={handleLogPayment}
            disabled={isLoggingPayment || loggedSuccess}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 ${
              loggedSuccess
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            }`}
          >
            {isLoggingPayment ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Logging...</span>
              </>
            ) : loggedSuccess ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Logged to Expenses!</span>
              </>
            ) : (
              <>
                <Receipt className="w-3 h-3" />
                <span>Log to Expenses</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
