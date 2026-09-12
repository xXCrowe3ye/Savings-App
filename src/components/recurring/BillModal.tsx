"use client";

import React, { useState, useEffect } from "react";
import { RecurringBill, PartnerKey } from "@/types";
import { useApp } from "@/context/AppContext";
import { CURRENCIES, formatMoney } from "@/lib/utils";
import {
  X,
  Calendar,
  DollarSign,
  Trash2,
  Check,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billToEdit?: RecurringBill | null;
}

const CATEGORIES = [
  "Utilities",
  "Housing",
  "Entertainment",
  "Health & Fitness",
  "Insurance",
  "Subscription",
  "Other",
];

const QUICK_PRESETS = [
  { title: "Netflix", amount: 15.49, category: "Entertainment" },
  { title: "Spotify Family", amount: 16.99, category: "Entertainment" },
  { title: "Home Internet (Fiber)", amount: 70.0, category: "Utilities" },
  { title: "Apartment Rent", amount: 1800.0, category: "Housing" },
  { title: "Electric & Power", amount: 95.0, category: "Utilities" },
  { title: "Gym Membership", amount: 50.0, category: "Health & Fitness" },
  { title: "iCloud 2TB Shared", amount: 9.99, category: "Subscription" },
];

export function BillModal({ isOpen, onClose, billToEdit }: BillModalProps) {
  const { currency, currentUser, partnerAName, partnerBName, refreshData, triggerConfetti } = useApp();

  const isEditing = Boolean(billToEdit);

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "yearly" | "weekly">("monthly");
  const [billingDay, setBillingDay] = useState(1);
  const [category, setCategory] = useState("Utilities");
  const [paidBy, setPaidBy] = useState<PartnerKey | "shared">("shared");
  const [status, setStatus] = useState<RecurringBill["status"]>("active");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (billToEdit) {
      setTitle(billToEdit.title);
      setAmount(billToEdit.amount.toString());
      setFrequency(billToEdit.frequency || "monthly");
      setBillingDay(billToEdit.billingDay || 1);
      setCategory(billToEdit.category || "Utilities");
      setPaidBy(billToEdit.paidBy || "shared");
      setStatus(billToEdit.status || "active");
      setNotes(billToEdit.notes || "");
      setConfirmDelete(false);
    } else {
      setTitle("");
      setAmount("");
      setFrequency("monthly");
      setBillingDay(1);
      setCategory("Utilities");
      setPaidBy("shared");
      setStatus("active");
      setNotes("");
      setConfirmDelete(false);
    }
  }, [billToEdit, currentUser.partnerKey, isOpen]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;

  const handlePresetSelect = (preset: typeof QUICK_PRESETS[0]) => {
    setTitle(preset.title);
    setAmount(preset.amount.toString());
    setCategory(preset.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || parsedAmount <= 0) return;

    try {
      setIsSubmitting(true);
      if (isEditing && billToEdit) {
        // Check if price changed to record previous amount
        const previousAmount =
          parsedAmount !== billToEdit.amount ? billToEdit.amount : billToEdit.previousAmount;

        const res = await fetch("/api/recurring", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: billToEdit.id,
            title: title.trim(),
            amount: parsedAmount,
            frequency,
            billingDay,
            category,
            paidBy,
            status,
            notes: notes.trim() || undefined,
            previousAmount,
          }),
        });

        if (res.ok) {
          await refreshData();
          onClose();
        }
      } else {
        const res = await fetch("/api/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            amount: parsedAmount,
            frequency,
            billingDay,
            category,
            paidBy,
            status,
            notes: notes.trim() || undefined,
          }),
        });

        if (res.ok) {
          await refreshData();
          triggerConfetti();
          onClose();
        }
      }
    } catch (err) {
      console.error("Failed to save recurring bill:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!billToEdit) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/recurring?id=${billToEdit.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshData();
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete bill:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkActive = async () => {
    if (!billToEdit) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: billToEdit.id,
          lastActiveDate: new Date().toISOString().split("T")[0],
        }),
      });
      if (res.ok) {
        await refreshData();
        onClose();
      }
    } catch (err) {
      console.error("Failed to mark active:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-card border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isEditing ? "Edit Recurring Bill" : "Add Recurring Bill / Subscription"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEditing ? "Update schedule, amount, or cancel bill" : "Track shared subscriptions & renewal dates"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets for New Bills */}
        {!isEditing && (
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
              Quick Suggestions
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {QUICK_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.title}
                  onClick={() => handlePresetSelect(p)}
                  className="text-xs px-2.5 py-1 rounded-xl border bg-secondary/50 hover:bg-secondary text-foreground whitespace-nowrap transition-all"
                >
                  {p.title} ({formatMoney(p.amount, currency)})
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Bill / Subscription Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix, Internet, Apartment Rent, Gym"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-medium"
            />
          </div>

          {/* Amount & Frequency Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Amount ({CURRENCIES[currency]?.symbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-bold text-sm text-muted-foreground">
                  {CURRENCIES[currency]?.symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-base font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 capitalize font-medium"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Billing Day & Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Billing Day of Month (1 - 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={billingDay}
                onChange={(e) => setBillingDay(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Split & Responsibility Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Payment Responsibility &amp; Split
              </label>
              {paidBy === "shared" && parsedAmount > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(parsedAmount / 2, currency)} each
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaidBy("shared")}
                className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center text-center ${
                  paidBy === "shared"
                    ? "bg-gradient-to-tr from-indigo-600 to-teal-500 text-white border-teal-500 shadow-sm"
                    : "bg-background border-border hover:bg-secondary text-foreground"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Shared 50/50</span>
                  {paidBy === "shared" && <Check className="w-3 h-3" />}
                </div>
                <span className={`text-[10px] mt-0.5 ${paidBy === "shared" ? "text-white/90" : "text-muted-foreground"}`}>
                  Split equally
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaidBy("partner_a")}
                className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center text-center ${
                  paidBy === "partner_a"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-background border-border hover:bg-secondary text-foreground"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span className="truncate max-w-[90px]">{partnerAName}</span>
                  {paidBy === "partner_a" && <Check className="w-3 h-3" />}
                </div>
                <span className={`text-[10px] mt-0.5 ${paidBy === "partner_a" ? "text-white/90" : "text-muted-foreground"}`}>
                  100% {partnerAName}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaidBy("partner_b")}
                className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center text-center ${
                  paidBy === "partner_b"
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-background border-border hover:bg-secondary text-foreground"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span className="truncate max-w-[90px]">{partnerBName}</span>
                  {paidBy === "partner_b" && <Check className="w-3 h-3" />}
                </div>
                <span className={`text-[10px] mt-0.5 ${paidBy === "partner_b" ? "text-white/90" : "text-muted-foreground"}`}>
                  100% {partnerBName}
                </span>
              </button>
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Subscription Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["active", "paused", "cancelled"] as const).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                    status === st
                      ? st === "active"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : st === "paused"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : "bg-secondary/40 border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Account Reference or Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Account #1234, auto-pay enabled"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Active / Dormant reset action if editing */}
          {isEditing && (
            <div className="p-3 rounded-2xl bg-secondary/60 border border-border/80 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-semibold block text-foreground">Activity Tracker</span>
                <span className="text-[11px] text-muted-foreground">
                  Last active: {billToEdit?.lastActiveDate || "Recently active"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleMarkActive}
                className="px-2.5 py-1 bg-background hover:bg-secondary text-xs rounded-xl border font-medium flex items-center space-x-1"
                title="Reset the 60-day unused subscription warning"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mark Used Today</span>
              </button>
            </div>
          )}

          {/* Submit & Delete Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {isEditing && (
              <div className="shrink-0">
                {confirmDelete ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-3 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all flex items-center space-x-1"
                  >
                    <span>Confirm Delete?</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Delete Bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || parsedAmount <= 0}
              className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : `Add Bill (${formatMoney(parsedAmount, currency)}/${frequency === "monthly" ? "mo" : frequency})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
