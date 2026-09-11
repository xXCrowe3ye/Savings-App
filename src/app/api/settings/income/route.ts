import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const income = await db.getSharedIncome();
    return NextResponse.json({ combinedTotalIncome: income });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { income } = await req.json();
    const num = Number(income);
    if (isNaN(num) || num < 0) {
      return NextResponse.json({ error: "Invalid income amount" }, { status: 400 });
    }

    await db.updateSharedIncome(num);
    return NextResponse.json({ success: true, combinedTotalIncome: num });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
