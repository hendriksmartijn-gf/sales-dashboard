import { LeadStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
