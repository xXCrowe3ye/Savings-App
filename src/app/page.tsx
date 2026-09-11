"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { SafeToSpendCard } from "@/components/dashboard/SafeToSpendCard";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { DebtSettlementCard } from "@/components/dashboard/DebtSettlementCard";
import { ApprovalBanner } from "@/components/dashboard/ApprovalBanner";
import { SpendingDonut } from "@/components/dashboard/SpendingDonut";
import { CashflowTrend } from "@/components/dashboard/CashflowTrend";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { ArrowRight, History, Filter } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { transactions, currentUser } = useApp();
  const [filter, setFilter] = useState<"all" | "mine" | "partner" | "approvals">("all");

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "mine") return t.paidBy === currentUser.partnerKey;
    if (filter === "partner") return t.paidBy !== currentUser.partnerKey;
    if (filter === "approvals") return t.needsApproval && !t.approvedByPartner;
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Safe-to-Spend Daily Allowance Hero */}
      <SafeToSpendCard />

      {/* Large Expense Approval Badge (if pending) */}
      <ApprovalBanner />

      {/* 4 Core Metric Cards */}
      <MetricCards />

      {/* Couple IOU & Non-50/50 Split Settlement */}
      <DebtSettlementCard />

      {/* Interactive Charts: Category Donut & Cashflow Trend */}
      <div className="space-y-4">
        <SpendingDonut />
        <CashflowTrend />
      </div>

      {/* Recent Transactions Module */}
      <div className="bg-card border rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Recent Joint Expenses
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {filteredTransactions.length} logs
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-primary text-white shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilter("mine")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === "mine"
                ? "bg-primary text-white shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Paid by Me
          </button>
          <button
            onClick={() => setFilter("partner")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === "partner"
                ? "bg-primary text-white shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Paid by Partner
          </button>
          <button
            onClick={() => setFilter("approvals")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === "approvals"
                ? "bg-primary text-white shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Needs Approval
          </button>
        </div>

        {/* Transactions list */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No transactions match this filter.
            </div>
          ) : (
            filteredTransactions.slice(0, 10).map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
