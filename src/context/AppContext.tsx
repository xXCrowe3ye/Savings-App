"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  RecurringBill,
  DashboardMetrics,
  UserProfile,
  CurrencyCode,
  PartnerKey,
} from "@/types";
import { queueOfflineTransaction, syncOfflineTransactions, getQueuedTransactions } from "@/lib/pwa/offlineQueue";

interface AppContextType {
  currentUser: UserProfile;
  partnerUser: UserProfile | null;
  partnerAName: string;
  partnerBName: string;
  getPartnerName: (partnerKey: PartnerKey | "shared" | "both") => string;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  isAuthenticated: boolean;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  recurring: RecurringBill[];
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  isOffline: boolean;
  pendingOfflineCount: number;
  isPinLocked: boolean;
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lockSession: () => void;
  refreshData: () => Promise<void>;
  logTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<{ success: boolean; roundupSwept?: number }>;
  approveTransaction: (id: string) => Promise<void>;
  updateTransactionNotes: (id: string, notes: string) => Promise<void>;
  boostGoal: (goalId: string, amount: number, partnerKey: PartnerKey | "both") => Promise<void>;
  toggleGoalRoundup: (goalId: string, enabled: boolean, unit?: 1 | 5) => Promise<void>;
  logout: () => Promise<void>;
  isIncomeModalOpen: boolean;
  openIncomeModal: () => void;
  closeIncomeModal: () => void;
  updateSharedIncome: (income: number) => Promise<void>;
  updateProfile: (nickname: string, avatarUrl: string, themeAccent: string) => Promise<void>;
  triggerConfetti: () => void;
}

const DEFAULT_USER_A: UserProfile = {
  id: "user_a",
  partnerKey: "partner_a",
  name: "Partner A",
  nickname: "Partner A",
  email: "",
  themeAccent: "#6366f1",
  hasPin: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER_A);
  const [partnerUser, setPartnerUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurring, setRecurring] = useState<RecurringBill[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);

  const openProfile = () => setIsProfileOpen(true);
  const closeProfile = () => setIsProfileOpen(false);

  const openIncomeModal = () => setIsIncomeModalOpen(true);
  const closeIncomeModal = () => setIsIncomeModalOpen(false);

  const partnerAName =
    currentUser.partnerKey === "partner_a"
      ? currentUser.nickname || currentUser.name || "Partner A"
      : partnerUser?.nickname || partnerUser?.name || "Partner A";

  const partnerBName =
    currentUser.partnerKey === "partner_b"
      ? currentUser.nickname || currentUser.name || "Partner B"
      : partnerUser?.nickname || partnerUser?.name || "Partner B";

  const getPartnerName = (partnerKey: PartnerKey | "shared" | "both"): string => {
    if (partnerKey === "shared" || partnerKey === "both") return "Shared (50/50)";
    return partnerKey === "partner_a" ? partnerAName : partnerBName;
  };

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("babi_savings_currency", c);
    }
  };

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#0d9488", "#f59e0b", "#ec4899", "#10b981"],
    });
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchOpts = { cache: "no-store" as RequestCache };
      const [meRes, txRes, bgRes, glRes, rcRes] = await Promise.all([
        fetch("/api/auth/me", fetchOpts),
        fetch("/api/transactions", fetchOpts),
        fetch("/api/budgets", fetchOpts),
        fetch("/api/goals", fetchOpts),
        fetch("/api/recurring", fetchOpts),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setIsAuthenticated(meData.authenticated);
        if (meData.user) {
          setCurrentUser(meData.user);
        }
        if (meData.partner) {
          setPartnerUser(meData.partner);
        }
        // First login onboarding prompt: only prompt once per device/browser session
        if (meData.authenticated && meData.isFirstTime) {
          const alreadyPrompted =
            typeof window !== "undefined" &&
            localStorage.getItem("babi_onboarding_shown");
          if (!alreadyPrompted) {
            setIsProfileOpen(true);
            if (typeof window !== "undefined") {
              localStorage.setItem("babi_onboarding_shown", "true");
            }
          }
        }
      }

      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
        setMetrics(data.metrics || null);
      }
      if (bgRes.ok) {
        const data = await bgRes.json();
        setBudgets(data.budgets || []);
      }
      if (glRes.ok) {
        const data = await glRes.json();
        setGoals(data.goals || []);
      }
      if (rcRes.ok) {
        const data = await rcRes.json();
        setRecurring(data.recurring || []);
      }
    } catch (err) {
      console.warn("Failed to fetch fresh data, might be offline:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Online / Offline listeners & background sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load stored currency
    const savedCurrency = localStorage.getItem("babi_savings_currency") as CurrencyCode;
    if (savedCurrency) setCurrencyState(savedCurrency);

    // Initial check
    setIsOffline(!navigator.onLine);

    const handleOnline = async () => {
      setIsOffline(false);
      const synced = await syncOfflineTransactions((count) => {
        console.log(`Synced ${count} offline transactions`);
      });
      const queued = await getQueuedTransactions();
      setPendingOfflineCount(queued.length);
      refreshData();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial data load
    refreshData();

    // Check offline queue
    getQueuedTransactions().then((items) => setPendingOfflineCount(items.length));

    // Register PWA Service Worker & auto-check for updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
          console.log("Babi-Savings PWA ServiceWorker registered & updated");
        })
        .catch((err) => console.log("SW registration error:", err));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshData]);

  // Session auto-lock timer (15 minutes of inactivity)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isAuthenticated) {
          setIsPinLocked(true);
        }
      }, 15 * 60 * 1000);
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isAuthenticated]);

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setIsPinLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const lockSession = () => {
    setIsPinLocked(true);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      setCurrentUser(DEFAULT_USER_A);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const updateProfile = async (nickname: string, avatarUrl: string, themeAccent: string) => {
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, avatarUrl, themeAccent }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        triggerConfetti();
      }
    } catch (err) {
      console.error("Update profile error:", err);
    }
  };

  const logTransaction = async (
    txData: Omit<Transaction, "id" | "createdAt">
  ): Promise<{ success: boolean; roundupSwept?: number }> => {
    if (!navigator.onLine) {
      const queued = await queueOfflineTransaction(txData);
      setTransactions((prev) => [queued, ...prev]);
      const currentQueued = await getQueuedTransactions();
      setPendingOfflineCount(currentQueued.length);
      return { success: true };
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData),
      });

      if (res.ok) {
        const data = await res.json();
        await refreshData();
        if (data.roundupSwept > 0 || txData.type === "savings") {
          triggerConfetti();
        }
        return { success: true, roundupSwept: data.roundupSwept };
      }
      return { success: false };
    } catch (err) {
      console.error("Failed to post transaction:", err);
      return { success: false };
    }
  };

  const approveTransaction = async (id: string) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approvedByPartner: true }),
      });
      if (res.ok) {
        await refreshData();
        triggerConfetti();
      }
    } catch (err) {
      console.error("Failed to approve transaction:", err);
    }
  };

  const updateTransactionNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to update notes:", err);
    }
  };

  const boostGoal = async (goalId: string, amount: number, partnerKey: PartnerKey | "both") => {
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, action: "boost", amount, partnerKey }),
      });
      if (res.ok) {
        await refreshData();
        triggerConfetti();
      }
    } catch (err) {
      console.error("Failed to boost goal:", err);
    }
  };

  const toggleGoalRoundup = async (goalId: string, enabled: boolean, unit: 1 | 5 = 1) => {
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, roundupEnabled: enabled, roundupUnit: unit }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to toggle roundup:", err);
    }
  };

  const updateSharedIncome = async (income: number) => {
    try {
      const res = await fetch("/api/settings/income", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income }),
      });
      if (res.ok) {
        await refreshData();
        triggerConfetti();
      }
    } catch (err) {
      console.error("Update shared income error:", err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        partnerUser,
        partnerAName,
        partnerBName,
        getPartnerName,
        setCurrentUser,
        isAuthenticated,
        currency,
        setCurrency,
        transactions,
        budgets,
        goals,
        recurring,
        metrics,
        isLoading,
        isOffline,
        pendingOfflineCount,
        isPinLocked,
        isProfileOpen,
        openProfile,
        closeProfile,
        isIncomeModalOpen,
        openIncomeModal,
        closeIncomeModal,
        updateSharedIncome,
        unlockWithPin,
        lockSession,
        refreshData,
        logTransaction,
        approveTransaction,
        updateTransactionNotes,
        boostGoal,
        toggleGoalRoundup,
        logout,
        updateProfile,
        triggerConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
