"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { CURRENCIES, formatMoney, parseNaturalLanguageEntry, calculateRoundUp } from "@/lib/utils";
import { PartnerKey, SplitRatio, TransactionType } from "@/types";
import {
  X,
  Camera,
  Sparkles,
  Check,
  PiggyBank,
  Receipt,
  Coins,
  ArrowDownCircle,
  Loader2,
} from "lucide-react";

interface RapidLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Groceries",
  "Food & Dining",
  "Housing",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Health",
  "Personal",
];

export function RapidLogModal({ isOpen, onClose }: RapidLogModalProps) {
  const { currentUser, currency, logTransaction, goals, partnerAName, partnerBName } = useApp();

  // Mode: Expense vs Savings
  const [entryType, setEntryType] = useState<TransactionType>("expense");

  // Natural language entry state
  const [nlInput, setNlInput] = useState("");

  // Form states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidBy, setPaidBy] = useState<PartnerKey>(currentUser.partnerKey);
  const [splitRatio, setSplitRatio] = useState<SplitRatio>("50/50");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Active round-up goal check
  const activeRoundupGoal = goals.find((g) => g.roundupEnabled && g.status === "active");
  const parsedNumAmount = parseFloat(amount) || 0;
  const potentialRoundUp =
    entryType === "expense" && activeRoundupGoal && parsedNumAmount > 0
      ? calculateRoundUp(parsedNumAmount, activeRoundupGoal.roundupUnit || 1)
      : 0;

  // Handle Natural Language Parse
  const handleParseNl = (text: string) => {
    setNlInput(text);
    if (!text.trim()) return;
    const parsed = parseNaturalLanguageEntry(text);
    if (parsed.amount !== null) {
      setAmount(parsed.amount.toString());
    }
    if (parsed.description) {
      setDescription(parsed.description);
    }
    if (parsed.category) {
      setCategory(parsed.category);
    }
    if (parsed.date) {
      setDate(parsed.date);
    }
  };

  // Handle Receipt Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingReceipt(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setReceiptUrl(data.receiptUrl);
      }
    } catch (err) {
      console.error("Failed to upload receipt:", err);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Submit Transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parsedNumAmount <= 0) return;

    const finalDescription =
      entryType === "savings"
        ? description || `Deposit into ${goals.find((g) => g.id === selectedGoalId)?.title || "Savings"}`
        : description;

    if (!finalDescription) return;

    setIsSubmitting(true);
    await logTransaction({
      type: entryType,
      amount: parsedNumAmount,
      description: finalDescription,
      category: entryType === "savings" ? "Savings" : category,
      goalId: entryType === "savings" ? selectedGoalId : undefined,
      date,
      paidBy,
      splitRatio,
      notes,
      receiptUrl: receiptUrl || undefined,
    });
    setIsSubmitting(false);

    // Reset & close
    setAmount("");
    setDescription("");
    setNlInput("");
    setReceiptUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-card border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Quick Financial Entry</h3>
              <p className="text-xs text-muted-foreground">Log joint expense or savings deposit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector: Expense vs Savings */}
        <div className="mt-4 grid grid-cols-2 p-1 rounded-2xl bg-secondary/70 border">
          <button
            type="button"
            onClick={() => setEntryType("expense")}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              entryType === "expense"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Log Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryType("savings")}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              entryType === "savings"
                ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
            <span>Add to Savings</span>
          </button>
        </div>

        {/* Natural Language Smart Input Bar (for expenses) */}
        {entryType === "expense" && (
          <div className="mt-3 p-2.5 rounded-2xl bg-secondary/50 border border-border/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Natural Language AI Assistant
              </span>
              <span className="text-[10px] text-muted-foreground">e.g. &quot;35 dinner&quot;</span>
            </div>
            <input
              type="text"
              value={nlInput}
              onChange={(e) => handleParseNl(e.target.value)}
              placeholder="Type '18 lyft yesterday' or 'groceries 64'..."
              className="w-full text-xs bg-background/80 border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Amount & Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Amount ({CURRENCIES[currency]?.symbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-base text-muted-foreground">
                  {CURRENCIES[currency]?.symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-lg font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Goal Selector when Savings Deposit is active */}
          {entryType === "savings" ? (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Target Savings Goal
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.title} ({formatMoney(g.currentAmount, currency)} / {formatMoney(g.targetAmount, currency)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              {/* Round-up Sweep Indicator */}
              {potentialRoundUp > 0 && activeRoundupGoal && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>
                      Spare change sweep: <b>+{formatMoney(potentialRoundUp, currency)}</b>
                    </span>
                  </div>
                  <span className="text-[11px] font-medium truncate max-w-[120px]">
                    {activeRoundupGoal.emoji} {activeRoundupGoal.title}
                  </span>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trader Joe's groceries, Thai takeout"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Category Chips */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        category === cat
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-secondary/40 border-border hover:bg-secondary text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Paid / Deposited By Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              {entryType === "savings" ? "Deposited By" : "Paid By"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaidBy("partner_a")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  paidBy === "partner_a"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-background border-border hover:bg-secondary"
                }`}
              >
                <span>{partnerAName}</span>
                {paidBy === "partner_a" && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setPaidBy("partner_b")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  paidBy === "partner_b"
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-background border-border hover:bg-secondary"
                }`}
              >
                <span>{partnerBName}</span>
                {paidBy === "partner_b" && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Split Ratio Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Contribution Split
            </label>
            <div className="grid grid-cols-5 gap-1">
              {(["50/50", "60/40", "70/30", "100/0", "0/100"] as SplitRatio[]).map((ratio) => (
                <button
                  type="button"
                  key={ratio}
                  onClick={() => setSplitRatio(ratio)}
                  className={`py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                    splitRatio === ratio
                      ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                      : "bg-secondary/40 border-border hover:bg-secondary text-foreground"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Receipt Attachment (Optional) */}
          <div className="flex items-center justify-between pt-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingReceipt}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-all ${
                receiptUrl
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
            >
              {isUploadingReceipt ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <span>{receiptUrl ? "Receipt Attached" : "Add Receipt / Doc"}</span>
            </button>

            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary underline"
              >
                View
              </a>
            )}
          </div>

          {/* Notes */}
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add partner note (e.g. 'Bonus allocation', 'Supermarket run')..."
            className="w-full text-xs bg-background border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !amount || parsedNumAmount <= 0}
            className={`w-full py-3 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 ${
              entryType === "savings"
                ? "bg-gradient-to-r from-teal-600 to-emerald-500 shadow-teal-500/20"
                : "bg-gradient-to-r from-indigo-600 to-teal-500 shadow-indigo-500/20"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{entryType === "savings" ? "Deposit into Savings Goal" : "Save Expense"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
