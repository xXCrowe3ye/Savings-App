import { google } from "googleapis";

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_SHEET_ID
  );
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    isGoogleSheetsConfigured() &&
    process.env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID
  );
}

/**
 * Normalizes Google Private Key by removing surrounding quotes and unescaping \n
 */
export function normalizePrivateKey(rawKey: string): string {
  if (!rawKey) return "";
  let key = rawKey.trim();

  // Strip leading and trailing double or single quotes if wrapped in quotes on Vercel
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Replace literal '\n' string with actual line breaks
  key = key.replace(/\\n/g, "\n");

  // Ensure header and footer are clean
  return key.trim();
}

export function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !rawKey) {
    throw new Error("Google Service Account credentials missing in environment variables.");
  }

  const privateKey = normalizePrivateKey(rawKey);

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
}

export function getGoogleSheetsClient() {
  const auth = getGoogleAuth();
  return google.sheets({ version: "v4", auth });
}

export function getGoogleDriveClient() {
  const auth = getGoogleAuth();
  return google.drive({ version: "v3", auth });
}
