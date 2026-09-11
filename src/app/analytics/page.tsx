"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import {
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  PieChart,
  Scale,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
} from "lucide-react";

export default function AnalyticsPage() {
  const { metrics, currency, transactions, recurring, budgets } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const income = metrics?.combinedTotalIncome || 7800;
  const currentExpenses = metrics?.combinedTotalExpenses || 2700;
  const netMonthlySurplus = Math.max(0, income - currentExpenses);

  const partnerASpent = metrics?.partnerASpent || 0;
  const partnerBSpent = metrics?.partnerBSpent || 0;
  const totalPartnerSpent = partnerASpent + partnerBSpent || 1;
  const ratioA = Math.round((partnerASpent / totalPartnerSpent) * 100);
  const ratioB = 100 - ratioA;

  // 30, 60, 90 day Cash Flow Projections
  const currentSavings = metrics?.combinedNetSavings || 14200;
  const projection30 = currentSavings + netMonthlySurplus;
  const projection60 = currentSavings + netMonthlySurplus * 2;
  const projection90 = currentSavings + netMonthlySurplus * 3;

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true);
      const res = await fetch(`/api/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `duonest_export_${Date.now()}.${format}`;
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

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Cash Flow Forecasting Hero */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-950 rounded-3xl p-5 text-white border border-indigo-500/20 shadow-xl">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-5 h-5 text-teal-300" />
          <h2 className="font-bold text-base">Cash Flow Projections</h2>
        </div>
        <p className="text-xs text-white/70">
          Estimated joint surplus based on current velocity and recurring bills (+{formatMoney(netMonthlySurplus, currency)}/mo net)
        </p>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-teal-300 block">30 Days</span>
            <span className="text-sm font-extrabold text-white mt-1 block">
              {formatMoney(projection30, currency)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-teal-300 block">60 Days</span>
            <span className="text-sm font-extrabold text-white mt-1 block">
              {formatMoney(projection60, currency)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-teal-300 block">90 Days</span>
            <span className="text-sm font-extrabold text-white mt-1 block">
              {formatMoney(projection90, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Couple Fairness & Contribution Ratio */}
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
              Alex: {formatMoney(partnerASpent, currency)} ({ratioA}%)
            </span>
            <span className="text-teal-600 dark:text-teal-400">
              Sam: {formatMoney(partnerBSpent, currency)} ({ratioB}%)
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground pt-1">
          Contribution includes both direct joint purchases and out-of-pocket shared logs.
        </p>
      </div>

      {/* Year-in-Review Milestone Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-indigo-500/10 border border-amber-500/20 shadow-xs">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
            2026 Year-to-Date Highlights
          </h4>
        </div>
        <div className="space-y-1.5 text-xs text-foreground/90">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Saved over <b>{formatMoney(currentSavings, currency)}</b> across joint goals.</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span><b>{transactions.length} total shared expenses</b> tracked with zero split disputes.</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Automatic round-up engine active and sweeping spare change weekly.</span>
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
          <span className="text-[10px] text-muted-foreground">Headless Sync</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Download your complete joint database for tax preparation, local spreadsheet backups, or archival.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="py-2.5 px-3 rounded-2xl bg-secondary hover:bg-secondary/80 border text-xs font-bold transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport("json")}
            disabled={isExporting}
            className="py-2.5 px-3 rounded-2xl bg-secondary hover:bg-secondary/80 border text-xs font-bold transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <FileJson className="w-4 h-4 text-indigo-500" />
            <span>Backup JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
