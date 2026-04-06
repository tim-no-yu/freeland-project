import type {
  ReportCardStatus,
  ReportCardType,
  PlanetaryCategory,
  StarLevel,
} from "@/lib/types";

// ─── Status ──────────────────────────────────────────────────────
export const STATUS_LABELS: Record<ReportCardStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  awaiting_info: "Awaiting Info",
  approved: "Approved",
  rejected: "Rejected",
  issued: "Issued",
};

export const STATUS_COLORS: Record<ReportCardStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  awaiting_info: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  issued: "bg-purple-100 text-purple-700",
};

export const ALL_STATUSES: ReportCardStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "awaiting_info",
  "approved",
  "rejected",
  "issued",
];

// ─── Report Card Type ────────────────────────────────────────────
export const TYPE_LABELS: Record<ReportCardType, string> = {
  action: "Action (Silver)",
  impact: "Impact (Gold)",
};

// ─── Planetary Health Categories ─────────────────────────────────
export const CATEGORY_LABELS: Record<PlanetaryCategory, string> = {
  wildlife_protection: "Wildlife Protection",
  habitat_protection: "Habitat Protection",
  regenerative_agriculture: "Regenerative Agriculture",
};

export const CATEGORY_OPTIONS: { value: PlanetaryCategory; label: string }[] = [
  { value: "wildlife_protection", label: "Wildlife Protection" },
  { value: "habitat_protection", label: "Habitat Protection" },
  { value: "regenerative_agriculture", label: "Regenerative Agriculture" },
];

// ─── Star Levels ─────────────────────────────────────────────────
export const STAR_LEVEL_LABELS: Record<StarLevel, string> = {
  copper: "Copper",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export const STAR_LEVEL_COLORS: Record<StarLevel, string> = {
  copper: "bg-amber-700 text-white",
  silver: "bg-gray-400 text-white",
  gold: "bg-yellow-400 text-yellow-900",
  platinum: "bg-indigo-200 text-indigo-900",
};

// ─── Rubric ──────────────────────────────────────────────────────
export const RUBRIC_FIELDS = [
  { key: "evidence_quality", label: "Evidence Quality", max: 5 },
  { key: "impact_clarity", label: "Impact Clarity", max: 5 },
  { key: "completeness", label: "Completeness", max: 5 },
] as const;

export const MAX_TOTAL_SCORE = RUBRIC_FIELDS.reduce((s, f) => s + f.max, 0);
