import { NextResponse } from "next/server";
import { uploadReceiptToDrive } from "@/lib/google/driveService";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Limit file size to 8MB
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 8MB limit" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const receiptUrl = await uploadReceiptToDrive(buffer, file.name, file.type || "image/jpeg");

    return NextResponse.json({ success: true, receiptUrl });
  } catch (error: any) {
    console.error("Receipt upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload receipt" }, { status: 500 });
  }
}
