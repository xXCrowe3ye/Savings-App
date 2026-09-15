"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { RecurringBill } from "@/types";
import { SubscriptionCard } from "@/components/recurring/SubscriptionCard";
import { BillCalendarView } from "@/components/recurring/BillCalendarView";
import { BillModal } from "@/components/recurring/BillModal";
import {
  Calendar,
  List,
  AlertTriangle,
  Plus,
  Zap,
  Sparkles,
  Search,
  Receipt,
} from "lucide-react";

export default function RecurringPage() {
  const { recurring, currency } = useApp();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filter, setFilter] = useState<"all" | "active" | "alerts">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<RecurringBill | null>(null);

  const handleOpenAdd = () => {
    setBillToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bill: RecurringBill) => {
    setBillToEdit(bill);
    setIsModalOpen(true);
  };

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

  const filteredBills = recurring.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "active") return b.status === "active";
    if (filter === "alerts") {
      const isHike = Boolean(b.previousAmount && b.amount > b.previousAmount);
      const isUnused = Boolean(
        b.lastActiveDate &&
          Math.floor(
            (Date.now() - new Date(b.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
          ) >= 60
      );
      return isHike || isUnused;
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Summary */}
      <div data-tour="recurring-hero" className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white border border-indigo-500/20 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base">Recurring Subscriptions</h2>
          </div>

          <div className="flex items-center space-x-2">
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

            {/* Add Bill Button */}
            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bill</span>
            </button>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-3xl font-extrabold tracking-tight text-white">
            {formatMoney(totalMonthly, currency)}
            <span className="text-sm font-normal text-white/60 ml-1.5">/ month</span>
          </div>
          <p className="text-xs text-white/70 mt-0.5">
            Across {recurring.filter((b) => b.status === "active").length} active subscriptions &amp; monthly lease bills
          </p>
        </div>

        {/* Anomaly / Unused Flag Counter */}
        {(priceHikeCount > 0 || unusedCount > 0) && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-white/90">
                {priceHikeCount > 0 && `${priceHikeCount} price hike detected. `}
                {unusedCount > 0 && `${unusedCount} dormant subscription flagged.`}
              </span>
            </div>
            <button
              onClick={() => setFilter("alerts")}
              className="text-[11px] font-bold text-amber-300 underline hover:text-amber-200"
            >
              Filter Needs Review
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar (List Mode) */}
      {viewMode === "list" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filter === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({recurring.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filter === "active"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Active ({recurring.filter((b) => b.status === "active").length})
            </button>
            {(priceHikeCount > 0 || unusedCount > 0) && (
              <button
                onClick={() => setFilter("alerts")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                  filter === "alerts"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Needs Review ({priceHikeCount + unusedCount})</span>
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-card border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 w-full sm:w-44"
            />
          </div>
        </div>
      )}

      {/* Main View: Calendar or List */}
      {viewMode === "calendar" ? (
        <BillCalendarView bills={recurring} onEdit={(b) => handleOpenEdit(b)} />
      ) : (
        <div className="space-y-2.5">
          {filteredBills.length === 0 ? (
            <div className="p-8 border-2 border-dashed rounded-3xl text-center space-y-3 bg-card/50">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">No Recurring Bills Found</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Add your rent, subscriptions, wifi, and utility bills to stay ahead of upcoming due dates.
                </p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Bill</span>
              </button>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <SubscriptionCard
                key={bill.id}
                bill={bill}
                onEdit={(b) => handleOpenEdit(b)}
              />
            ))
          )}
        </div>
      )}

      {/* Bill Add / Edit Modal */}
      <BillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        billToEdit={billToEdit}
      />
    </div>
  );
}
