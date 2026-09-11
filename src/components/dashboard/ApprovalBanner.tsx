"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { AlertTriangle, Check, ShieldAlert } from "lucide-react";

export function ApprovalBanner() {
  const { transactions, currentUser, approveTransaction, currency } = useApp();

  // Find expenses >= $200 needing approval
  const pendingApprovals = transactions.filter(
    (t) => t.needsApproval && !t.approvedByPartner
  );

  if (pendingApprovals.length === 0) return null;

  return (
    <div className="space-y-2">
      {pendingApprovals.map((tx) => {
        const partnerName = tx.paidBy === "partner_a" ? "Alex" : "Sam";
        const isMyExpense = tx.paidBy === currentUser.partnerKey;

        return (
          <div
            key={tx.id}
            className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between animate-in slide-in-from-top-2 duration-300"
          >
            <div className="flex items-start space-x-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    High Expense Alert (&gt; $200)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <b>{partnerName}</b> logged <b>{formatMoney(tx.amount, currency)}</b> for &quot;{tx.description}&quot;
                </p>
                {tx.notes && (
                  <p className="text-[11px] italic text-muted-foreground/80 mt-0.5">
                    &ldquo;{tx.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div>
              {isMyExpense ? (
                <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Pending Partner
                </span>
              ) : (
                <button
                  onClick={() => approveTransaction(tx.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all flex items-center space-x-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Acknowledge</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
