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

export function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Google Service Account credentials missing in environment variables.");
  }

  // Support escaped newlines in Vercel environment variables
  privateKey = privateKey.replace(/\\n/g, "\n");

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
