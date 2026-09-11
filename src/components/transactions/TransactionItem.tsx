"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import {
  Utensils,
  Coffee,
  Car,
  Home,
  Film,
  Zap,
  ShoppingBag,
  HeartPulse,
  Tag,
  PiggyBank,
  Receipt,
  MessageSquare,
  ChevronDown,
  Check,
  Trash2,
} from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
}

const CATEGORY_ICONS: Record<string, any> = {
  Groceries: Utensils,
  "Food & Dining": Coffee,
  Housing: Home,
  Transportation: Car,
  Entertainment: Film,
  Utilities: Zap,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Personal: Tag,
};

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { currency, updateTransactionNotes, getPartnerName, refreshData } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newNote, setNewNote] = useState(transaction.notes || "");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const isSavings = transaction.type === "savings";
  const Icon = isSavings ? PiggyBank : CATEGORY_ICONS[transaction.category] || Tag;
  const isPartnerA = transaction.paidBy === "partner_a";
  const partnerName = getPartnerName(transaction.paidBy);

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    await updateTransactionNotes(transaction.id, newNote);
    setIsSavingNote(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await fetch(`/api/transactions?id=${transaction.id}`, { method: "DELETE" });
      await refreshData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className={`p-3 bg-card border rounded-2xl hover:border-primary/30 transition-all shadow-2xs ${
      isSavings ? "border-emerald-500/30 bg-emerald-500/[0.02]" : ""
    }`}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSavings
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : isPartnerA
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h5 className="font-semibold text-xs tracking-tight text-foreground">
                {transaction.description}
              </h5>
              {isSavings && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Savings
                </span>
              )}
              {transaction.receiptUrl && (
                <span title="Receipt attached">
                  <Receipt className="w-3.5 h-3.5 text-primary" />
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-muted-foreground mt-0.5">
              <span>{transaction.date}</span>
              <span>•</span>
              <span
                className={`font-semibold ${
                  isPartnerA
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-teal-600 dark:text-teal-400"
                }`}
              >
                {partnerName} {isSavings ? "saved" : "paid"}
              </span>
              {!isSavings && (
                <>
                  <span>•</span>
                  <span className="px-1.5 py-0.2 rounded bg-secondary text-[10px]">
                    {transaction.splitRatio}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`font-bold text-sm ${isSavings ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
            {isSavings ? "+" : ""}{formatMoney(transaction.amount, currency)}
          </div>
          {transaction.needsApproval && !transaction.approvedByPartner && (
            <span className="text-[10px] text-amber-500 font-bold block">
              Pending Acknowledgment
            </span>
          )}
        </div>
      </div>

      {/* Expanded Notes & Details Drawer */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t text-xs space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Category: {transaction.category}</span>
            {transaction.receiptUrl && (
              <a
                href={transaction.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold underline flex items-center space-x-1"
              >
                <Receipt className="w-3 h-3" />
                <span>View Receipt</span>
              </a>
            )}
          </div>

          {/* Shared Partner Note / Comment Thread */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center space-x-1 mb-1">
              <MessageSquare className="w-3 h-3" />
              <span>Partner Notes &amp; Comments</span>
            </label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ask 'What was this for?' or leave a note..."
                className="flex-1 bg-secondary text-xs rounded-xl px-2.5 py-1.5 border outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Delete Action */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleDelete}
              className="text-[11px] text-destructive hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete entry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
