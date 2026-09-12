import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { sanitizeHtml, stripFormulaTriggers } from "@/lib/sanitize";

const createSettlementSchema = z.object({
  fromPartner: z.enum(["partner_a", "partner_b"]),
  toPartner: z.enum(["partner_a", "partner_b"]),
  amount: z.number().positive(),
  date: z.string().min(1),
  note: z.string().optional(),
});

export async function GET() {
  try {
    const settlements = await db.getSettlements();
    return NextResponse.json({ settlements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    const body = await req.json();
    const parsed = createSettlementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;
    const sanitizedNote = data.note ? stripFormulaTriggers(sanitizeHtml(data.note)) : "";

    const newSettlement = await db.addSettlement({
      fromPartner: data.fromPartner,
      toPartner: data.toPartner,
      amount: data.amount,
      date: data.date,
      status: "settled",
      note: sanitizedNote,
    });

    // Also record a settlement transaction so it is visible in the activity timeline
    await db.addTransaction({
      type: "settlement",
      date: data.date,
      amount: data.amount,
      category: "Settlement",
      description: sanitizedNote || "IOU Settlement",
      paidBy: data.fromPartner,
      splitRatio: "0/100",
      needsApproval: false,
      approvedByPartner: true,
      notes: "Settled via Couple IOU & Split Tracker",
    });

    return NextResponse.json({ success: true, settlement: newSettlement });
  } catch (error: any) {
    console.error("Add settlement error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
