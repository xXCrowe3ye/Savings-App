import { NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { PartnerKey } from "@/types";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?sso_error=${error || "missing_code"}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/sso/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?sso_error=missing_credentials`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("SSO token exchange failed:", tokenData);
      return NextResponse.redirect(`${origin}/?sso_error=token_exchange_failed`);
    }

    // 2. Fetch authenticated user profile from Google
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userinfoRes.json();
    if (!userinfoRes.ok || !profile.email) {
      return NextResponse.redirect(`${origin}/?sso_error=failed_to_fetch_profile`);
    }

    const email = profile.email.toLowerCase();
    const partnerAEmail = (process.env.PARTNER_A_EMAIL || "alex@duonest.local").toLowerCase();
    const partnerBEmail = (process.env.PARTNER_B_EMAIL || "sam@duonest.local").toLowerCase();

    // 3. Couple Access Control: Determine if Partner A or Partner B
    let partnerKey: PartnerKey = "partner_a";
    if (email === partnerBEmail) {
      partnerKey = "partner_b";
    } else if (email !== partnerAEmail) {
      // If neither matches explicitly, check if environment allows first-run registration or block
      if (process.env.NODE_ENV === "production" && process.env.PARTNER_A_EMAIL && process.env.PARTNER_B_EMAIL) {
        return NextResponse.redirect(`${origin}/?sso_error=unauthorized_couple_email`);
      }
      // In dev or unconstrained mode, map first user as partner_a
      partnerKey = "partner_a";
    }

    const existingUser = await db.getUserByPartner(partnerKey);

    // 4. Create session token
    const sessionToken = await createSessionToken({
      userId: existingUser?.id || (partnerKey === "partner_a" ? "user_a" : "user_b"),
      partnerKey,
      name: profile.name || (partnerKey === "partner_a" ? "Alex Vance" : "Sam Miller"),
      email: profile.email,
      themeAccent: partnerKey === "partner_a" ? "#6366f1" : "#0d9488",
      hasPin: true,
    });

    const response = NextResponse.redirect(`${origin}/?sso_success=true`);
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("SSO Callback Error:", err);
    return NextResponse.redirect(`${origin}/?sso_error=internal_error`);
  }
}
