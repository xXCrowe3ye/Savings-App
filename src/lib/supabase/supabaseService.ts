import { getSupabaseClient } from "./client";
import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  RecurringBill,
  Settlement,
  UserProfile,
} from "@/types";

// Helper mapper functions from snake_case to camelCase
function mapUser(row: any): UserProfile {
  return {
    id: row.id,
    partnerKey: row.partner_key,
    name: row.name,
    nickname: row.nickname || "",
    email: row.email,
    avatarUrl: row.avatar_url || "",
    themeAccent: row.theme_accent || "#6366f1",
    hasPin: Boolean(row.has_pin),
  };
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type || "expense",
    date: row.date,
    amount: Number(row.amount),
    category: row.category,
    description: row.description,
    paidBy: row.paid_by,
    splitRatio: row.split_ratio || "50/50",
    partnerASplitPercentage: row.partner_a_split_percentage !== null ? Number(row.partner_a_split_percentage) : 50,
    goalId: row.goal_id || undefined,
    isRecurring: Boolean(row.is_recurring),
    needsApproval: Boolean(row.needs_approval),
    approvedByPartner: Boolean(row.approved_by_partner),
    receiptUrl: row.receipt_url || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

function mapBudget(row: any): CategoryBudget {
  return {
    id: row.id,
    category: row.category,
    icon: row.icon,
    monthlyLimit: Number(row.monthly_limit),
    spentAmount: Number(row.spent_amount || 0),
    rolloverEnabled: Boolean(row.rollover_enabled),
    rolloverAccumulated: Number(row.rollover_accumulated || 0),
    alertThreshold: Number(row.alert_threshold || 0.9),
    monthYear: row.month_year || undefined,
  };
}

function mapGoal(row: any): SavingsGoal {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount || 0),
    targetDate: row.target_date || undefined,
    category: row.category || undefined,
    priority: row.priority || "medium",
    partnerAContribution: Number(row.partner_a_contribution || 0),
    partnerBContribution: Number(row.partner_b_contribution || 0),
    roundupEnabled: Boolean(row.roundup_enabled),
    roundupUnit: (Number(row.roundup_unit) as 1 | 5) || 1,
    status: row.status || "active",
    createdAt: row.created_at,
  };
}

function mapRecurring(row: any): RecurringBill {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    frequency: row.frequency || "monthly",
    billingDay: Number(row.billing_day),
    category: row.category,
    paidBy: row.paid_by,
    lastBilledDate: row.last_billed_date || undefined,
    previousAmount: row.previous_amount !== null ? Number(row.previous_amount) : undefined,
    lastActiveDate: row.last_active_date || undefined,
    status: row.status || "active",
    notes: row.notes || undefined,
  };
}

function mapSettlement(row: any): Settlement {
  return {
    id: row.id,
    date: row.date,
    fromPartner: row.from_partner,
    toPartner: row.to_partner,
    amount: Number(row.amount),
    status: row.status || "settled",
    note: row.note || undefined,
  };
}

// ---------------------------------------------------------------------------
// Supabase Data Service Operations
// ---------------------------------------------------------------------------

export async function getSupabaseUsers(): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return (data || []).map(mapUser);
}

export async function updateSupabaseUser(id: string, updates: Partial<UserProfile>): Promise<void> {
  const supabase = getSupabaseClient();
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.themeAccent !== undefined) dbUpdates.theme_accent = updates.themeAccent;

  const { error } = await supabase.from("users").update(dbUpdates).eq("id", id);
  if (error) throw error;
}

export async function getSupabaseTransactions(): Promise<Transaction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapTransaction);
}

export async function addSupabaseTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
  const supabase = getSupabaseClient();
  const newId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const row = {
    id: newId,
    type: tx.type || "expense",
    date: tx.date,
    amount: tx.amount,
    category: tx.category,
    description: tx.description,
    paid_by: tx.paidBy,
    split_ratio: tx.splitRatio || "50/50",
    partner_a_split_percentage: tx.partnerASplitPercentage ?? 50,
    goal_id: tx.goalId || null,
    is_recurring: tx.isRecurring || false,
    needs_approval: tx.needsApproval || false,
    approved_by_partner: tx.approvedByPartner ?? true,
    receipt_url: tx.receiptUrl || null,
    notes: tx.notes || null,
  };

  const { data, error } = await supabase.from("transactions").insert(row).select().single();
  if (error) throw error;
  return mapTransaction(data);
}

export async function updateSupabaseTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
  const supabase = getSupabaseClient();
  const dbUpdates: any = {};
  if (updates.approvedByPartner !== undefined) dbUpdates.approved_by_partner = updates.approvedByPartner;
  if (updates.needsApproval !== undefined) dbUpdates.needs_approval = updates.needsApproval;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase.from("transactions").update(dbUpdates).eq("id", id).select().single();
  if (error) throw error;
  return mapTransaction(data);
}

export async function deleteSupabaseTransaction(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

export async function getSupabaseBudgets(): Promise<CategoryBudget[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("budgets").select("*");
  if (error) throw error;
  return (data || []).map(mapBudget);
}

export async function addSupabaseBudget(budget: Omit<CategoryBudget, "id">): Promise<CategoryBudget> {
  const supabase = getSupabaseClient();
  const newId = `bg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const row = {
    id: newId,
    category: budget.category,
    icon: budget.icon || "Tag",
    monthly_limit: budget.monthlyLimit,
    spent_amount: budget.spentAmount || 0,
    rollover_enabled: budget.rolloverEnabled || false,
    rollover_accumulated: budget.rolloverAccumulated || 0,
    alert_threshold: budget.alertThreshold || 0.9,
    month_year: budget.monthYear || null,
  };

  const { data, error } = await supabase.from("budgets").insert(row).select().single();
  if (error) throw error;
  return mapBudget(data);
}

export async function updateSupabaseBudget(id: string, updates: Partial<CategoryBudget>): Promise<CategoryBudget> {
  const supabase = getSupabaseClient();
  const dbUpdates: any = {};
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
  if (updates.monthlyLimit !== undefined) dbUpdates.monthly_limit = updates.monthlyLimit;
  if (updates.rolloverEnabled !== undefined) dbUpdates.rollover_enabled = updates.rolloverEnabled;
  if (updates.rolloverAccumulated !== undefined) dbUpdates.rollover_accumulated = updates.rolloverAccumulated;
  if (updates.spentAmount !== undefined) dbUpdates.spent_amount = updates.spentAmount;
  if (updates.alertThreshold !== undefined) dbUpdates.alert_threshold = updates.alertThreshold;

  const { data, error } = await supabase.from("budgets").update(dbUpdates).eq("id", id).select().single();
  if (error) throw error;
  return mapBudget(data);
}

export async function deleteSupabaseBudget(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

export async function getSupabaseGoals(): Promise<SavingsGoal[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("goals").select("*");
  if (error) throw error;
  return (data || []).map(mapGoal);
}

export async function addSupabaseGoal(goal: Omit<SavingsGoal, "id" | "createdAt">): Promise<SavingsGoal> {
  const supabase = getSupabaseClient();
  const newId = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const row = {
    id: newId,
    title: goal.title,
    emoji: goal.emoji,
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount || 0,
    target_date: goal.targetDate || null,
    category: goal.category || null,
    priority: goal.priority || "medium",
    partner_a_contribution: goal.partnerAContribution || 0,
    partner_b_contribution: goal.partnerBContribution || 0,
    roundup_enabled: goal.roundupEnabled || false,
    roundup_unit: goal.roundupUnit || 1,
    status: goal.status || "active",
  };

  const { data, error } = await supabase.from("goals").insert(row).select().single();
  if (error) throw error;
  return mapGoal(data);
}

export async function updateSupabaseGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
  const supabase = getSupabaseClient();
  const dbUpdates: any = {};
  if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
  if (updates.partnerAContribution !== undefined) dbUpdates.partner_a_contribution = updates.partnerAContribution;
  if (updates.partnerBContribution !== undefined) dbUpdates.partner_b_contribution = updates.partnerBContribution;
  if (updates.roundupEnabled !== undefined) dbUpdates.roundup_enabled = updates.roundupEnabled;
  if (updates.roundupUnit !== undefined) dbUpdates.roundup_unit = updates.roundupUnit;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { data, error } = await supabase.from("goals").update(dbUpdates).eq("id", id).select().single();
  if (error) throw error;
  return mapGoal(data);
}

export async function deleteSupabaseGoal(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

export async function getSupabaseRecurring(): Promise<RecurringBill[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("recurring").select("*");
  if (error) throw error;
  return (data || []).map(mapRecurring);
}

export async function addSupabaseRecurring(bill: Omit<RecurringBill, "id">): Promise<RecurringBill> {
  const supabase = getSupabaseClient();
  const newId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const row = {
    id: newId,
    title: bill.title,
    amount: bill.amount,
    frequency: bill.frequency || "monthly",
    billing_day: bill.billingDay,
    category: bill.category,
    paid_by: bill.paidBy,
    last_billed_date: bill.lastBilledDate || null,
    previous_amount: bill.previousAmount || null,
    last_active_date: bill.lastActiveDate || null,
    status: bill.status || "active",
    notes: bill.notes || null,
  };

  const { data, error } = await supabase.from("recurring").insert(row).select().single();
  if (error) throw error;
  return mapRecurring(data);
}

export async function updateSupabaseRecurring(id: string, updates: Partial<RecurringBill>): Promise<RecurringBill> {
  const supabase = getSupabaseClient();
  const dbUpdates: any = {};
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.lastActiveDate !== undefined) dbUpdates.last_active_date = updates.lastActiveDate;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase.from("recurring").update(dbUpdates).eq("id", id).select().single();
  if (error) throw error;
  return mapRecurring(data);
}

export async function deleteSupabaseRecurring(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("recurring").delete().eq("id", id);
  if (error) throw error;
}

export async function getSupabaseSettlements(): Promise<Settlement[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("settlements").select("*");
  if (error) throw error;
  return (data || []).map(mapSettlement);
}

export async function addSupabaseSettlement(settlement: Omit<Settlement, "id">): Promise<Settlement> {
  const supabase = getSupabaseClient();
  const newId = `stl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const row = {
    id: newId,
    date: settlement.date,
    from_partner: settlement.fromPartner,
    to_partner: settlement.toPartner,
    amount: settlement.amount,
    status: settlement.status || "settled",
    note: settlement.note || null,
  };

  const { data, error } = await supabase.from("settlements").insert(row).select().single();
  if (error) throw error;
  return mapSettlement(data);
}

// ---------------------------------------------------------------------------
// App Settings (Shared Monthly Income, etc.)
// ---------------------------------------------------------------------------

export async function getSupabaseSharedIncome(): Promise<number> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from("app_settings").select("value").eq("key", "shared_income").single();
    if (data?.value?.combinedTotalIncome) {
      return Number(data.value.combinedTotalIncome);
    }
  } catch {}
  return 0; // Default fallback if not set
}

export async function updateSupabaseSharedIncome(income: number): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "shared_income", value: { combinedTotalIncome: income } });
  if (error) throw error;
}
