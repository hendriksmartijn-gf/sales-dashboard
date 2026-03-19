import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS, SERVICE_LABELS, STATUS_ORDER } from "@/lib/constants";
import { LeadStatus, GoldfizjService, LeadSource } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, Brain, Star, ExternalLink } from "lucide-react";
import { StatusActions } from "./status-actions";
import { NoteForm } from "./note-form";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      activities: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) notFound();

  const currentStatusIndex = STATUS_ORDER.indexOf(lead.status);
  const pipelineStatuses = STATUS_ORDER.filter((s) => !["WON", "LOST"].includes(s));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/leads"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft size={14} />
          Terug naar leads
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[lead.status]}`}>
                {STATUS_LABELS[lead.status]}
              </span>
            </div>
            {lead.role && lead.company && (
              <p className="text-zinc-400 text-sm">{lead.role} bij {lead.company}</p>
            )}
          </div>
          {lead.linkedinUrl && (
            <a
              href={lead.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
            >
              <ExternalLink size={14} />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* Pipeline */}
      {!["WON", "LOST"].includes(lead.status) && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            {pipelineStatuses.map((status, i) => {
              const statusIndex = STATUS_ORDER.indexOf(status);
              const isActive = status === lead.status;
              const isPast = statusIndex < currentStatusIndex;

              return (
                <div key={status} className="flex items-center gap-2 flex-1">
                  <StatusActions
                    leadId={lead.id}
                    status={status}
                    isActive={isActive}
                    isPast={isPast}
                    label={STATUS_LABELS[status]}
                  />
                  {i < pipelineStatuses.length - 1 && (
                    <div className={`h-px flex-1 ${isPast || isActive ? "bg-[#f5a623]/40" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mt-3 justify-end">
            <StatusActions
              leadId={lead.id}
              status="WON"
              isActive={false}
              isPast={false}
              label="Gewonnen"
              variant="won"
            />
            <StatusActions
              leadId={lead.id}
              status="LOST"
              isActive={false}
              isPast={false}
              label="Verloren"
              variant="lost"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main info */}
        <div className="col-span-2 space-y-6">
          {/* AI Summary */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Brain size={16} className="text-[#f5a623]" />
                AI Analyse
              </h2>
              {lead.aiScore != null && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-full">
                  <Star size={12} className="text-[#f5a623]" />
                  <span className="text-[#f5a623] font-semibold text-sm">{lead.aiScore}/10</span>
                </div>
              )}
            </div>

            {lead.aiSummary ? (
              <p className="text-zinc-300 text-sm leading-relaxed">{lead.aiSummary}</p>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Brain size={14} className="animate-pulse text-[#f5a623]" />
                AI is de lead aan het verrijken...
              </div>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Notitie</h2>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Add note */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Notitie toevoegen</h2>
            <NoteForm leadId={lead.id} />
          </div>

          {/* Activity */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Activiteitslog</h2>
            <div className="space-y-4">
              {lead.activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {activity.user.image ? (
                      <img src={activity.user.image} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{activity.user.name?.split(" ")[0]}</span>
                      <span className="text-zinc-500 text-xs">
                        {activity.createdAt.toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {activity.type === "status_change" && activity.toStatus && (
                      <p className="text-zinc-400 text-sm mt-0.5">
                        {activity.fromStatus ? (
                          <>
                            Status gewijzigd:{" "}
                            <span className="text-zinc-300">{STATUS_LABELS[activity.fromStatus]}</span>
                            {" → "}
                            <span className="text-[#f5a623]">{STATUS_LABELS[activity.toStatus]}</span>
                          </>
                        ) : (
                          <>Lead aangemaakt in <span className="text-[#f5a623]">{STATUS_LABELS[activity.toStatus]}</span></>
                        )}
                      </p>
                    )}
                    {activity.note && (
                      <p className="text-zinc-300 text-sm mt-0.5 bg-white/5 rounded-lg px-3 py-2">
                        {activity.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {lead.activities.length === 0 && (
                <p className="text-zinc-500 text-sm">Nog geen activiteit</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-5">
            <h3 className="text-zinc-400 text-xs uppercase tracking-wide mb-4">Details</h3>
            <dl className="space-y-3">
              <Detail label="Bron" value={SOURCE_LABELS[lead.source as LeadSource]} />
              <Detail label="Dienst" value={SERVICE_LABELS[lead.service as GoldfizjService]} />
              <Detail label="Eigenaar" value={lead.owner.name ?? lead.owner.email ?? "—"} />
              <Detail
                label="Aangemaakt"
                value={lead.createdAt.toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              {lead.convertedAt && (
                <Detail
                  label="Gesloten op"
                  value={lead.convertedAt.toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500 text-xs">{label}</dt>
      <dd className="text-zinc-200 text-sm mt-0.5">{value}</dd>
    </div>
  );
}
