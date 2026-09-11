import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Direct credential login is disabled. Please authenticate via Google SSO." },
    { status: 403 }
  );
}

