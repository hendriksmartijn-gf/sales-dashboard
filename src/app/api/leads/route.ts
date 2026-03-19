import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { enrichLead } from "@/lib/ai-agent";
import { LeadSource, GoldfizjService } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId");
  const status = searchParams.get("status");
  const service = searchParams.get("service");

  const leads = await db.lead.findMany({
    where: {
      ...(ownerId ? { ownerId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(service ? { service: service as never } : {}),
    },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { activities: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    name: string;
    linkedinUrl?: string;
    company?: string;
    role?: string;
    source?: LeadSource;
    service?: GoldfizjService;
    notes?: string;
  };

  const lead = await db.lead.create({
    data: {
      name: body.name,
      linkedinUrl: body.linkedinUrl,
      company: body.company,
      role: body.role,
      source: body.source ?? "LINKEDIN",
      service: body.service ?? "AI_STRATEGY",
      notes: body.notes,
      ownerId: session.user.id,
    },
  });

  // Log initial activity
  await db.activity.create({
    data: {
      type: "status_change",
      toStatus: "OUTREACH",
      note: "Lead aangemaakt",
      leadId: lead.id,
      userId: session.user.id,
    },
  });

  // Trigger AI enrichment in background (fire and forget)
  enrichLead({
    name: lead.name,
    linkedinUrl: lead.linkedinUrl,
    company: lead.company,
    role: lead.role,
  })
    .then(async (result) => {
      await db.lead.update({
        where: { id: lead.id },
        data: {
          aiSummary: result.summary,
          aiScore: result.score,
          aiEnriched: true,
        },
      });
    })
    .catch((error: unknown) => {
      console.error("AI enrichment failed for lead", lead.id, error);
    });

  return NextResponse.json(lead, { status: 201 });
}
