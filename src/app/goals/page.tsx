"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { SavingsGoal } from "@/types";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalWizardModal } from "@/components/goals/GoalWizardModal";
import { WindfallBoostModal } from "@/components/goals/WindfallBoostModal";
import { Target, Plus, Coins, Sparkles, PiggyBank } from "lucide-react";

export default function GoalsPage() {
  const { goals, currency } = useApp();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [boostTargetGoal, setBoostTargetGoal] = useState<SavingsGoal | null>(null);

  const totalCurrentSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTargetNeeded = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallProgress = totalTargetNeeded > 0 ? Math.round((totalCurrentSaved / totalTargetNeeded) * 100) : 0;

  const activeRoundupGoal = goals.find((g) => g.roundupEnabled && g.status === "active");

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-indigo-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <PiggyBank className="w-5 h-5 text-teal-200" />
            <h2 className="font-bold text-base">Joint Savings Vault</h2>
          </div>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-3 py-1 rounded-full bg-white text-teal-800 text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all flex items-center space-x-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Goal</span>
          </button>
        </div>

        <div className="mt-2">
          <div className="text-3xl font-extrabold tracking-tight">
            {formatMoney(totalCurrentSaved, currency)}
            <span className="text-sm font-normal text-teal-100 ml-1.5">accumulated</span>
          </div>
          <p className="text-xs text-teal-100/90 mt-0.5">
            {overallProgress}% towards total joint target of {formatMoney(totalTargetNeeded, currency)}
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2 bg-black/20 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-teal-200 rounded-full transition-all duration-700"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Round-up Savings Engine Active Notice */}
      {activeRoundupGoal && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>
              <b>Round-up Engine Active:</b> Sweeping to <b>{activeRoundupGoal.emoji} {activeRoundupGoal.title}</b>
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20">
            Nearest ${activeRoundupGoal.roundupUnit || 1}
          </span>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Active Targets &amp; Milestones
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {goals.length} Goals
          </span>
        </div>

        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onOpenBoost={(g) => setBoostTargetGoal(g)}
          />
        ))}
      </div>

      {/* Modals */}
      <GoalWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      <WindfallBoostModal
        goal={boostTargetGoal}
        isOpen={Boolean(boostTargetGoal)}
        onClose={() => setBoostTargetGoal(null)}
      />
    </div>
  );
}
