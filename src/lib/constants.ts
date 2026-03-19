import { LeadStatus, LeadSource, GoldfizjService } from "@prisma/client";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  OUTREACH: "Outreach",
  COFFEE: "Koffie",
  PROPOSAL: "Voorstel",
  QUOTE: "Offerte",
  WON: "Gewonnen",
  LOST: "Verloren",
};

export const STATUS_ORDER: LeadStatus[] = [
  "OUTREACH",
  "COFFEE",
  "PROPOSAL",
  "QUOTE",
  "WON",
  "LOST",
];

export const STATUS_COLORS: Record<LeadStatus, string> = {
  OUTREACH: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  COFFEE: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  PROPOSAL: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  QUOTE: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  WON: "bg-green-500/20 text-green-300 border-green-500/30",
  LOST: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  LINKEDIN: "LinkedIn",
  EVENT: "Evenement",
  REFERRAL: "Verwijzing",
  COLD_EMAIL: "Cold email",
  WEBSITE: "Website",
  OTHER: "Anders",
};

export const SERVICE_LABELS: Record<GoldfizjService, string> = {
  AI_STRATEGY: "AI Strategie",
  CHANGE_MANAGEMENT: "Change Management",
  DIGITAL_TRANSFORMATION: "Digitale Transformatie",
  ORGANIZATIONAL_DESIGN: "Organisatieontwerp",
  LEADERSHIP_DEVELOPMENT: "Leiderschapsontwikkeling",
  OTHER: "Anders",
};
