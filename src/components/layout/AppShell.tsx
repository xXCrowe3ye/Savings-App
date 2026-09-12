"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { TopHeader } from "@/components/navigation/TopHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { PinUnlockModal } from "@/components/auth/PinUnlockModal";
import { RapidLogModal } from "@/components/transactions/RapidLogModal";
import { LoginGate } from "@/components/auth/LoginGate";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { Sparkles } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    isProfileOpen,
    closeProfile,
  } = useApp();
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  // During initial mount/session resolution, show a subtle loading spinner instead of flashing the login gate
  if (isLoading && !isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center space-y-3">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-xl shadow-indigo-500/20 animate-pulse">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <p className="text-xs text-muted-foreground font-semibold tracking-wide animate-pulse">
          Opening Babi-Savings...
        </p>
      </div>
    );
  }

  // Authentication Gate: Require login before accessing vault
  if (!isAuthenticated) {
    return <LoginGate />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20">
      <TopHeader />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">
        {children}
      </main>
      <MobileBottomNav onOpenQuickLog={() => setIsQuickLogOpen(true)} />
      <RapidLogModal isOpen={isQuickLogOpen} onClose={() => setIsQuickLogOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={closeProfile} />
      <PinUnlockModal />
    </div>
  );
}
