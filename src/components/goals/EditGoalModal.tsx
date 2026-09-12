"use client";

import React, { useState, useEffect } from "react";
import { SavingsGoal, PriorityLevel } from "@/types";
import { useApp } from "@/context/AppContext";
import { CURRENCIES, formatMoney } from "@/lib/utils";
import { X, Edit3, Trash2, Check, AlertTriangle, Loader2 } from "lucide-react";

interface EditGoalModalProps {
  goal: SavingsGoal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditGoalModal({ goal, isOpen, onClose }: EditGoalModalProps) {
  const { currency, refreshData, triggerConfetti, partnerAName, partnerBName } = useApp();

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [status, setStatus] = useState<"active" | "achieved" | "paused">("active");
  const [roundupEnabled, setRoundupEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setEmoji(goal.emoji || "🎯");
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setTargetDate(goal.targetDate || "");
      setCategory(goal.category || "General");
      setPriority(goal.priority || "medium");
      setStatus(goal.status || "active");
      setRoundupEnabled(Boolean(goal.roundupEnabled));
      setShowDeleteConfirm(false);
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    const numCurrent = parseFloat(currentAmount) || 0;
    if (!title.trim() || isNaN(numTarget) || numTarget <= 0) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goal.id,
          title: title.trim(),
          emoji,
          targetAmount: numTarget,
          currentAmount: numCurrent,
          targetDate,
          category,
          priority,
          status,
          roundupEnabled,
        }),
      });

      if (res.ok) {
        await refreshData();
        triggerConfetti();
        onClose();
      }
    } catch (err) {
      console.error("Failed to update goal:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/goals?id=${goal.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshData();
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-card border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Edit Savings Goal</h3>
              <p className="text-xs text-muted-foreground">{goal.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-800 dark:text-rose-300">Delete this savings goal?</h4>
              <p className="text-xs text-muted-foreground mt-1">
                This will permanently delete <b>&quot;{goal.title}&quot;</b> ({formatMoney(goal.currentAmount, currency)} saved).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center space-x-1"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Delete</span>}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-4 space-y-3.5">
            {/* Title & Emoji */}
            <div className="flex space-x-2">
              <div className="w-16">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Icon</label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full text-center py-2 text-xl bg-background border rounded-xl outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Target Amount & Current Saved */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Target ({CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Saved So Far
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Target Date & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 text-xs bg-background border rounded-xl outline-none"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Status & Round-up */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-background border rounded-xl outline-none"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="achieved">Achieved 🎯</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label className="p-2 rounded-xl bg-secondary/50 border flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium">Round-up Active</span>
                  <input
                    type="checkbox"
                    checked={roundupEnabled}
                    onChange={(e) => setRoundupEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between space-x-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-3 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <button
                type="submit"
                disabled={isSaving || !title.trim() || !targetAmount}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Changes</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
