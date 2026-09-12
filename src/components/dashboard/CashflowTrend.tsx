"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { TrendingUp, BarChart3, LineChart, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function CashflowTrend() {
  const { currency, metrics, transactions } = useApp();
  const [chartType, setChartType] = useState<"bar" | "area">("area");
  const [timeRange, setTimeRange] = useState<3 | 6 | 12>(6);

  const monthlyIncome = metrics?.combinedTotalIncome || 0;

  // Dynamically compute historical trend data based on selected time range
  const data = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      const monthPrefix = `${year}-${monthStr}`;
      const monthLabel = d.toLocaleString("default", { month: "short" });
      const isCurrentMonth = i === 0;

      // Real expenses in this month (exclude savings deposits and settlements)
      const monthExpenses = transactions
        .filter((t) => (t.type || "expense") === "expense" && t.date?.startsWith(monthPrefix))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const netSurplus = monthlyIncome - monthExpenses;
      const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round((netSurplus / monthlyIncome) * 100)) : 0;

      result.push({
        month: isCurrentMonth ? `${monthLabel} (Now)` : monthLabel,
        rawMonth: monthLabel,
        income: monthlyIncome,
        expenses: Math.round(monthExpenses * 100) / 100,
        netSurplus: Math.round(netSurplus * 100) / 100,
        savingsRate,
      });
    }

    return result;
  }, [transactions, monthlyIncome, timeRange]);

  // Aggregate stats across the selected period
  const totalPeriodExpenses = data.reduce((acc, d) => acc + d.expenses, 0);
  const avgMonthlyExpenses = Math.round(totalPeriodExpenses / (data.length || 1));
  const totalPeriodSurplus = data.reduce((acc, d) => acc + d.netSurplus, 0);
  const currentMonthData = data[data.length - 1];

  // Custom Rich Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const itemData = payload[0]?.payload;
    if (!itemData) return null;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[170px] text-white">
        <p className="font-bold text-slate-300 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-teal-400 font-semibold">{itemData.savingsRate}% saved</span>
        </p>

        <div className="space-y-1 pt-0.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Income</span>
            </span>
            <span className="font-bold text-emerald-400">{formatMoney(itemData.income, currency)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Expenses</span>
            </span>
            <span className="font-bold text-indigo-300">{formatMoney(itemData.expenses, currency)}</span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1 font-semibold">
            <span className="text-slate-400">Net Surplus</span>
            <span className={itemData.netSurplus >= 0 ? "text-teal-300 font-bold" : "text-rose-400 font-bold"}>
              {formatMoney(itemData.netSurplus, currency)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card border rounded-3xl p-5 shadow-xs space-y-3">
      {/* Top Header & Interactive Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cash Flow Trends &amp; Surplus
            </h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Avg spend: <b>{formatMoney(avgMonthlyExpenses, currency)}/mo</b> • Period net: <b>+{formatMoney(totalPeriodSurplus, currency)}</b>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time range toggle */}
          <div className="flex bg-secondary/80 p-0.5 rounded-xl text-[11px] font-semibold">
            {([3, 6, 12] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  timeRange === r ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}M
              </button>
            ))}
          </div>

          {/* Chart type toggle */}
          <div className="flex bg-secondary/80 p-0.5 rounded-xl text-muted-foreground">
            <button
              onClick={() => setChartType("area")}
              className={`p-1 rounded-lg transition-all ${
                chartType === "area" ? "bg-card text-primary shadow-2xs" : "hover:text-foreground"
              }`}
              title="Smooth Area Flow"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`p-1 rounded-lg transition-all ${
                chartType === "bar" ? "bg-card text-primary shadow-2xs" : "hover:text-foreground"
              }`}
              title="Bar Comparison"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Current Month Pill */}
      <div className="flex items-center justify-between text-[11px] pt-1">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-muted-foreground font-medium">Income</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs" />
            <span className="text-muted-foreground font-medium">Expenses</span>
          </span>
        </div>

        {currentMonthData && (
          <div className="flex items-center space-x-1 text-teal-600 dark:text-teal-400 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>This Month Surplus: {formatMoney(currentMonthData.netSurplus, currency)}</span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-48 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} barGap={4} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="expenses" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
