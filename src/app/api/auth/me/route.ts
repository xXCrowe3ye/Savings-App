import { NextResponse } from "next/server";
import { getCurrentSession, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      // Default to Partner A if not explicitly logged in to enable seamless first-run preview
      const defaultUser = await db.getUserByPartner("partner_a");
      return NextResponse.json({
        authenticated: false,
        user: defaultUser || null,
        guestPreview: true,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
      guestPreview: false,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
