import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const fullUser = await db.getUserByPartner(session.partnerKey);

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session,
        nickname: fullUser?.nickname || session.name,
        name: fullUser?.nickname || fullUser?.name || session.name,
        avatarUrl: fullUser?.avatarUrl || "",
        themeAccent: fullUser?.themeAccent || session.themeAccent,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
