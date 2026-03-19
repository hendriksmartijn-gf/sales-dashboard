import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "month"; // week | month | quarter | all

  const now = new Date();
  let startDate: Date | undefined;

  if (period === "week") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "quarter") {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1);
  }

  const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

  // Leads per status (funnel)
  const leadsByStatus = await db.lead.groupBy({
    by: ["status"],
    _count: { id: true },
    where: dateFilter,
  });

  // Leads per service
  const leadsByService = await db.lead.groupBy({
    by: ["service"],
    _count: { id: true },
    where: dateFilter,
  });

  // Per user stats
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      _count: {
        select: {
          leads: {
            where: dateFilter,
          },
        },
      },
    },
    orderBy: {
      leads: {
        _count: "desc",
      },
    },
  });

  // Won/Lost per service
  const wonByService = await db.lead.groupBy({
    by: ["service"],
    _count: { id: true },
    where: { ...dateFilter, status: "WON" },
  });

  return NextResponse.json({
    leadsByStatus,
    leadsByService,
    users,
    wonByService,
    period,
  });
}
