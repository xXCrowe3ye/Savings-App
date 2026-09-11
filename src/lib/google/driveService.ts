import { getGoogleDriveClient, isGoogleDriveConfigured } from "./client";
import { Readable } from "stream";

/**
 * Uploads a receipt image buffer to Google Drive.
 * Falls back gracefully to base64 preview URL if Google Drive credentials are absent.
 */
export async function uploadReceiptToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const base64Fallback = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

  if (!isGoogleDriveConfigured()) {
    return base64Fallback;
  }

  try {
    const drive = getGoogleDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID;

    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);

    const res = await drive.files.create({
      requestBody: {
        name: `receipt_${Date.now()}_${fileName}`,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: "id, webViewLink, webContentLink",
    });

    // Make file viewable with link
    if (res.data.id) {
      try {
        await drive.permissions.create({
          fileId: res.data.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      } catch {
        // Permission might be inherited from parent folder
      }
    }

    return (
      res.data.webViewLink ||
      res.data.webContentLink ||
      (res.data.id ? `https://drive.google.com/file/d/${res.data.id}/view` : base64Fallback)
    );
  } catch (err: any) {
    console.warn("Google Drive upload failed, falling back to base64 data URI:", err?.message || err);
    return base64Fallback;
  }
}
