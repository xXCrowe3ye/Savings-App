"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { CURRENCIES } from "@/lib/utils";
import { CurrencyCode } from "@/types";
import {
  Lock,
  WifiOff,
  RefreshCw,
  Sparkles,
  LogOut,
  ChevronDown,
  User,
  Compass,
} from "lucide-react";

export function TopHeader() {
  const {
    currentUser,
    currency,
    setCurrency,
    isOffline,
    pendingOfflineCount,
    lockSession,
    refreshData,
    isLoading,
    openProfile,
    logout,
  } = useApp();

  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 py-3 border-b">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand & Active Profile */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight">Babi-Savings</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Couples
              </span>
            </div>
            {/* Active User Badge & Profile Personalization */}
            <div className="flex items-center space-x-1.5 mt-0.5">
              <div
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1.5 ${
                  currentUser.partnerKey === "partner_a"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
                }`}
              >
                {currentUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatarUrl}
                    alt="Avatar"
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentUser.themeAccent || "#6366f1" }}
                  />
                )}
                <span>{currentUser.nickname || currentUser.name || "Partner"}</span>
              </div>

              <button
                onClick={openProfile}
                className="text-[11px] text-muted-foreground hover:text-primary underline px-1 py-0.5 rounded transition-colors"
                title="Personalize nickname and photo"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls: Offline status, Currency, Refresh, Lock, Sign Out */}
        <div className="flex items-center space-x-2">
          {isOffline && (
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline ({pendingOfflineCount})</span>
            </div>
          )}

          {/* Currency Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 transition-colors flex items-center space-x-1"
            >
              <span>{CURRENCIES[currency]?.symbol}</span>
              <span className="text-[11px] text-muted-foreground">{currency}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {showCurrencyMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-card border rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setCurrency(code);
                      setShowCurrencyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-secondary transition-colors ${
                      currency === code ? "font-bold text-primary" : ""
                    }`}
                  >
                    <span>{CURRENCIES[code].label}</span>
                    <span className="font-mono">{CURRENCIES[code].symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* App Tour Guide */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-app-tour", { detail: { tab: "tour" } }));
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Take App Tour & Guide"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Refresh Data */}
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </button>

          {/* Lock Session */}
          <button
            onClick={lockSession}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Lock session with PIN"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Sign Out */}
          <button
            onClick={logout}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sign out of Babi-Savings"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

