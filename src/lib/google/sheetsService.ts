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
import {
  INITIAL_USERS,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_RECURRING,
  INITIAL_SETTLEMENTS,
} from "@/lib/mock/seedData";

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID?.trim();
  if (!id) {
    throw new Error("GOOGLE_SHEET_ID is missing in environment variables.");
  }
  return id;
}

// Tab Headers definition
export const TAB_HEADERS = {
  Users: ["id", "partnerKey", "name", "email", "passwordHash", "pinHash", "themeAccent", "createdAt"],
  Transactions: [
    "id",
    "date",
    "amount",
    "category",
    "description",
    "paidBy",
    "splitRatio",
    "partnerASplitPercentage",
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

let initPromise: Promise<void> | null = null;

/**
 * Initializes Google Sheet tabs and header rows if not present.
 */
export async function ensureSpreadsheetInitialized(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
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

    // Ensure header row and initial data are populated in each tab if empty
    for (const [tabName, headers] of Object.entries(TAB_HEADERS)) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `'${tabName}'!A1:Z1`,
        });

        if (!res.data.values || res.data.values.length === 0) {
          // Write headers
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `'${tabName}'!A1`,
            valueInputOption: "RAW",
            requestBody: { values: [headers] },
          });

          // Seed default sample records if first run
          let seedRows: any[][] = [];
          if (tabName === "Users") {
            seedRows = INITIAL_USERS.map((u) => headers.map((h) => (u as any)[h] ?? ""));
          } else if (tabName === "Transactions") {
            seedRows = INITIAL_TRANSACTIONS.map((t) => headers.map((h) => (t as any)[h] ?? ""));
          } else if (tabName === "Budgets") {
            seedRows = INITIAL_BUDGETS.map((b) => headers.map((h) => (b as any)[h] ?? ""));
          } else if (tabName === "Goals") {
            seedRows = INITIAL_GOALS.map((g) => headers.map((h) => (g as any)[h] ?? ""));
          } else if (tabName === "Recurring") {
            seedRows = INITIAL_RECURRING.map((r) => headers.map((h) => (r as any)[h] ?? ""));
          } else if (tabName === "Settlements") {
            seedRows = INITIAL_SETTLEMENTS.map((s) => headers.map((h) => (s as any)[h] ?? ""));
          }

          if (seedRows.length > 0) {
            await sheets.spreadsheets.values.append({
              spreadsheetId: sheetId,
              range: `'${tabName}'!A2`,
              valueInputOption: "USER_ENTERED",
              requestBody: { values: seedRows },
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to verify tab ${tabName}:`, err);
      }
    }
  })();

  return initPromise;
}

/**
 * Reads all rows from a given sheet tab and maps them to an array of objects.
 */
export async function getSheetRows<T>(tabName: keyof typeof TAB_HEADERS): Promise<T[]> {
  await ensureSpreadsheetInitialized();
  const sheetId = getSpreadsheetId();
  const sheets = getGoogleSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${tabName}'!A2:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) return [];

  const headers = TAB_HEADERS[tabName];
  return rows.map((row) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      let val = row[index] !== undefined ? row[index] : "";
      // Type parsing
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
  });
}

/**
 * Appends a record to a given sheet tab with formula injection sanitization.
 */
export async function appendSheetRow(tabName: keyof typeof TAB_HEADERS, record: Record<string, any>) {
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
}

/**
 * Updates a specific row by matching ID.
 */
export async function updateSheetRow(
  tabName: keyof typeof TAB_HEADERS,
  id: string,
  updatedFields: Record<string, any>
) {
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
      rowIndex = i + 1; // 1-based row index for Google Sheets
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Record with ID ${id} not found in sheet ${tabName}`);
  }

  const existingRow = rows[rowIndex - 1];
  const mergedRecord: any = {};
  headers.forEach((h, idx) => {
    mergedRecord[h] = existingRow[idx];
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

/**
 * Deletes a row matching ID.
 */
export async function deleteSheetRow(tabName: keyof typeof TAB_HEADERS, id: string) {
  await ensureSpreadsheetInitialized();
  const sheetId = getSpreadsheetId();
  const sheets = getGoogleSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const targetSheet = meta.data.sheets?.find((s) => s.properties?.title === tabName);
  const targetSheetId = targetSheet?.properties?.sheetId;

  if (targetSheetId === undefined) {
    throw new Error(`Sheet tab ${tabName} not found`);
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${tabName}'!A1:A`,
  });

  const rows = res.data.values || [];
  let rowIndex0 = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      rowIndex0 = i; // 0-based row index
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
}
