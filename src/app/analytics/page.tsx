"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  Scale,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  Target,
  Clock,
  ArrowUpRight,
  PiggyBank,
  Zap,
} from "lucide-react";

export default function AnalyticsPage() {
  const { metrics, currency, transactions, goals, partnerAName, partnerBName } = useApp();
  const [horizonMonths, setHorizonMonths] = useState<1 | 3 | 6 | 12>(6);
  const [isExporting, setIsExporting] = useState(false);

  const currentSavings = metrics?.combinedNetSavings ?? 0;
  const partnerASpent = metrics?.partnerASpent || 0;
  const partnerBSpent = metrics?.partnerBSpent || 0;
  const totalPartnerSpent = partnerASpent + partnerBSpent || 1;
  const ratioA = Math.round((partnerASpent / totalPartnerSpent) * 100);
  const ratioB = 100 - ratioA;

  // Compute 3-month rolling averages for accurate forecasting
  const { avgMonthlySavings, avgMonthlyExpenses, monthlySavingsVelocity } = useMemo(() => {
    const now = new Date();
    let totalSavingsSample = 0;
    let totalExpensesSample = 0;
    const sampleMonths = 3;

    for (let i = 0; i < sampleMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const monthSaved = transactions
        .filter((t) => t.type === "savings" && t.date?.startsWith(prefix))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const monthSpent = transactions
        .filter((t) => (t.type || "expense") === "expense" && t.date?.startsWith(prefix))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      totalSavingsSample += monthSaved;
      totalExpensesSample += monthSpent;
    }

    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthSavings = transactions
      .filter((t) => t.type === "savings" && t.date?.startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const avgSavings = Math.round(totalSavingsSample / sampleMonths);
    const avgExpenses = Math.round(totalExpensesSample / sampleMonths);
    const velocity = currentMonthSavings > 0 ? currentMonthSavings : avgSavings > 0 ? avgSavings : 0;

    return {
      avgMonthlySavings: avgSavings,
      avgMonthlyExpenses: avgExpenses,
      monthlySavingsVelocity: velocity,
    };
  }, [transactions]);

  // Projected milestones data for the chart trajectory
  const projectionTimeline = useMemo(() => {
    const result = [];
    const now = new Date();

    // Start with current month baseline
    result.push({
      monthLabel: "Today",
      projectedSavings: currentSavings,
      projectedExpenses: 0,
    });

    for (let m = 1; m <= horizonMonths; m++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const label = futureDate.toLocaleString("default", { month: "short" });

      const projectedSavingsVal = currentSavings + monthlySavingsVelocity * m;
      const projectedExpensesVal = avgMonthlyExpenses * m;

      result.push({
        monthLabel: `+${m}M (${label})`,
        projectedSavings: Math.round(projectedSavingsVal),
        projectedExpenses: Math.round(projectedExpensesVal),
      });
    }

    return result;
  }, [currentSavings, monthlySavingsVelocity, avgMonthlyExpenses, horizonMonths]);

  const endProjectedSavings = currentSavings + monthlySavingsVelocity * horizonMonths;
  const netProjectedGain = monthlySavingsVelocity * horizonMonths;

  // Goals milestone pacing calculation
  const totalTargetNeeded = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
  const remainingGoalFundingNeeded = Math.max(0, totalTargetNeeded - currentSavings);
  const monthsToFundAllGoals =
    monthlySavingsVelocity > 0
      ? (remainingGoalFundingNeeded / monthlySavingsVelocity).toFixed(1)
      : null;

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true);
      const res = await fetch(`/api/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `babi_savings_export_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const CustomProjectionTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataItem = payload[0]?.payload;
    if (!dataItem) return null;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[170px] text-white">
        <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
        <div className="flex items-center justify-between pt-0.5">
          <span className="flex items-center space-x-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Projected Vault</span>
          </span>
          <span className="font-bold text-emerald-400">{formatMoney(dataItem.projectedSavings, currency)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Dynamic Cash Flow Forecasting Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 rounded-3xl p-5 text-white border border-indigo-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-teal-300" />
              <h2 className="font-bold text-base">Cash Flow Projections</h2>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              Forecasted joint growth based on real savings velocity (+{formatMoney(monthlySavingsVelocity, currency)}/mo)
            </p>
          </div>

          {/* Horizon toggle */}
          <div className="flex bg-white/10 p-0.5 rounded-xl text-xs font-semibold self-start sm:self-auto">
            {([1, 3, 6, 12] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizonMonths(h)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  horizonMonths === h ? "bg-white text-slate-900 shadow-xs font-bold" : "text-white/70 hover:text-white"
                }`}
              >
                {h === 1 ? "30D" : h === 3 ? "90D" : h === 6 ? "180D" : "1 Year"}
              </button>
            ))}
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-teal-300 block">Current Vault</span>
            <span className="text-sm font-extrabold text-white mt-1 block">
              {formatMoney(currentSavings, currency)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Expected Gain</span>
            <span className="text-sm font-extrabold text-emerald-400 mt-1 block">
              +{formatMoney(netProjectedGain, currency)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-teal-300 block">Projected Total</span>
            <span className="text-sm font-extrabold text-teal-200 mt-1 block">
              {formatMoney(endProjectedSavings, currency)}
            </span>
          </div>
        </div>

        {/* Visual Forecast Chart Curve */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-white/70 mb-1 px-1">
            <span>Cumulative Joint Savings Trajectory</span>
            <span className="text-teal-300 font-semibold">Horizon: +{horizonMonths} months</span>
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionTimeline} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="projSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                />
                <Tooltip content={<CustomProjectionTooltip />} />
                <Area
                  type="monotone"
                  dataKey="projectedSavings"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#projSavingsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Goal Target Horizon & Velocity */}
      {goals.length > 0 && (
        <div className="bg-card border rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Goals Milestone Timeline
              </h3>
            </div>
            {monthsToFundAllGoals && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                ~{monthsToFundAllGoals} months to full target
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {goals.map((g) => {
              const remaining = Math.max(0, g.targetAmount - g.currentAmount);
              const monthsToGoal =
                monthlySavingsVelocity > 0 ? (remaining / (monthlySavingsVelocity || 1)).toFixed(1) : null;
              const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

              return (
                <div key={g.id} className="p-3 rounded-2xl bg-secondary/40 border space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>{g.emoji}</span>
                      <span>{g.title}</span>
                    </span>
                    <span className="font-semibold text-muted-foreground">
                      {formatMoney(g.currentAmount, currency)} / {formatMoney(g.targetAmount, currency)} ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>{remaining > 0 ? `${formatMoney(remaining, currency)} remaining` : "Target achieved! 🎯"}</span>
                    {monthsToGoal && remaining > 0 && (
                      <span className="text-primary font-medium">Estimated: ~{monthsToGoal} mo at current pace</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Couple Spending Fairness Ratio */}
      <div className="bg-card border rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Couple Spending Fairness Ratio
            </h3>
          </div>
          <span className="text-[11px] font-bold text-foreground">
            {ratioA}% / {ratioB}%
          </span>
        </div>

        {/* Ratio Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden flex">
            <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${ratioA}%` }} />
            <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${ratioB}%` }} />
          </div>

          <div className="flex justify-between text-xs font-semibold">
            <span className="text-indigo-600 dark:text-indigo-400">
              {partnerAName}: {formatMoney(partnerASpent, currency)} ({ratioA}%)
            </span>
            <span className="text-teal-600 dark:text-teal-400">
              {partnerBName}: {formatMoney(partnerBSpent, currency)} ({ratioB}%)
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground pt-1">
          Contribution includes both direct joint purchases and out-of-pocket shared logs.
        </p>
      </div>

      {/* Year-to-Date Highlights */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-indigo-500/10 border border-amber-500/20 shadow-xs">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
            {currentYear} Year-to-Date Highlights
          </h4>
        </div>
        <div className="space-y-1.5 text-xs text-foreground/90">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Saved over <b>{formatMoney(currentSavings, currency)}</b> across joint savings &amp; goals.</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span><b>{transactions.length} total shared records</b> logged seamlessly.</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Monthly savings velocity currently tracking at <b>+{formatMoney(monthlySavingsVelocity, currency)}/mo</b>.</span>
          </div>
        </div>
      </div>

      {/* Database Backup & Export Utilities */}
      <div className="bg-card border rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Database Export &amp; Backup
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">One-click Backup</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Download your complete financial history for Excel spreadsheets, Google Sheets, or local encrypted JSON storage.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="p-3 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border flex items-center space-x-2.5 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs block">Export CSV</span>
              <span className="text-[10px] text-muted-foreground">For Sheets &amp; Excel</span>
            </div>
          </button>

          <button
            onClick={() => handleExport("json")}
            disabled={isExporting}
            className="p-3 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border flex items-center space-x-2.5 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs block">Export JSON</span>
              <span className="text-[10px] text-muted-foreground">Full DB Schema Backup</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
