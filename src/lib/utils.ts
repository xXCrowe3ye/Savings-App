import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CurrencyCode, CurrencyConfig } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$", label: "US Dollar ($)" },
  EUR: { code: "EUR", symbol: "€", label: "Euro (€)" },
  GBP: { code: "GBP", symbol: "£", label: "British Pound (£)" },
  PHP: { code: "PHP", symbol: "₱", label: "Philippine Peso (₱)" },
  JPY: { code: "JPY", symbol: "¥", label: "Japanese Yen (¥)" },
};

/**
 * Formats monetary amounts according to selected currency.
 */
export function formatMoney(amount: number, currencyCode: CurrencyCode = "USD"): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const isZeroDecimals = currencyCode === "JPY";
  
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: isZeroDecimals ? 0 : 2,
    maximumFractionDigits: isZeroDecimals ? 0 : 2,
  }).format(Math.abs(amount));

  return `${amount < 0 ? "-" : ""}${config.symbol}${formatted}`;
}

/**
 * Calculates spare change round-up for a transaction.
 * E.g., for $14.20 with unit=1 -> round up to $15 -> spare change is $0.80.
 * For $14.20 with unit=5 -> round up to $15 -> spare change is $0.80.
 * For $17.50 with unit=5 -> round up to $20 -> spare change is $2.50.
 */
export function calculateRoundUp(amount: number, unit: 1 | 5 = 1): number {
  if (amount <= 0) return 0;
  const roundedTarget = Math.ceil(amount / unit) * unit;
  const diff = roundedTarget - amount;
  return Number((diff === 0 ? 0 : diff).toFixed(2));
}

/**
 * Calculates remaining days in the current calendar month.
 */
export function getDaysRemainingInMonth(date: Date = new Date()): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const currentDay = date.getDate();
  return Math.max(1, lastDay - currentDay + 1);
}

/**
 * Calculates required weekly & monthly savings pace to hit a goal by its target date.
 */
export function calculateRequiredPace(
  currentAmount: number,
  targetAmount: number,
  targetDateStr: string
): { monthlyPace: number; weeklyPace: number; daysLeft: number } {
  const remaining = Math.max(0, targetAmount - currentAmount);
  if (remaining === 0) return { monthlyPace: 0, weeklyPace: 0, daysLeft: 0 };

  const targetDate = new Date(targetDateStr);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeksLeft = Math.max(0.2, daysLeft / 7);
  const monthsLeft = Math.max(0.1, daysLeft / 30.44);

  return {
    monthlyPace: Math.round((remaining / monthsLeft) * 100) / 100,
    weeklyPace: Math.round((remaining / weeksLeft) * 100) / 100,
    daysLeft,
  };
}

/**
 * Smart Natural Language Parser for instant expense logging.
 * Matches patterns like "35 dinner", "coffee 4.50", "uber $18 yesterday", "groceries 120"
 */
export interface ParsedQuickEntry {
  amount: number | null;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["dinner", "lunch", "breakfast", "coffee", "groceries", "supermarket", "cafe", "takeout", "snack", "pizza", "burger"],
  Transportation: ["uber", "lyft", "gas", "fuel", "train", "subway", "metro", "bus", "toll", "parking", "flight"],
  Housing: ["rent", "mortgage", "water", "electricity", "power", "utility", "wifi", "internet", "maintenance"],
  Entertainment: ["netflix", "spotify", "movie", "cinema", "concert", "game", "steam", "bar", "drinks", "club"],
  Shopping: ["clothes", "shoes", "amazon", "electronics", "gadget", "target", "ikea", "decor"],
  Health: ["pharmacy", "medicine", "doctor", "dentist", "gym", "workout", "therapy"],
  Personal: ["haircut", "salon", "spa", "cosmetics", "gift"],
};

export function parseNaturalLanguageEntry(text: string): ParsedQuickEntry {
  const today = new Date().toISOString().split("T")[0];
  const lower = text.toLowerCase().trim();

  // Extract amount: numbers with optional dollar sign and decimals (e.g., $35, 45.50, 120)
  const amountMatch = lower.match(/(?:\$|€|£|₱|¥)?\s*(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

  // Extract date keyword
  let date = today;
  if (lower.includes("yesterday")) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split("T")[0];
  }

  // Remove amount and date keyword from raw text to get description
  let cleanedText = lower
    .replace(/(?:\$|€|£|₱|¥)?\s*\d+(?:\.\d{1,2})?/, "")
    .replace(/\byesterday\b/, "")
    .replace(/\btoday\b/, "")
    .trim();

  // Guess category
  let matchedCategory = "General";
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => cleanedText.includes(kw))) {
      matchedCategory = cat;
      break;
    }
  }

  // Capitalize description
  const description =
    cleanedText.length > 0
      ? cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1)
      : matchedCategory;

  return {
    amount,
    category: matchedCategory,
    description,
    date,
  };
}
