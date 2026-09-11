import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  RecurringBill,
  Settlement,
  UserProfile,
  DashboardMetrics,
  PartnerKey,
} from "@/types";
import { isGoogleSheetsConfigured } from "./google/client";
import * as sheets from "./google/sheetsService";
import {
  INITIAL_USERS,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_RECURRING,
  INITIAL_SETTLEMENTS,
} from "./mock/seedData";
import { getDaysRemainingInMonth } from "./utils";

// In-memory fallback store for demo / local execution
class InMemoryStore {
  users: UserProfile[] = [...INITIAL_USERS];
  transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  budgets: CategoryBudget[] = [...INITIAL_BUDGETS];
  goals: SavingsGoal[] = [...INITIAL_GOALS];
  recurring: RecurringBill[] = [...INITIAL_RECURRING];
  settlements: Settlement[] = [...INITIAL_SETTLEMENTS];
}

// Global singleton across serverless invocations in dev
const globalStore = (global as any).__BABI_SAVINGS_STORE__ || new InMemoryStore();
if (process.env.NODE_ENV !== "production") {
  (global as any).__BABI_SAVINGS_STORE__ = globalStore;
}

export const db = {
  isLiveGoogleSheets: () => isGoogleSheetsConfigured(),

  // Users
  async getUsers(): Promise<UserProfile[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        return await sheets.getSheetRows<UserProfile>("Users");
      } catch (err) {
        console.warn("Google Sheets failed, falling back to local store:", err);
      }
    }
    return globalStore.users;
  },

  async getUserByPartner(partnerKey: PartnerKey): Promise<UserProfile | undefined> {
    const users = await db.getUsers();
    return users.find((u) => u.partnerKey === partnerKey);
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        const txs = await sheets.getSheetRows<Transaction>("Transactions");
        return txs.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      } catch (err) {
        console.warn("Google Sheets failed, falling back to local store:", err);
      }
    }
    return [...globalStore.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  async addTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      needsApproval: tx.amount >= 200 && tx.approvedByPartner !== true,
    };

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.appendSheetRow("Transactions", newTx);
        return newTx;
      } catch (err) {
        console.warn("Google Sheets write failed, falling back to local store:", err);
      }
    }

    globalStore.transactions.unshift(newTx);
    return newTx;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.updateSheetRow("Transactions", id, updates);
      } catch (err) {
        console.warn("Google Sheets update failed:", err);
      }
    }

    const index = globalStore.transactions.findIndex((t: Transaction) => t.id === id);
    if (index !== -1) {
      globalStore.transactions[index] = { ...globalStore.transactions[index], ...updates };
      return globalStore.transactions[index];
    }
    throw new Error(`Transaction ${id} not found`);
  },

  async deleteTransaction(id: string): Promise<void> {
    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.deleteSheetRow("Transactions", id);
      } catch (err) {
        console.warn("Google Sheets delete failed:", err);
      }
    }
    globalStore.transactions = globalStore.transactions.filter(
      (t: Transaction) => t.id !== id
    );
  },

  // Budgets
  async getBudgets(): Promise<CategoryBudget[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        return await sheets.getSheetRows<CategoryBudget>("Budgets");
      } catch (err) {
        console.warn("Google Sheets failed, falling back to local store:", err);
      }
    }
    return globalStore.budgets;
  },

  async updateBudget(id: string, updates: Partial<CategoryBudget>): Promise<CategoryBudget> {
    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.updateSheetRow("Budgets", id, updates);
      } catch (err) {
        console.warn("Google Sheets update failed:", err);
      }
    }
    const index = globalStore.budgets.findIndex((b: CategoryBudget) => b.id === id);
    if (index !== -1) {
      globalStore.budgets[index] = { ...globalStore.budgets[index], ...updates };
      return globalStore.budgets[index];
    }
    throw new Error(`Budget ${id} not found`);
  },

  // Goals
  async getGoals(): Promise<SavingsGoal[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        return await sheets.getSheetRows<SavingsGoal>("Goals");
      } catch (err) {
        console.warn("Google Sheets failed, falling back to local store:", err);
      }
    }
    return globalStore.goals;
  },

  async addGoal(goal: Omit<SavingsGoal, "id" | "createdAt">): Promise<SavingsGoal> {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.appendSheetRow("Goals", newGoal);
        return newGoal;
      } catch (err) {
        console.warn("Google Sheets write failed:", err);
      }
    }
    globalStore.goals.push(newGoal);
    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.updateSheetRow("Goals", id, updates);
      } catch (err) {
        console.warn("Google Sheets update failed:", err);
      }
    }
    const idx = globalStore.goals.findIndex((g: SavingsGoal) => g.id === id);
    if (idx !== -1) {
      globalStore.goals[idx] = { ...globalStore.goals[idx], ...updates };
      return globalStore.goals[idx];
    }
    throw new Error(`Goal ${id} not found`);
  },

  // Recurring
  async getRecurring(): Promise<RecurringBill[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        return await sheets.getSheetRows<RecurringBill>("Recurring");
      } catch (err) {
        console.warn("Google Sheets failed, falling back to local store:", err);
      }
    }
    return globalStore.recurring;
  },

  // Settlements / IOU
  async getSettlements(): Promise<Settlement[]> {
    if (isGoogleSheetsConfigured()) {
      try {
        return await sheets.getSheetRows<Settlement>("Settlements");
      } catch (err) {
        console.warn("Google Sheets failed, falling back to local store:", err);
      }
    }
    return globalStore.settlements;
  },

  async addSettlement(settlement: Omit<Settlement, "id">): Promise<Settlement> {
    const newS: Settlement = {
      ...settlement,
      id: `stl_${Date.now()}`,
    };
    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.appendSheetRow("Settlements", newS);
        return newS;
      } catch (err) {
        console.warn("Google Sheets write failed:", err);
      }
    }
    globalStore.settlements.unshift(newS);
    return newS;
  },

  // Calculated Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [txs, budgets, goals, settlements] = await Promise.all([
      db.getTransactions(),
      db.getBudgets(),
      db.getGoals(),
      db.getSettlements(),
    ]);

    const totalIncome = 7800; // Shared combined monthly income baseline

    // Total expenses this month
    const totalExpenses = txs.reduce((acc, t) => acc + (t.amount || 0), 0);

    // Partner breakdown
    const partnerASpent = txs
      .filter((t) => t.paidBy === "partner_a")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const partnerBSpent = txs
      .filter((t) => t.paidBy === "partner_b")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    // Total savings across goals
    const combinedNetSavings = goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);

    // Savings rate
    const savingsRate =
      totalIncome > 0
        ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100))
        : 0;

    // Safe to Spend Daily calculation
    const totalMonthlyBudget = budgets.reduce(
      (acc, b) => acc + (b.monthlyLimit || 0) + (b.rolloverEnabled ? b.rolloverAccumulated || 0 : 0),
      0
    );
    const totalBudgetSpent = budgets.reduce((acc, b) => acc + (b.spentAmount || 0), 0);
    const budgetRemaining = Math.max(0, totalMonthlyBudget - totalBudgetSpent);
    const daysLeft = getDaysRemainingInMonth();
    const safeToSpendDaily = Math.round((budgetRemaining / daysLeft) * 100) / 100;

    // IOU calculation:
    // For every shared transaction:
    // If Partner A paid $100 on a 50/50 split, Partner B owes A $50.
    // Factor in settled amounts from Settlements tab.
    let balanceAtoB = 0; // positive means B owes A, negative means A owes B
    for (const t of txs) {
      const splitA =
        t.splitRatio === "50/50"
          ? 50
          : t.splitRatio === "60/40"
          ? 60
          : t.splitRatio === "70/30"
          ? 70
          : t.splitRatio === "100/0"
          ? 100
          : t.splitRatio === "0/100"
          ? 0
          : t.partnerASplitPercentage ?? 50;

      const shareA = (t.amount * splitA) / 100;
      const shareB = t.amount - shareA;

      if (t.paidBy === "partner_a") {
        // Partner A paid, B owes their shareB
        balanceAtoB += shareB;
      } else {
        // Partner B paid, A owes their shareA
        balanceAtoB -= shareA;
      }
    }

    // Offset settlements
    for (const s of settlements) {
      if (s.status === "settled") {
        if (s.fromPartner === "partner_b" && s.toPartner === "partner_a") {
          balanceAtoB -= s.amount;
        } else if (s.fromPartner === "partner_a" && s.toPartner === "partner_b") {
          balanceAtoB += s.amount;
        }
      }
    }

    const netIOU: DashboardMetrics["netIOU"] =
      balanceAtoB >= 0
        ? { from: "partner_b", to: "partner_a", amount: Math.round(balanceAtoB * 100) / 100 }
        : { from: "partner_a", to: "partner_b", amount: Math.round(Math.abs(balanceAtoB) * 100) / 100 };

    const pendingApprovalsCount = txs.filter(
      (t) => t.needsApproval && !t.approvedByPartner
    ).length;

    return {
      combinedNetSavings,
      combinedTotalIncome: totalIncome,
      combinedTotalExpenses: Math.round(totalExpenses * 100) / 100,
      savingsRate,
      safeToSpendDaily,
      daysRemainingInMonth: daysLeft,
      partnerASpent: Math.round(partnerASpent * 100) / 100,
      partnerBSpent: Math.round(partnerBSpent * 100) / 100,
      netIOU,
      pendingApprovalsCount,
    };
  },
};
