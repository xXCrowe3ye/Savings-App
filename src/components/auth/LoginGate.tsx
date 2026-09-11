"use client";

import React from "react";
import { Sparkles, Shield, AlertCircle } from "lucide-react";

export function LoginGate() {
  const isUnauthorized =
    typeof window !== "undefined" &&
    window.location.search.includes("sso_error=unauthorized_email");

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Logo Badge */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-black tracking-tight">Babi-Savings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Private Joint Finance &amp; Savings Space
        </p>

        {/* Secure Access Badge */}
        <div className="mt-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Authorized Access Only</span>
        </div>

        {/* Unauthorized error alert (Generic message, zero email leakage) */}
        {isUnauthorized && (
          <div className="mt-4 p-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs text-left flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <b>Access Denied:</b>
              <p className="text-[11px] mt-0.5 opacity-90">
                This Google account is not authorized to view or edit this private vault.
              </p>
            </div>
          </div>
        )}

        {/* Primary Action: Google SSO */}
        <div className="w-full mt-6">
          <a
            href="/api/auth/sso/google"
            className="w-full py-3.5 px-4 rounded-2xl bg-card border hover:border-primary/50 text-foreground font-bold text-sm shadow-md hover:bg-secondary/60 active:scale-[0.99] transition-all flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Sign in with Google</span>
          </a>
        </div>
      </div>
    </div>
  );
}
