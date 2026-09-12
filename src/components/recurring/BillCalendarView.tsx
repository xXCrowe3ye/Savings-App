"use client";

import React, { useState } from "react";
import { RecurringBill } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/utils";
import { Calendar as CalendarIcon, Check } from "lucide-react";

interface BillCalendarViewProps {
  bills: RecurringBill[];
  onEdit?: (bill: RecurringBill) => void;
}

export function BillCalendarView({ bills, onEdit }: BillCalendarViewProps) {
  const { currency, getPartnerName } = useApp();
  const todayDate = new Date().getDate();
  const [selectedDay, setSelectedDay] = useState<number>(todayDate);

  // Group bills by day
  const billsByDay: Record<number, RecurringBill[]> = {};
  bills.forEach((b) => {
    if (!billsByDay[b.billingDay]) billsByDay[b.billingDay] = [];
    billsByDay[b.billingDay].push(b);
  });

  const selectedBills = billsByDay[selectedDay] || [];

  return (
    <div className="bg-card border rounded-3xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Monthly Due Date Calendar
          </h4>
        </div>
        <span className="text-[11px] text-muted-foreground">Tap day to inspect</span>
      </div>

      {/* 31-Day Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
          const hasBills = Boolean(billsByDay[day]);
          const isToday = day === todayDate;
          const isSelected = day === selectedDay;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`h-9 rounded-xl flex flex-col items-center justify-center transition-all relative ${
                isSelected
                  ? "bg-primary text-white font-bold shadow-xs scale-105"
                  : isToday
                  ? "bg-secondary border border-primary/40 font-bold"
                  : "bg-secondary/40 hover:bg-secondary text-foreground"
              }`}
            >
              <span className="text-xs leading-none">{day}</span>
              {hasBills && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? "bg-white" : "bg-teal-500 animate-pulse"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Bills Drawer */}
      <div className="pt-2 border-t">
        <div className="text-xs font-semibold text-muted-foreground mb-1.5">
          Due on Day {selectedDay}:
        </div>
        {selectedBills.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">No recurring bills due on this day.</p>
        ) : (
          <div className="space-y-1.5">
            {selectedBills.map((b) => (
              <div
                key={b.id}
                onClick={() => onEdit?.(b)}
                className={`p-2.5 rounded-xl bg-secondary/60 flex items-center justify-between text-xs ${
                  onEdit ? "cursor-pointer hover:bg-secondary transition-all" : ""
                }`}
                title={onEdit ? "Click to edit bill" : undefined}
              >
                <div>
                  <span className="font-bold text-foreground">{b.title}</span>
                  <span className="text-muted-foreground ml-2">
                    ({getPartnerName(b.paidBy)})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">{formatMoney(b.amount, currency)}</span>
                  {onEdit && <span className="text-[10px] text-primary">✎</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
