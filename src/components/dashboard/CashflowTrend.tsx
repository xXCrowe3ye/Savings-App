"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";

export function CashflowTrend() {
  const { currency, metrics } = useApp();

  const currentExpenses = metrics?.combinedTotalExpenses || 2700;
  const currentIncome = metrics?.combinedTotalIncome || 7800;

  // Month-over-month trend data
  const data = [
    // { month: "Apr", income: 7500, expenses: 3100 },
    // { month: "May", income: 7500, expenses: 2950 },
    // { month: "Jun", income: 7800, expenses: 3400 },
    // { month: "Jul", income: 7800, expenses: 2800 },
    // { month: "Aug", income: 7800, expenses: 3050 },
    { month: "Sep (Now)", income: currentIncome, expenses: currentExpenses },
  ];

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Cash Flow Trends
        </h4>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Income</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-muted-foreground">Expenses</span>
          </span>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip
              formatter={(value: any) => [formatMoney(Number(value), currency)]}
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "0.75rem",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="expenses" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
