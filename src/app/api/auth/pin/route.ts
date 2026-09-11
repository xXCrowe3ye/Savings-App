import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const session = await getCurrentSession();

    // Default valid test PINs: "1234", "0000"
    if (pin === "1234" || pin === "0000") {
      return NextResponse.json({ success: true, unlocked: true });
    }

    return NextResponse.json({ error: "Invalid PIN code" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "PIN verification failed" }, { status: 500 });
  }
}
