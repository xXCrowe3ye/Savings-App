"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/navigation/TopHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { PinUnlockModal } from "@/components/auth/PinUnlockModal";
import { RapidLogModal } from "@/components/transactions/RapidLogModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20">
      <TopHeader />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">
        {children}
      </main>
      <MobileBottomNav onOpenQuickLog={() => setIsQuickLogOpen(true)} />
      <RapidLogModal isOpen={isQuickLogOpen} onClose={() => setIsQuickLogOpen(false)} />
      <PinUnlockModal />
    </div>
  );
}
