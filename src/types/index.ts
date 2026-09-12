export type PartnerKey = "partner_a" | "partner_b";

export type SplitRatio = "50/50" | "60/40" | "70/30" | "100/0" | "0/100" | "custom";

export type PriorityLevel = "high" | "medium" | "low";

export type RecurrenceFrequency = "weekly" | "monthly" | "yearly";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "PHP" | "JPY";

export type TransactionType = "expense" | "savings" | "income" | "settlement";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export interface UserProfile {
  id: string;
  partnerKey: PartnerKey;
  name: string;
  nickname?: string;
  email: string;
  avatarUrl?: string;
  themeAccent: string; // Hex or color name
  hasPin: boolean;
}

export interface Transaction {
  id: string;
  type?: TransactionType; // expense (default) or savings deposit
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  description: string;
  paidBy: PartnerKey;
  splitRatio: SplitRatio;
  partnerASplitPercentage?: number; // e.g. 50
  goalId?: string; // If type === "savings", which goal was funded
  isRecurring?: boolean;
  needsApproval?: boolean;
  approvedByPartner?: boolean;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  syncedOffline?: boolean;
}

export interface CategoryBudget {
  id: string;
  category: string;
  icon: string;
  monthlyLimit: number;
  spentAmount: number;
  rolloverEnabled: boolean;
  rolloverAccumulated: number;
  alertThreshold: number; // default 0.9 (90%)
  monthYear: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  title: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  priority: PriorityLevel;
  partnerAContribution: number;
  partnerBContribution: number;
  roundupEnabled: boolean;
  roundupUnit: 1 | 5; // round up to nearest $1 or $5
  status: "active" | "achieved" | "paused";
  createdAt: string;
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  frequency: RecurrenceFrequency;
  billingDay: number; // 1-31
  category: string;
  paidBy: PartnerKey | "shared";
  lastBilledDate?: string;
  previousAmount?: number; // For inflation/anomaly alerts
  lastActiveDate?: string; // For unused subscription alerts (>60 days)
  status: "active" | "cancelled" | "flagged" | "paused";
  notes?: string;
}

export interface Settlement {
  id: string;
  date: string;
  fromPartner: PartnerKey;
  toPartner: PartnerKey;
  amount: number;
  status: "settled" | "pending";
  note?: string;
}

export interface DashboardMetrics {
  combinedNetSavings: number;
  combinedMonthlySavings: number; // MTD savings deposits
  combinedTotalIncome: number;
  combinedTotalExpenses: number;
  savingsRate: number; // percentage
  safeToSpendDaily: number;
  daysRemainingInMonth: number;
  partnerASpent: number;
  partnerBSpent: number;
  netIOU: {
    from: PartnerKey;
    to: PartnerKey;
    amount: number;
  };
  pendingApprovalsCount: number;
}
