import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeHtml, stripFormulaTriggers } from "@/lib/sanitize";

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nickname, avatarUrl, themeAccent } = await req.json();

    const updates: Record<string, any> = {};
    if (typeof nickname === "string") {
      updates.nickname = stripFormulaTriggers(sanitizeHtml(nickname.trim()));
    }
    if (typeof avatarUrl === "string") {
      updates.avatarUrl = avatarUrl.trim();
    }
    if (typeof themeAccent === "string") {
      updates.themeAccent = themeAccent.trim();
    }

    const user = await db.getUserByPartner(session.partnerKey);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (db.isLiveGoogleSheets()) {
      const sheets = await import("@/lib/google/sheetsService");
      await sheets.updateSheetRow("Users", user.id, updates);
    }

    Object.assign(user, updates);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        name: user.nickname || user.name,
      },
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
