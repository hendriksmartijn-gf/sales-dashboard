import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABELS, SERVICE_LABELS } from "@/lib/constants";
import { LeadStatus, GoldfizjService } from "@prisma/client";
import Link from "next/link";

const STATUS_ORDER: LeadStatus[] = ["OUTREACH", "COFFEE", "PROPOSAL", "QUOTE", "WON", "LOST"];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    myWeekLeads,
    myMonthLeads,
    teamLeads,
    funnelData,
    serviceData,
    users,
  ] = await Promise.all([
    db.lead.count({ where: { ownerId: session.user.id, createdAt: { gte: startOfWeek } } }),
    db.lead.count({ where: { ownerId: session.user.id, createdAt: { gte: startOfMonth } } }),
    db.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.lead.groupBy({ by: ["status"], _count: { id: true } }),
    db.lead.groupBy({ by: ["service"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    db.user.findMany({
      select: {
        id: true, name: true, email: true, image: true,
        _count: { select: { leads: { where: { createdAt: { gte: startOfMonth } } } } },
      },
      orderBy: { leads: { _count: "desc" } },
      take: 8,
    }),
  ]);

  const funnelMap = Object.fromEntries(funnelData.map((d) => [d.status, d._count.id]));
  const serviceMap = Object.fromEntries(serviceData.map((d) => [d.service, d._count.id]));
  const totalLeads = funnelData.reduce((sum, d) => sum + d._count.id, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Goedemiddag, {session.user.name?.split(" ")[0]}
        </p>
      </div>

      {/* Personal stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Jouw outreaches deze week</p>
          <p className="text-3xl font-bold text-white">{myWeekLeads}</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Jouw outreaches deze maand</p>
          <p className="text-3xl font-bold text-white">{myMonthLeads}</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Team outreaches deze maand</p>
          <p className="text-3xl font-bold text-[#f5a623]">{teamLeads}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Funnel */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Salesfunnel</h2>
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const count = funnelMap[status] ?? 0;
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{STATUS_LABELS[status]}</span>
                    <span className="text-zinc-400">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div
                      className="h-1.5 bg-[#f5a623] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per dienst */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Leads per dienst</h2>
          <div className="space-y-3">
            {serviceData.slice(0, 6).map((d) => (
              <div key={d.service} className="flex justify-between items-center">
                <span className="text-zinc-300 text-sm">
                  {SERVICE_LABELS[d.service as GoldfizjService]}
                </span>
                <span className="text-[#f5a623] font-semibold text-sm">{d._count.id}</span>
              </div>
            ))}
            {serviceData.length === 0 && (
              <p className="text-zinc-500 text-sm">Nog geen leads aangemaakt</p>
            )}
          </div>
        </div>
      </div>

      {/* Team leaderboard */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Team — outreaches deze maand</h2>
        <div className="space-y-3">
          {users.map((user, i) => (
            <div key={user.id} className="flex items-center gap-3">
              <span className="text-zinc-600 text-sm w-5 text-right">{i + 1}</span>
              {user.image ? (
                <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-xs text-zinc-400">{user.name?.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {user.name}
                  {user.id === session.user?.id && (
                    <span className="ml-2 text-[#f5a623] text-xs">jij</span>
                  )}
                </p>
              </div>
              <span className="text-zinc-300 font-semibold">{user._count.leads}</span>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-zinc-500 text-sm">Nog geen activiteit deze maand</p>
          )}
        </div>
        <Link
          href="/stats"
          className="mt-4 block text-center text-xs text-zinc-500 hover:text-[#f5a623] transition-colors"
        >
          Volledig overzicht →
        </Link>
      </div>
    </div>
  );
}
