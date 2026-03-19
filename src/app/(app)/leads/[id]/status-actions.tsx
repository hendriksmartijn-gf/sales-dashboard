"use client";

import { useRouter } from "next/navigation";
import { LeadStatus } from "@prisma/client";
import { CheckCircle, XCircle } from "lucide-react";

interface StatusActionsProps {
  leadId: string;
  status: LeadStatus;
  isActive: boolean;
  isPast: boolean;
  label: string;
  variant?: "default" | "won" | "lost";
}

export function StatusActions({
  leadId,
  status,
  isActive,
  isPast,
  label,
  variant = "default",
}: StatusActionsProps) {
  const router = useRouter();

  async function handleClick() {
    if (isActive) return;

    await fetch(`/api/leads/${leadId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    router.refresh();
  }

  if (variant === "won") {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors"
      >
        <CheckCircle size={12} />
        {label}
      </button>
    );
  }

  if (variant === "lost") {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
      >
        <XCircle size={12} />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isActive}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
        isActive
          ? "bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/40 cursor-default"
          : isPast
          ? "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white"
          : "bg-white/5 text-zinc-500 border border-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
