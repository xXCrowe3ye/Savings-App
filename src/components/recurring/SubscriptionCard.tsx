"use client";

import React from "react";
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
} from "lucide-react";

interface SubscriptionCardProps {
  bill: RecurringBill & {
    isPriceHike?: boolean;
    priceHikeDiff?: number;
    isUnusedWarning?: boolean;
    daysInactive?: number;
  };
}

const CATEGORY_ICONS: Record<string, any> = {
  Housing: Home,
  Entertainment: Tv,
  "Health & Fitness": Activity,
  Utilities: Wifi,
};

export function SubscriptionCard({ bill }: SubscriptionCardProps) {
  const { currency, getPartnerName } = useApp();

  const Icon = CATEGORY_ICONS[bill.category] || Calendar;
  const isPartnerA = bill.paidBy === "partner_a";
  const partnerName = getPartnerName(bill.paidBy);

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPartnerA
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div>
            <h4 className="font-bold text-xs text-foreground">{bill.title}</h4>
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

        <div className="text-right">
          <div className="font-bold text-sm text-foreground">
            {formatMoney(bill.amount, currency)}
          </div>
          <span className="text-[10px] text-muted-foreground">/ month</span>
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
    </div>
  );
}
