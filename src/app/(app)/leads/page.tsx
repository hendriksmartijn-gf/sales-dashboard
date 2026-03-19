import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS, SERVICE_LABELS } from "@/lib/constants";
import { LeadStatus, GoldfizjService, LeadSource } from "@prisma/client";
import Link from "next/link";
import { Plus, Brain, Star } from "lucide-react";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; service?: string; owner?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sp = await searchParams;

  const leads = await db.lead.findMany({
    where: {
      ...(sp.status ? { status: sp.status as LeadStatus } : {}),
      ...(sp.service ? { service: sp.service as GoldfizjService } : {}),
      ...(sp.owner === "me" ? { ownerId: session.user.id } : {}),
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-zinc-400 text-sm">{leads.length} leads gevonden</p>
        </div>
        <Link
          href="/leads/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#f5a623] text-black rounded-lg font-medium hover:bg-[#e07b00] transition-colors text-sm"
        >
          <Plus size={16} />
          Nieuwe lead
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterLink href="/leads" active={!sp.status && !sp.owner && !sp.service} label="Alle leads" />
        <FilterLink href="/leads?owner=me" active={sp.owner === "me"} label="Mijn leads" />
        {(["OUTREACH", "COFFEE", "PROPOSAL", "QUOTE", "WON", "LOST"] as LeadStatus[]).map((s) => (
          <FilterLink
            key={s}
            href={`/leads?status=${s}`}
            active={sp.status === s}
            label={STATUS_LABELS[s]}
          />
        ))}
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p>Geen leads gevonden</p>
          <Link href="/leads/new" className="text-[#f5a623] text-sm mt-2 inline-block">
            Voeg de eerste lead toe →
          </Link>
        </div>
      ) : (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">Naam</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">Bedrijf</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">Dienst</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">Eigenaar</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">AI Score</th>
                <th className="text-left px-4 py-3 text-zinc-400 text-xs font-medium uppercase tracking-wide">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="text-white font-medium hover:text-[#f5a623] transition-colors">
                      {lead.name}
                    </Link>
                    {lead.role && <p className="text-zinc-500 text-xs">{lead.role}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">{lead.company ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">
                    {SERVICE_LABELS[lead.service as GoldfizjService]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {lead.owner.image ? (
                        <img src={lead.owner.image} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-700" />
                      )}
                      <span className="text-zinc-300 text-sm">{lead.owner.name?.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {lead.aiScore != null ? (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-[#f5a623]" />
                        <span className="text-zinc-200 text-sm font-medium">{lead.aiScore}/10</span>
                      </div>
                    ) : lead.aiEnriched ? (
                      <span className="text-zinc-500 text-xs">—</span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Brain size={10} className="animate-pulse" />
                        Bezig...
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-sm">
                    {lead.createdAt.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30"
          : "text-zinc-400 hover:text-white border border-white/10 hover:border-white/20"
      }`}
    >
      {label}
    </Link>
  );
}
