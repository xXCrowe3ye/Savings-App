/**
 * Security & Sanitization Utilities
 * Protects against Google Sheets Formula Injection (CSV/Spreadsheet Injection)
 * and Cross-Site Scripting (XSS).
 */

const FORMULA_INJECTION_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Escapes strings to prevent Google Sheets Formula Injection attacks.
 * If a cell string starts with dangerous characters, it prepends a single quote (').
 */
export function sanitizeForGoogleSheets(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) return value;

  // Check if first character matches formula triggers
  for (const prefix of FORMULA_INJECTION_PREFIXES) {
    if (trimmed.startsWith(prefix)) {
      return `'${value}`;
    }
  }

  return value;
}

/**
 * Strips dangerous injection characters from input strings.
 */
export function stripFormulaTriggers(input: string): string {
  if (!input) return "";
  let sanitized = input;
  while (FORMULA_INJECTION_PREFIXES.some((prefix) => sanitized.startsWith(prefix))) {
    sanitized = sanitized.slice(1).trim();
  }
  return sanitized;
}

/**
 * Basic HTML/XSS entity escaping for user-submitted notes and comments.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Recursively sanitizes object values before sending to Google Sheets or storing.
 */
export function sanitizeRecord<T extends Record<string, unknown>>(record: T): T {
  const result = { ...record };
  for (const [key, val] of Object.entries(result)) {
    if (typeof val === "string") {
      (result as Record<string, unknown>)[key] = sanitizeForGoogleSheets(val);
    }
  }
  return result;
}
