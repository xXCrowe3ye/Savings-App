import { NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { PartnerKey } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { partnerKey, pin } = body as { partnerKey: PartnerKey; pin?: string };

    if (!partnerKey || !["partner_a", "partner_b"].includes(partnerKey)) {
      return NextResponse.json({ error: "Invalid partner selected" }, { status: 400 });
    }

    const user = await db.getUserByPartner(partnerKey);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Default pin "1234" for quick partner login in demo mode or check pin if provided
    if (pin && pin !== "1234" && pin !== "0000") {
      return NextResponse.json({ error: "Incorrect PIN code" }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      partnerKey: user.partnerKey,
      name: user.name,
      email: user.email,
      themeAccent: user.themeAccent,
      hasPin: true,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        partnerKey: user.partnerKey,
        name: user.name,
        email: user.email,
        themeAccent: user.themeAccent,
      },
    });

    // Set HttpOnly, Secure, SameSite=Strict cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
