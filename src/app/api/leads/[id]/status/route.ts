import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, note } = await req.json() as { status: LeadStatus; note?: string };

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead niet gevonden" }, { status: 404 });
  }

  const [updatedLead] = await db.$transaction([
    db.lead.update({
      where: { id },
      data: {
        status,
        ...(["WON", "LOST"].includes(status) ? { convertedAt: new Date() } : {}),
      },
    }),
    db.activity.create({
      data: {
        type: "status_change",
        fromStatus: lead.status,
        toStatus: status,
        note: note ?? null,
        leadId: id,
        userId: session.user.id,
      },
    }),
  ]);

  return NextResponse.json(updatedLead);
}
