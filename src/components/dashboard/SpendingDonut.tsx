"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";

const COLORS = [
  "#6366f1", // Indigo
  "#0d9488", // Teal
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#64748b", // Slate
];

export function SpendingDonut() {
  const { transactions, currency } = useApp();

  // Aggregate by category (expenses only)
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((tx) => (tx.type || "expense") === "expense")
    .forEach((tx) => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const totalSpent = data.reduce((acc, item) => acc + item.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-2xl p-4 text-center text-xs text-muted-foreground">
        No spending data recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Category Distribution
        </h4>
        <span className="text-xs font-semibold text-foreground">
          {formatMoney(totalSpent, currency)}
        </span>
      </div>

      <div className="h-44 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value: any) => [formatMoney(Number(value), currency), "Spent"]}
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "0.75rem",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-muted-foreground font-medium">Total</span>
          <span className="text-xs font-bold">{data.length} Categories</span>
        </div>
      </div>

      {/* Mini Legend */}
      <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t text-[11px]">
        {data.slice(0, 4).map((item, idx) => (
          <div key={item.name} className="flex items-center space-x-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="truncate text-muted-foreground">{item.name}</span>
            <span className="font-semibold ml-auto">{formatMoney(item.value, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
