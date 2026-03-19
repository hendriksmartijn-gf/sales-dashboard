import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABELS, SERVICE_LABELS } from "@/lib/constants";
import { LeadStatus, GoldfizjService } from "@prisma/client";
import Link from "next/link";

const STATUS_ORDER: LeadStatus[] = ["OUTREACH", "COFFEE", "PROPOSAL", "QUOTE", "WON", "LOST"];

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sp = await searchParams;
  const period = sp.period ?? "month";

  const now = new Date();
  let startDate: Date | undefined;

  if (period === "week") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), q * 3, 1);
  }

  const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

  const [leadsByStatus, leadsByService, wonByService, users, totalWon] =
    await Promise.all([
      db.lead.groupBy({ by: ["status"], _count: { id: true }, where: dateFilter }),
      db.lead.groupBy({
        by: ["service"],
        _count: { id: true },
        where: dateFilter,
        orderBy: { _count: { id: "desc" } },
      }),
      db.lead.groupBy({
        by: ["service"],
        _count: { id: true },
        where: { ...dateFilter, status: "WON" },
      }),
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          leads: {
            where: dateFilter,
            select: { status: true },
          },
        },
        orderBy: { leads: { _count: "desc" } },
      }),
      db.lead.count({ where: { ...dateFilter, status: "WON" } }),
    ]);

  const statusMap = Object.fromEntries(leadsByStatus.map((d) => [d.status, d._count.id]));
  const wonServiceMap = Object.fromEntries(wonByService.map((d) => [d.service, d._count.id]));
  const totalLeads = leadsByStatus.reduce((sum, d) => sum + d._count.id, 0);

  const periods = [
    { value: "week", label: "Afgelopen week" },
    { value: "month", label: "Deze maand" },
    { value: "quarter", label: "Dit kwartaal" },
    { value: "all", label: "Alles" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistieken</h1>
          <p className="text-zinc-400 text-sm">Overzicht van salesactiviteit</p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <Link
              key={p.value}
              href={`/stats?period=${p.value}`}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                period === p.value
                  ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30"
                  : "text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="Totaal leads" value={totalLeads} />
        <MetricCard label="Gewonnen" value={totalWon} accent />
        <MetricCard
          label="Conversie"
          value={totalLeads > 0 ? `${Math.round((totalWon / totalLeads) * 100)}%` : "0%"}
        />
        <MetricCard
          label="In pipeline"
          value={
            (statusMap["OUTREACH"] ?? 0) +
            (statusMap["COFFEE"] ?? 0) +
            (statusMap["PROPOSAL"] ?? 0) +
            (statusMap["QUOTE"] ?? 0)
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Funnel */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Salesfunnel</h2>
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const count = statusMap[status] ?? 0;
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{STATUS_LABELS[status]}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 text-xs">{pct.toFixed(0)}%</span>
                      <span className="text-zinc-200 font-medium w-6 text-right">{count}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        status === "WON"
                          ? "bg-green-500"
                          : status === "LOST"
                          ? "bg-red-500"
                          : "bg-[#f5a623]"
                      }`}
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
            {leadsByService.map((d) => {
              const won = wonServiceMap[d.service] ?? 0;
              const convRate = d._count.id > 0 ? Math.round((won / d._count.id) * 100) : 0;
              return (
                <div key={d.service} className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-200 text-sm">
                      {SERVICE_LABELS[d.service as GoldfizjService]}
                    </p>
                    <p className="text-zinc-500 text-xs">{won} gewonnen — {convRate}% conversie</p>
                  </div>
                  <span className="text-[#f5a623] font-bold">{d._count.id}</span>
                </div>
              );
            })}
            {leadsByService.length === 0 && (
              <p className="text-zinc-500 text-sm">Geen data voor deze periode</p>
            )}
          </div>
        </div>
      </div>

      {/* Per medewerker */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Per medewerker</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left pb-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">Naam</th>
              {STATUS_ORDER.map((s) => (
                <th key={s} className="text-right pb-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">
                  {STATUS_LABELS[s]}
                </th>
              ))}
              <th className="text-right pb-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">Totaal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => {
              const counts = Object.fromEntries(
                STATUS_ORDER.map((s) => [s, user.leads.filter((l) => l.status === s).length])
              );
              const total = user.leads.length;
              return (
                <tr key={user.id}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-700" />
                      )}
                      <div>
                        <p className="text-white text-sm">{user.name}</p>
                        <p className="text-zinc-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  {STATUS_ORDER.map((s) => (
                    <td key={s} className="py-3 text-right">
                      <span className={`text-sm ${counts[s] > 0 ? "text-zinc-200" : "text-zinc-600"}`}>
                        {counts[s]}
                      </span>
                    </td>
                  ))}
                  <td className="py-3 text-right">
                    <span className="text-[#f5a623] font-semibold">{total}</span>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-zinc-500 text-sm">
                  Geen data voor deze periode
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5">
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-[#f5a623]" : "text-white"}`}>{value}</p>
    </div>
  );
}
