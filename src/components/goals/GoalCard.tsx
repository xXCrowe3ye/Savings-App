"use client";

import React, { useState } from "react";
import { SavingsGoal } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import {
  Sparkles,
  Zap,
  Calendar,
  Coins,
  ArrowUpRight,
  Gift,
  CheckCircle,
} from "lucide-react";

interface GoalCardProps {
  goal: SavingsGoal & {
    progressPercent?: number;
    requiredMonthlyPace?: number;
    requiredWeeklyPace?: number;
    daysRemaining?: number;
    partnerARatio?: number;
    partnerBRatio?: number;
  };
  onOpenBoost: (goal: SavingsGoal) => void;
}

export function GoalCard({ goal, onOpenBoost }: GoalCardProps) {
  const { currency, toggleGoalRoundup, partnerAName, partnerBName } = useApp();
  const [isTogglingRoundup, setIsTogglingRoundup] = useState(false);

  const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleRoundupToggle = async () => {
    setIsTogglingRoundup(true);
    await toggleGoalRoundup(goal.id, !goal.roundupEnabled, goal.roundupUnit || 1);
    setIsTogglingRoundup(false);
  };

  const partnerARatio = goal.partnerARatio ?? 50;
  const partnerBRatio = goal.partnerBRatio ?? 50;

  return (
    <div className="bg-card border rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{goal.emoji}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-foreground">{goal.title}</h4>
                {progress >= 100 && (
                  <span className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    <CheckCircle className="w-3 h-3" />
                    <span>Achieved!</span>
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground flex items-center space-x-1.5 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>Target: {goal.targetDate}</span>
                <span>•</span>
                <span
                  className={`capitalize font-semibold text-[10px] px-1.5 rounded ${
                    goal.priority === "high"
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {goal.priority} priority
                </span>
              </span>
            </div>
          </div>

          {/* Windfall Boost CTA */}
          <button
            onClick={() => onOpenBoost(goal)}
            className="px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all flex items-center space-x-1"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Boost</span>
          </button>
        </div>

        {/* Progress Display */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-extrabold text-foreground">
              {formatMoney(goal.currentAmount, currency)}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Goal: {formatMoney(goal.targetAmount, currency)} ({progress}%)
            </span>
          </div>

          {/* Visual Milestone Progress Bar */}
          <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Milestone markers (25%, 50%, 75%) */}
          <div className="flex justify-between text-[10px] text-muted-foreground px-1 mt-1 font-medium">
            <span className={progress >= 25 ? "text-primary font-bold" : ""}>25%</span>
            <span className={progress >= 50 ? "text-primary font-bold" : ""}>50%</span>
            <span className={progress >= 75 ? "text-primary font-bold" : ""}>75%</span>
            <span className={progress >= 100 ? "text-emerald-500 font-bold" : ""}>100% 🎯</span>
          </div>
        </div>

        {/* Partner Contribution Split Bar */}
        <div className="mt-3 p-2.5 rounded-2xl bg-secondary/50 border border-border/60">
          <div className="flex justify-between text-[11px] font-semibold mb-1">
            <span className="text-indigo-600 dark:text-indigo-400">
              {partnerAName}: {formatMoney(goal.partnerAContribution, currency)} ({partnerARatio}%)
            </span>
            <span className="text-teal-600 dark:text-teal-400">
              {partnerBName}: {formatMoney(goal.partnerBContribution, currency)} ({partnerBRatio}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-background rounded-full overflow-hidden flex">
            <div className="bg-indigo-500 h-full" style={{ width: `${partnerARatio}%` }} />
            <div className="bg-teal-500 h-full" style={{ width: `${partnerBRatio}%` }} />
          </div>
        </div>
      </div>

      {/* Footer Pace & Round-Up Engine */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
        {/* Required Pace */}
        <div className="flex items-center space-x-1.5 text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Need: <b>{formatMoney(goal.requiredMonthlyPace || Math.round(remaining / 6), currency)}</b>/mo
          </span>
        </div>

        {/* Round-up Toggle */}
        <button
          onClick={handleRoundupToggle}
          disabled={isTogglingRoundup}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center space-x-1 ${
            goal.roundupEnabled
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              : "bg-secondary text-muted-foreground border-transparent hover:border-border"
          }`}
        >
          <Coins className="w-3 h-3" />
          <span>
            Round-up ${goal.roundupUnit || 1} {goal.roundupEnabled ? "ON" : "OFF"}
          </span>
        </button>
      </div>
    </div>
  );
}
