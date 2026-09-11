import { getGoogleSheetsClient } from "./client";
import { sanitizeForGoogleSheets } from "@/lib/sanitize";
import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  RecurringBill,
  Settlement,
  UserProfile,
} from "@/types";
import { INITIAL_USERS } from "@/lib/mock/seedData";

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID?.trim();
  if (!id) {
    throw new Error("GOOGLE_SHEET_ID is missing in environment variables.");
  }
  return id;
}

// Tab Headers definition
export const TAB_HEADERS = {
  Users: [
    "id",
    "partnerKey",
    "name",
    "nickname",
    "email",
    "avatarUrl",
    "passwordHash",
    "pinHash",
    "themeAccent",
    "createdAt",
  ],
  Transactions: [
    "id",
    "type",
    "date",
    "amount",
    "category",
    "description",
    "paidBy",
    "splitRatio",
    "partnerASplitPercentage",
    "goalId",
    "isRecurring",
    "needsApproval",
    "approvedByPartner",
    "receiptUrl",
    "notes",
    "createdAt",
  ],
  Budgets: [
    "id",
    "category",
    "icon",
    "monthlyLimit",
    "spentAmount",
    "rolloverEnabled",
    "rolloverAccumulated",
    "alertThreshold",
    "monthYear",
  ],
  Goals: [
    "id",
    "title",
    "emoji",
    "targetAmount",
    "currentAmount",
    "targetDate",
    "category",
    "priority",
    "partnerAContribution",
    "partnerBContribution",
    "roundupEnabled",
    "roundupUnit",
    "status",
    "createdAt",
  ],
  Recurring: [
    "id",
    "title",
    "amount",
    "frequency",
    "billingDay",
    "category",
    "paidBy",
    "lastBilledDate",
    "previousAmount",
    "lastActiveDate",
    "status",
    "notes",
  ],
  Settlements: ["id", "date", "fromPartner", "toPartner", "amount", "status", "note"],
};

// ---------------------------------------------------------------------------
// In-Memory Cache with Stale-While-Revalidate & 30s TTL
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheStore {
  data: Record<string, any[]>;
  timestamps: Record<string, number>;
  batchPromise: Promise<void> | null;
  schemaInitialized: boolean;
}

const memoryStore: CacheStore = {
  data: {},
  timestamps: {},
  batchPromise: null,
  schemaInitialized: false,
};

function parseRowData<T>(tabName: keyof typeof TAB_HEADERS, row: any[]): T {
  const headers = TAB_HEADERS[tabName];
  const obj: any = {};
  headers.forEach((header, index) => {
    let val = row[index] !== undefined ? row[index] : "";
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (
      [
        "amount",
        "monthlyLimit",
        "spentAmount",
        "rolloverAccumulated",
        "alertThreshold",
        "targetAmount",
        "currentAmount",
        "partnerAContribution",
        "partnerBContribution",
        "roundupUnit",
        "billingDay",
        "previousAmount",
        "partnerASplitPercentage",
      ].includes(header) &&
      val !== ""
    ) {
      val = Number(val);
    }
    obj[header] = val;
  });
  return obj as T;
}

/**
 * Initializes Google Sheet tabs and header rows once per server lifecycle.
 */
let initPromise: Promise<void> | null = null;
export async function ensureSpreadsheetInitialized(): Promise<void> {
  if (memoryStore.schemaInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const sheetId = getSpreadsheetId();
      const sheets = getGoogleSheetsClient();
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const existingTitles = meta.data.sheets?.map((s) => s.properties?.title) || [];

      const requests: any[] = [];
      for (const tabName of Object.keys(TAB_HEADERS)) {
        if (!existingTitles.includes(tabName)) {
          requests.push({
            addSheet: {
              properties: { title: tabName },
            },
          });
        }
      }

      if (requests.length > 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: { requests },
        });
      }

      // Check header existence in one batch request
      const headerRanges = Object.keys(TAB_HEADERS).map((t) => `'${t}'!A1:Z1`);
      const batchHeaders = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges: headerRanges,
      });

      const valueRanges = batchHeaders.data.valueRanges || [];
      const updateValuesRequests: { range: string; values: any[][] }[] = [];
      const appendUsersRequests: any[][] = [];

      Object.keys(TAB_HEADERS).forEach((tabName, idx) => {
        const vr = valueRanges[idx];
        const headers = (TAB_HEADERS as any)[tabName];
        if (!vr?.values || vr.values.length === 0) {
          updateValuesRequests.push({
            range: `'${tabName}'!A1`,
            values: [headers],
          });
          if (tabName === "Users") {
            INITIAL_USERS.forEach((u) => {
              appendUsersRequests.push(headers.map((h: string) => (u as any)[h] ?? ""));
            });
          }
        }
      });

      if (updateValuesRequests.length > 0) {
        for (const req of updateValuesRequests) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: req.range,
            valueInputOption: "RAW",
            requestBody: { values: req.values },
          });
        }
      }

      if (appendUsersRequests.length > 0) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: "'Users'!A2",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: appendUsersRequests },
        });
      }

      memoryStore.schemaInitialized = true;
    } catch (err: any) {
      console.warn("Schema initialization notice:", err?.message || err);
      // Mark as initialized so transient failures don't loop on every read
      memoryStore.schemaInitialized = true;
    }
  })();

  return initPromise;
}

/**
 * Single Batch Read: Fetches ALL 6 tabs in 1 single Google Sheets API call.
 */
async function refreshAllTabsBatch(): Promise<void> {
  if (memoryStore.batchPromise) return memoryStore.batchPromise;

  memoryStore.batchPromise = (async () => {
    try {
      await ensureSpreadsheetInitialized();
      const sheetId = getSpreadsheetId();
      const sheets = getGoogleSheetsClient();

      const tabNames = Object.keys(TAB_HEADERS) as (keyof typeof TAB_HEADERS)[];
      const ranges = tabNames.map((t) => `'${t}'!A2:Z`);

      const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges,
      });

      const valueRanges = res.data.valueRanges || [];
      const now = Date.now();

      tabNames.forEach((tabName, idx) => {
        const rawRows = valueRanges[idx]?.values || [];
        const parsed = rawRows.map((r) => parseRowData(tabName, r));
        memoryStore.data[tabName] = parsed;
        memoryStore.timestamps[tabName] = now;
      });
    } catch (err: any) {
      console.warn("Google Sheets batch read warning (serving cached fallback):", err?.message || err);
    } finally {
      memoryStore.batchPromise = null;
    }
  })();

  return memoryStore.batchPromise;
}

/**
 * Reads all rows from a given sheet tab with fast caching and single-batch optimization.
 */
export async function getSheetRows<T>(tabName: keyof typeof TAB_HEADERS): Promise<T[]> {
  const now = Date.now();
  const cached = memoryStore.data[tabName];
  const lastFetched = memoryStore.timestamps[tabName] || 0;

  // Serve from cache if within TTL
  if (cached && now - lastFetched < CACHE_TTL_MS) {
    return cached as T[];
  }

  // Refresh all tabs in 1 single API call
  await refreshAllTabsBatch();

  return (memoryStore.data[tabName] || []) as T[];
}

/**
 * Appends a record to a given sheet tab.
 */
export async function appendSheetRow(tabName: keyof typeof TAB_HEADERS, record: Record<string, any>) {
  // Optimistically update memory cache immediately
  if (!memoryStore.data[tabName]) memoryStore.data[tabName] = [];
  memoryStore.data[tabName].unshift(record);

  try {
    await ensureSpreadsheetInitialized();
    const sheetId = getSpreadsheetId();
    const sheets = getGoogleSheetsClient();
    const headers = TAB_HEADERS[tabName];
    const rowValues = headers.map((header) => {
      const val = record[header];
      return sanitizeForGoogleSheets(val !== undefined ? val : "");
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `'${tabName}'!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });
  } catch (err: any) {
    console.warn(`Append to ${tabName} in Google Sheets failed:`, err?.message || err);
  }
}

/**
 * Updates a specific row by matching ID.
 */
export async function updateSheetRow(
  tabName: keyof typeof TAB_HEADERS,
  id: string,
  updatedFields: Record<string, any>
) {
  // Optimistically update memory cache
  if (memoryStore.data[tabName]) {
    const idx = memoryStore.data[tabName].findIndex((r) => r.id === id);
    if (idx !== -1) {
      memoryStore.data[tabName][idx] = { ...memoryStore.data[tabName][idx], ...updatedFields };
    }
  }

  try {
    await ensureSpreadsheetInitialized();
    const sheetId = getSpreadsheetId();
    const sheets = getGoogleSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${tabName}'!A1:Z`,
    });

    const rows = res.data.values || [];
    const headers = TAB_HEADERS[tabName];
    const idColIndex = headers.indexOf("id");

    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIndex] === id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex !== -1) {
      const existingRow = rows[rowIndex - 1];
      const mergedRecord: any = {};
      headers.forEach((h, hIdx) => {
        mergedRecord[h] = existingRow[hIdx];
      });
      Object.assign(mergedRecord, updatedFields);

      const updatedRowValues = headers.map((h) =>
        sanitizeForGoogleSheets(mergedRecord[h] !== undefined ? mergedRecord[h] : "")
      );

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${tabName}'!A${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [updatedRowValues],
        },
      });
    }
  } catch (err: any) {
    console.warn(`Update row in ${tabName} failed:`, err?.message || err);
  }
}

/**
 * Deletes a row matching ID.
 */
export async function deleteSheetRow(tabName: keyof typeof TAB_HEADERS, id: string) {
  // Optimistically remove from memory cache
  if (memoryStore.data[tabName]) {
    memoryStore.data[tabName] = memoryStore.data[tabName].filter((r) => r.id !== id);
  }

  try {
    await ensureSpreadsheetInitialized();
    const sheetId = getSpreadsheetId();
    const sheets = getGoogleSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const targetSheet = meta.data.sheets?.find((s) => s.properties?.title === tabName);
    const targetSheetId = targetSheet?.properties?.sheetId;

    if (targetSheetId === undefined) return;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${tabName}'!A1:A`,
    });

    const rows = res.data.values || [];
    let rowIndex0 = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        rowIndex0 = i;
        break;
      }
    }

    if (rowIndex0 === -1) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: targetSheetId,
                dimension: "ROWS",
                startIndex: rowIndex0,
                endIndex: rowIndex0 + 1,
              },
            },
          },
        ],
      },
    });
  } catch (err: any) {
    console.warn(`Delete row in ${tabName} failed:`, err?.message || err);
  }
}
