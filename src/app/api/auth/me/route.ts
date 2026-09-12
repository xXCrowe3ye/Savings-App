import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const otherPartnerKey = session.partnerKey === "partner_a" ? "partner_b" : "partner_a";
    const [fullUser, otherUser] = await Promise.all([
      db.getUserByPartner(session.partnerKey),
      db.getUserByPartner(otherPartnerKey),
    ]);

    const isFirstTime = !fullUser?.nickname || fullUser?.nickname === "Partner A" || fullUser?.nickname === "Partner B";

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session,
        nickname: fullUser?.nickname || "",
        name: fullUser?.nickname || fullUser?.name || session.name,
        avatarUrl: fullUser?.avatarUrl || "",
        themeAccent: fullUser?.themeAccent || session.themeAccent,
      },
      partner: otherUser
        ? {
            id: otherUser.id,
            partnerKey: otherUser.partnerKey,
            name: otherUser.nickname || otherUser.name || (otherPartnerKey === "partner_a" ? "Partner A" : "Partner B"),
            nickname: otherUser.nickname || "",
            avatarUrl: otherUser.avatarUrl || "",
            themeAccent: otherUser.themeAccent || (otherPartnerKey === "partner_a" ? "#6366f1" : "#0d9488"),
          }
        : null,
      isFirstTime,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

