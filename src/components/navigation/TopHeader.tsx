"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { CURRENCIES } from "@/lib/utils";
import { CurrencyCode, PartnerKey } from "@/types";
import {
  Lock,
  WifiOff,
  RefreshCw,
  Sparkles,
  Download,
  Users,
  ChevronDown,
} from "lucide-react";

export function TopHeader() {
  const {
    currentUser,
    switchPartner,
    currency,
    setCurrency,
    isOffline,
    pendingOfflineCount,
    lockSession,
    refreshData,
    isLoading,
    openProfile,
  } = useApp();

  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 py-3 border-b">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand & Partner Switcher */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight">DuoNest</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Couples
              </span>
            </div>
            {/* Active Partner Pill Switcher & Profile Personalize */}
            <div className="flex items-center space-x-1.5 mt-0.5">
              <button
                onClick={() =>
                  switchPartner(
                    currentUser.partnerKey === "partner_a" ? "partner_b" : "partner_a"
                  )
                }
                className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-all flex items-center space-x-1 ${
                  currentUser.partnerKey === "partner_a"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
                }`}
                title="Tap to switch partner perspective"
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
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: currentUser.themeAccent }}
                  />
                )}
                <span>{currentUser.nickname || currentUser.name.split(" ")[0]}</span>
                <Users className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              <button
                onClick={openProfile}
                className="text-[10px] text-muted-foreground hover:text-primary underline px-1 py-0.5 rounded"
                title="Personalize nickname and photo"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls: Offline status, Currency, Refresh, Lock */}
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

          {/* Refresh Data */}
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </button>

          {/* Google SSO Login */}
          <a
            href="/api/auth/sso/google"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Single Sign-On with Google"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </a>

          {/* Lock Session */}
          <button
            onClick={lockSession}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Lock session with PIN"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
