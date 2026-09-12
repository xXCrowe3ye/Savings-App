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
import { isSupabaseConfigured } from "./supabase/client";
import * as supabaseService from "./supabase/supabaseService";
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
  sharedIncome: number = 0;
}

// Global singleton across serverless invocations in dev
const globalStore = (global as any).__BABI_SAVINGS_STORE__ || new InMemoryStore();
if (process.env.NODE_ENV !== "production") {
  (global as any).__BABI_SAVINGS_STORE__ = globalStore;
}

export const db = {
  isSupabase: () => isSupabaseConfigured(),
  isLiveGoogleSheets: () => isGoogleSheetsConfigured(),

  // Users
  async getUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSupabaseUsers();
      } catch (err) {
        console.warn("Supabase getUsers failed, falling back:", err);
      }
    }
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

  async updateUser(id: string, updates: Partial<UserProfile>): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.updateSupabaseUser(id, updates);
      } catch (err) {
        console.warn("Supabase updateUser failed:", err);
      }
    }
    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.updateSheetRow("Users", id, updates);
      } catch (err) {
        console.warn("Google Sheets updateUser failed:", err);
      }
    }
    const idx = globalStore.users.findIndex((u: UserProfile) => u.id === id);
    if (idx !== -1) {
      globalStore.users[idx] = { ...globalStore.users[idx], ...updates };
    }
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSupabaseTransactions();
      } catch (err) {
        console.warn("Supabase getTransactions failed, falling back:", err);
      }
    }
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

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addSupabaseTransaction(tx);
      } catch (err) {
        console.warn("Supabase addTransaction failed, saving locally:", err);
      }
    }

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
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updateSupabaseTransaction(id, updates);
      } catch (err) {
        console.warn("Supabase updateTransaction failed:", err);
      }
    }

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
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.deleteSupabaseTransaction(id);
        return;
      } catch (err) {
        console.warn("Supabase deleteTransaction failed:", err);
      }
    }

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
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSupabaseBudgets();
      } catch (err) {
        console.warn("Supabase getBudgets failed, falling back:", err);
      }
    }
    if (isGoogleSheetsConfigured()) {
      try {
        return await sheets.getSheetRows<CategoryBudget>("Budgets");
      } catch (err) {
        console.warn("Google Sheets failed, falling back to local store:", err);
      }
    }
    return globalStore.budgets;
  },

  async addBudget(budget: Omit<CategoryBudget, "id">): Promise<CategoryBudget> {
    const newBudget: CategoryBudget = {
      ...budget,
      id: `bg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spentAmount: budget.spentAmount || 0,
      rolloverAccumulated: budget.rolloverAccumulated || 0,
      alertThreshold: budget.alertThreshold || 0.9,
    };

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addSupabaseBudget(budget);
      } catch (err) {
        console.warn("Supabase addBudget failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.appendSheetRow("Budgets", newBudget);
        return newBudget;
      } catch (err) {
        console.warn("Google Sheets addBudget failed:", err);
      }
    }

    globalStore.budgets.push(newBudget);
    return newBudget;
  },

  async updateBudget(id: string, updates: Partial<CategoryBudget>): Promise<CategoryBudget> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updateSupabaseBudget(id, updates);
      } catch (err) {
        console.warn("Supabase updateBudget failed:", err);
      }
    }
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

  async deleteBudget(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.deleteSupabaseBudget(id);
        return;
      } catch (err) {
        console.warn("Supabase deleteBudget failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.deleteSheetRow("Budgets", id);
      } catch (err) {
        console.warn("Google Sheets deleteBudget failed:", err);
      }
    }
    globalStore.budgets = globalStore.budgets.filter((b: CategoryBudget) => b.id !== id);
  },

  // Goals
  async getGoals(): Promise<SavingsGoal[]> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSupabaseGoals();
      } catch (err) {
        console.warn("Supabase getGoals failed, falling back:", err);
      }
    }
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
      currentAmount: goal.currentAmount || 0,
      partnerAContribution: goal.partnerAContribution || 0,
      partnerBContribution: goal.partnerBContribution || 0,
    };

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addSupabaseGoal(goal);
      } catch (err) {
        console.warn("Supabase addGoal failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.appendSheetRow("Goals", newGoal);
        return newGoal;
      } catch (err) {
        console.warn("Google Sheets addGoal failed:", err);
      }
    }

    globalStore.goals.push(newGoal);
    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updateSupabaseGoal(id, updates);
      } catch (err) {
        console.warn("Supabase updateGoal failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.updateSheetRow("Goals", id, updates);
      } catch (err) {
        console.warn("Google Sheets updateGoal failed:", err);
      }
    }

    const index = globalStore.goals.findIndex((g: SavingsGoal) => g.id === id);
    if (index !== -1) {
      globalStore.goals[index] = { ...globalStore.goals[index], ...updates };
      return globalStore.goals[index];
    }
    throw new Error(`Goal ${id} not found`);
  },

  async deleteGoal(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.deleteSupabaseGoal(id);
        return;
      } catch (err) {
        console.warn("Supabase deleteGoal failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.deleteSheetRow("Goals", id);
      } catch (err) {
        console.warn("Google Sheets deleteGoal failed:", err);
      }
    }
    globalStore.goals = globalStore.goals.filter((g: SavingsGoal) => g.id !== id);
  },

  // Recurring
  async getRecurring(): Promise<RecurringBill[]> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSupabaseRecurring();
      } catch (err) {
        console.warn("Supabase getRecurring failed, falling back:", err);
      }
    }
    if (isGoogleSheetsConfigured()) {
      try {
        return await sheets.getSheetRows<RecurringBill>("Recurring");
      } catch (err) {
        console.warn("Google Sheets failed, falling back to local store:", err);
      }
    }
    return globalStore.recurring;
  },

  async addRecurring(bill: Omit<RecurringBill, "id">): Promise<RecurringBill> {
    const newBill: RecurringBill = {
      ...bill,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addSupabaseRecurring(bill);
      } catch (err) {
        console.warn("Supabase addRecurring failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.appendSheetRow("Recurring", newBill);
        return newBill;
      } catch (err) {
        console.warn("Google Sheets addRecurring failed:", err);
      }
    }

    globalStore.recurring.push(newBill);
    return newBill;
  },

  async updateRecurring(id: string, updates: Partial<RecurringBill>): Promise<RecurringBill> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updateSupabaseRecurring(id, updates);
      } catch (err) {
        console.warn("Supabase updateRecurring failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.updateSheetRow("Recurring", id, updates);
      } catch (err) {
        console.warn("Google Sheets updateRecurring failed:", err);
      }
    }

    const index = globalStore.recurring.findIndex((r: RecurringBill) => r.id === id);
    if (index !== -1) {
      globalStore.recurring[index] = { ...globalStore.recurring[index], ...updates };
      return globalStore.recurring[index];
    }
    throw new Error(`Recurring bill ${id} not found`);
  },

  async deleteRecurring(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.deleteSupabaseRecurring(id);
        return;
      } catch (err) {
        console.warn("Supabase deleteRecurring failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.deleteSheetRow("Recurring", id);
      } catch (err) {
        console.warn("Google Sheets deleteRecurring failed:", err);
      }
    }
    globalStore.recurring = globalStore.recurring.filter((r: RecurringBill) => r.id !== id);
  },

  // Settlements
  async getSettlements(): Promise<Settlement[]> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSupabaseSettlements();
      } catch (err) {
        console.warn("Supabase getSettlements failed, falling back:", err);
      }
    }
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
    const newSettlement: Settlement = {
      ...settlement,
      id: `stl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addSupabaseSettlement(settlement);
      } catch (err) {
        console.warn("Supabase addSettlement failed:", err);
      }
    }

    if (isGoogleSheetsConfigured()) {
      try {
        await sheets.appendSheetRow("Settlements", newSettlement);
        return newSettlement;
      } catch (err) {
        console.warn("Google Sheets addSettlement failed:", err);
      }
    }

    globalStore.settlements.push(newSettlement);
    return newSettlement;
  },

  // Shared Income Settings
  async getSharedIncome(): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSupabaseSharedIncome();
      } catch {}
    }
    return globalStore.sharedIncome || 0;
  },

  async updateSharedIncome(income: number): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.updateSupabaseSharedIncome(income);
      } catch (err) {
        console.warn("Supabase updateSharedIncome failed:", err);
      }
    }
    globalStore.sharedIncome = income;
  },

  // Calculated Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [txs, budgets, goals, settlements, totalIncome] = await Promise.all([
      db.getTransactions(),
      db.getBudgets(),
      db.getGoals(),
      db.getSettlements(),
      db.getSharedIncome(),
    ]);

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Filter strictly to current month expenses for spend metrics (exclude savings deposits, settlements, income)
    const expenseTxs = txs.filter((t) => (t.type || "expense") === "expense");
    const currentMonthExpenseTxs = expenseTxs.filter((t) => t.date.startsWith(currentMonthPrefix));

    // Total expenses this month
    const totalExpenses = currentMonthExpenseTxs.reduce((acc, t) => acc + (t.amount || 0), 0);

    // Partner breakdown (current month expenses)
    const partnerASpent = currentMonthExpenseTxs
      .filter((t) => t.paidBy === "partner_a")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const partnerBSpent = currentMonthExpenseTxs
      .filter((t) => t.paidBy === "partner_b")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    // Total savings across goals
    const combinedNetSavings = goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);

    // Savings rate (Current month cash surplus percentage)
    const savingsRate =
      totalIncome > 0
        ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100))
        : 0;

    // Dynamic Category Spend aggregation for current month
    const categorySpentMap: Record<string, number> = {};
    for (const t of currentMonthExpenseTxs) {
      categorySpentMap[t.category] = (categorySpentMap[t.category] || 0) + t.amount;
    }

    // Safe to Spend Daily calculation (real-time automated pacing)
    const totalMonthlyBudget = budgets.reduce(
      (acc, b) => acc + (b.monthlyLimit || 0) + (b.rolloverEnabled ? b.rolloverAccumulated || 0 : 0),
      0
    );
    const daysLeft = getDaysRemainingInMonth();

    let safeToSpendDaily = 0;
    if (totalMonthlyBudget > 0) {
      const budgetRemaining = Math.max(0, totalMonthlyBudget - totalExpenses);
      safeToSpendDaily = Math.round((budgetRemaining / daysLeft) * 100) / 100;
    } else if (totalIncome > 0) {
      const incomeRemaining = Math.max(0, totalIncome - totalExpenses);
      safeToSpendDaily = Math.round((incomeRemaining / daysLeft) * 100) / 100;
    }

    // IOU calculation (for shared expenses only)
    // balanceAtoB: positive means Partner B owes Partner A; negative means Partner A owes Partner B
    let balanceAtoB = 0;
    for (const t of expenseTxs) {
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
        balanceAtoB += shareB;
      } else {
        balanceAtoB -= shareA;
      }
    }

    // Offset settlements (from settlements store or transactions with type === "settlement")
    const allSettlements: { fromPartner: string; toPartner: string; amount: number }[] = [
      ...settlements.filter((s) => s.status === "settled"),
    ];

    // Also include any settlement transactions not yet reflected in settlements list
    const settlementTxs = txs.filter((t) => t.type === "settlement");
    for (const st of settlementTxs) {
      const alreadyIn = settlements.some((s) => s.id === st.id || s.note?.includes(st.id));
      if (!alreadyIn) {
        allSettlements.push({
          fromPartner: st.paidBy,
          toPartner: st.paidBy === "partner_a" ? "partner_b" : "partner_a",
          amount: st.amount,
        });
      }
    }

    for (const s of allSettlements) {
      if (s.fromPartner === "partner_b" && s.toPartner === "partner_a") {
        balanceAtoB -= s.amount;
      } else if (s.fromPartner === "partner_a" && s.toPartner === "partner_b") {
        balanceAtoB += s.amount;
      }
    }

    const roundedBalance = Math.round(balanceAtoB * 100) / 100;
    const netIOU: DashboardMetrics["netIOU"] =
      Math.abs(roundedBalance) < 0.01
        ? { from: "partner_b", to: "partner_a", amount: 0 }
        : roundedBalance > 0
        ? { from: "partner_b", to: "partner_a", amount: roundedBalance }
        : { from: "partner_a", to: "partner_b", amount: Math.abs(roundedBalance) };

    const pendingApprovalsCount = expenseTxs.filter(
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
