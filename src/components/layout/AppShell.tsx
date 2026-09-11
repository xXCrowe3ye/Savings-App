"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { TopHeader } from "@/components/navigation/TopHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { PinUnlockModal } from "@/components/auth/PinUnlockModal";
import { RapidLogModal } from "@/components/transactions/RapidLogModal";
import { LoginGate } from "@/components/auth/LoginGate";
import { ProfileModal } from "@/components/profile/ProfileModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isProfileOpen, closeProfile } = useApp();
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

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
