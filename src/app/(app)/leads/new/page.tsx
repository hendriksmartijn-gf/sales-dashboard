"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, ArrowLeft } from "lucide-react";
import Link from "next/link";

const SOURCES = [
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "EVENT", label: "Evenement" },
  { value: "REFERRAL", label: "Verwijzing" },
  { value: "COLD_EMAIL", label: "Cold email" },
  { value: "WEBSITE", label: "Website" },
  { value: "OTHER", label: "Anders" },
];

const SERVICES = [
  { value: "AI_STRATEGY", label: "AI Strategie" },
  { value: "CHANGE_MANAGEMENT", label: "Change Management" },
  { value: "DIGITAL_TRANSFORMATION", label: "Digitale Transformatie" },
  { value: "ORGANIZATIONAL_DESIGN", label: "Organisatieontwerp" },
  { value: "LEADERSHIP_DEVELOPMENT", label: "Leiderschapsontwikkeling" },
  { value: "OTHER", label: "Anders" },
];

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      linkedinUrl: formData.get("linkedinUrl") as string || undefined,
      company: formData.get("company") as string || undefined,
      role: formData.get("role") as string || undefined,
      source: formData.get("source") as string,
      service: formData.get("service") as string,
      notes: formData.get("notes") as string || undefined,
    };

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const lead = await res.json() as { id: string };
      setSubmitted(true);
      setTimeout(() => router.push(`/leads/${lead.id}`), 1500);
    } else {
      setLoading(false);
      alert("Er is iets misgegaan. Probeer opnieuw.");
    }
  }

  if (submitted) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 flex items-center justify-center mx-auto mb-4">
            <Brain size={32} className="text-[#f5a623] animate-pulse" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Lead opgeslagen!</h2>
          <p className="text-zinc-400 text-sm">AI is je lead aan het verrijken...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/leads"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft size={14} />
          Terug naar leads
        </Link>
        <h1 className="text-2xl font-bold text-white">Nieuwe lead toevoegen</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Na het opslaan verrijkt de AI automatisch de lead met extra informatie.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium text-sm uppercase tracking-wide">Contactinformatie</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1.5">
                Naam <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#f5a623]/50 focus:ring-1 focus:ring-[#f5a623]/20"
                placeholder="Jan de Vries"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1.5">Functietitel</label>
              <input
                name="role"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#f5a623]/50 focus:ring-1 focus:ring-[#f5a623]/20"
                placeholder="CTO"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Bedrijf</label>
            <input
              name="company"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#f5a623]/50 focus:ring-1 focus:ring-[#f5a623]/20"
              placeholder="Acme BV"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">LinkedIn URL</label>
            <input
              name="linkedinUrl"
              type="url"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#f5a623]/50 focus:ring-1 focus:ring-[#f5a623]/20"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium text-sm uppercase tracking-wide">Salesinformatie</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1.5">Bron</label>
              <select
                name="source"
                defaultValue="LINKEDIN"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f5a623]/50 focus:ring-1 focus:ring-[#f5a623]/20"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#111]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1.5">Dienst</label>
              <select
                name="service"
                defaultValue="AI_STRATEGY"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f5a623]/50 focus:ring-1 focus:ring-[#f5a623]/20"
              >
                {SERVICES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#111]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Notitie</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#f5a623]/50 focus:ring-1 focus:ring-[#f5a623]/20 resize-none"
              placeholder="Context, aanleiding, eerste indruk..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/leads"
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#f5a623] text-black rounded-lg font-medium hover:bg-[#e07b00] transition-colors text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Brain size={14} className="animate-pulse" />
                Opslaan...
              </>
            ) : (
              "Lead opslaan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
