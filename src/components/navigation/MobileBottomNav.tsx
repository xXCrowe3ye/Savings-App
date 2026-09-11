"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Plus,
  Target,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface MobileBottomNavProps {
  onOpenQuickLog: () => void;
}

export function MobileBottomNav({ onOpenQuickLog }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Budget", href: "/budget", icon: PieChart },
    // Center [+] is handled by FAB
    { label: "Goals", href: "/goals", icon: Target },
    { label: "Bills", href: "/recurring", icon: Calendar },
    { label: "Trends", href: "/analytics", icon: TrendingUp },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* First 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? "text-primary font-bold scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Floating Action Button [+] */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenQuickLog}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform ring-4 ring-background"
            aria-label="Add transaction"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Remaining 3 items */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? "text-primary font-bold scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
