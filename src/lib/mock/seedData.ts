import {
  UserProfile,
  Transaction,
  CategoryBudget,
  SavingsGoal,
  RecurringBill,
  Settlement,
} from "@/types";

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "user_a",
    partnerKey: "partner_a",
    name: "Partner A",
    nickname: "Partner A",
    email: process.env.PARTNER_A_EMAIL || "hanzangelobernabe212@gmail.com",
    avatarUrl: "",
    themeAccent: "#6366f1", // Indigo
    hasPin: false,
  },
  {
    id: "user_b",
    partnerKey: "partner_b",
    name: "Partner B",
    nickname: "Partner B",
    email: process.env.PARTNER_B_EMAIL || "causon.julia@gmail.com",
    avatarUrl: "",
    themeAccent: "#0d9488", // Teal
    hasPin: false,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: CategoryBudget[] = [];

export const INITIAL_GOALS: SavingsGoal[] = [];

export const INITIAL_RECURRING: RecurringBill[] = [];

export const INITIAL_SETTLEMENTS: Settlement[] = [];
