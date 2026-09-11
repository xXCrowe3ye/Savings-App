"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PriorityLevel } from "@/types";
import { CURRENCIES } from "@/lib/utils";
import { X, Sparkles, Target, Shield, Plane, Home, Heart, Car } from "lucide-react";

interface GoalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATES = [
  {
    name: "Emergency Fund",
    emoji: "🛡️",
    targetAmount: 12000,
    category: "Emergency",
    description: "3-6x monthly living costs cushion",
  },
  {
    name: "Vacation / Travel",
    emoji: "✈️",
    targetAmount: 4500,
    category: "Vacation",
    description: "Flights, hotels, & dining abroad",
  },
  {
    name: "House Down Payment",
    emoji: "🏡",
    targetAmount: 35000,
    category: "Housing",
    description: "Future home purchase nest-egg",
  },
  {
    name: "Wedding Celebration",
    emoji: "💍",
    targetAmount: 15000,
    category: "Milestone",
    description: "Venue, catering & photography",
  },
  {
    name: "New Car / Vehicle",
    emoji: "🚙",
    targetAmount: 8000,
    category: "Vehicle",
    description: "Reliable couple adventure ride",
  },
];

export function GoalWizardModal({ isOpen, onClose }: GoalWizardModalProps) {
  const { currency, refreshData, triggerConfetti } = useApp();

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState<PriorityLevel>("high");
  const [roundupEnabled, setRoundupEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitle(tpl.name);
    setEmoji(tpl.emoji);
    setTargetAmount(tpl.targetAmount.toString());
    setCategory(tpl.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    const numCurrent = parseFloat(currentAmount) || 0;
    if (!title || !numTarget || numTarget <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          emoji,
          targetAmount: numTarget,
          currentAmount: numCurrent,
          targetDate,
          category,
          priority,
          partnerAContribution: numCurrent / 2,
          partnerBContribution: numCurrent / 2,
          roundupEnabled,
          roundupUnit: 1,
        }),
      });

      if (res.ok) {
        await refreshData();
        triggerConfetti();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setIsSubmitting(false);
    }
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
              <h3 className="font-bold text-base">New Savings Target</h3>
              <p className="text-xs text-muted-foreground">Setup wizard &amp; smart templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates Scroll */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
            Quick Templates
          </label>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="px-3 py-2 rounded-2xl bg-secondary/60 hover:bg-secondary border text-left shrink-0 transition-all flex items-center space-x-2"
              >
                <span className="text-xl">{tpl.emoji}</span>
                <div>
                  <div className="text-xs font-bold leading-none">{tpl.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {CURRENCIES[currency]?.symbol}{tpl.targetAmount}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
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
                placeholder="e.g. Kyoto Cherry Blossom Trip"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Target Amount & Initial Stash */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Target ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                required
                step="1"
                placeholder="5000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Initial Saved
              </label>
              <input
                type="number"
                step="1"
                placeholder="0"
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

          {/* Round-up Toggle */}
          <div className="p-3 rounded-2xl bg-secondary/50 border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">Round-up Engine</span>
              <span className="text-[11px] text-muted-foreground">
                Sweep spare change from joint expenses into this target
              </span>
            </div>
            <input
              type="checkbox"
              checked={roundupEnabled}
              onChange={(e) => setRoundupEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !title || !targetAmount}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-500 text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Creating Goal..." : "Start Saving Goal"}
          </button>
        </form>
      </div>
    </div>
  );
}
