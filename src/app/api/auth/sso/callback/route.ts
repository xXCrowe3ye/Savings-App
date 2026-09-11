import { NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { PartnerKey } from "@/types";

// Whitelisted couple emails
const ALLOWED_EMAILS: Record<string, { partnerKey: PartnerKey; defaultName: string }> = {
  "hanzangelobernabe212@gmail.com": { partnerKey: "partner_a", defaultName: "Hanz Angelo" },
  "causon.julia@gmail.com": { partnerKey: "partner_b", defaultName: "Julia Causon" },
};

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?sso_error=${error || "missing_code"}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
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

    const email = profile.email.toLowerCase().trim();

    // Check custom environment whitelist or default couple whitelist
    const partnerAEmail = (process.env.PARTNER_A_EMAIL || "hanzangelobernabe212@gmail.com").toLowerCase().trim();
    const partnerBEmail = (process.env.PARTNER_B_EMAIL || "causon.julia@gmail.com").toLowerCase().trim();

    let partnerKey: PartnerKey | null = null;
    let fallbackName = profile.name || "Partner";

    if (email === partnerAEmail || email === "hanzangelobernabe212@gmail.com") {
      partnerKey = "partner_a";
      fallbackName = "Hanz Angelo";
    } else if (email === partnerBEmail || email === "causon.julia@gmail.com") {
      partnerKey = "partner_b";
      fallbackName = "Julia Causon";
    } else {
      // Access Denied: Not part of the couple whitelist!
      return NextResponse.redirect(
        `${origin}/?sso_error=unauthorized_email&unauthorized_email=${encodeURIComponent(email)}`
      );
    }

    const existingUser = await db.getUserByPartner(partnerKey);

    // 3. Issue signed JWT session token
    const sessionToken = await createSessionToken({
      userId: existingUser?.id || (partnerKey === "partner_a" ? "user_a" : "user_b"),
      partnerKey,
      name: existingUser?.nickname || existingUser?.name || fallbackName,
      email: profile.email,
      themeAccent: existingUser?.themeAccent || (partnerKey === "partner_a" ? "#6366f1" : "#0d9488"),
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
