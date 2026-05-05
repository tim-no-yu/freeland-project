"use client";

import Link from "next/link";
import {
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Hourglass,
  Award,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/constants";
import { forecastStars } from "@/lib/utils/star-forecast";
import type { ReportCardListItem, StarLevel } from "@/lib/types";

/**
 * Archive verifier table — 3 tier-level status pills per row matching the
 * "Pending Verification" screenshot. Derives Level 1 (Bronze/Collaboration),
 * Level 2 (Silver/Action), Level 3 (Gold/Impact) state from the report
 * card's status + forecast tier.
 */

interface ArchiveVerifierTableProps {
  data: ReportCardListItem[];
  isLoading?: boolean;
}

type TierState =
  | { kind: "approved" }
  | { kind: "approve_or_flag" }
  | { kind: "data_discrepancy" }
  | { kind: "awaiting_data" };

function deriveTierStates(rc: ReportCardListItem): {
  l1: TierState;
  l2: TierState;
  l3: TierState;
} {
  const tier: StarLevel = rc.star_level ?? forecastStars(rc).level;

  // Level 1: collaboration/bronze — almost always satisfied once submitted
  const l1: TierState = { kind: "approved" };

  // Level 2: action/silver
  let l2: TierState;
  if (rc.status === "approved" || tier === "gold" || tier === "platinum") {
    l2 = { kind: "approved" };
  } else if (rc.status === "rejected" || rc.status === "awaiting_info") {
    l2 = { kind: "data_discrepancy" };
  } else {
    l2 = { kind: "approve_or_flag" };
  }

  // Level 3: impact/gold
  let l3: TierState;
  if (tier === "gold" || tier === "platinum" || rc.status === "issued") {
    l3 = { kind: "approved" };
  } else if (rc.type === "action") {
    l3 = { kind: "awaiting_data" };
  } else {
    l3 = { kind: "approve_or_flag" };
  }

  return { l1, l2, l3 };
}

const TIER_LABEL = {
  1: "Level 1: Collaboration (Bronze)",
  2: "Level 2: Action (Silver)",
  3: "Level 3: Impact (Gold)",
} as const;

function TIER_ICON({
  level,
  active,
}: {
  level: 1 | 2 | 3;
  active: boolean;
}) {
  return (
    <Award
      className={
        "h-3.5 w-3.5 " +
        (level === 1
          ? active
            ? "text-[#c08a52]"
            : "text-[#bcb39d]"
          : level === 2
            ? active
              ? "text-[#8a8a8a]"
              : "text-[#bcb39d]"
            : active
              ? "text-[#c08512]"
              : "text-[#bcb39d]")
      }
    />
  );
}

function tierPalette(level: 1 | 2 | 3, state: TierState) {
  const isActive = state.kind === "approved" || state.kind === "approve_or_flag";

  if (state.kind === "data_discrepancy") {
    return {
      bg: "bg-[#fde7e3]",
      text: "text-[#9a3a2c]",
      border: "border-[#f3c4ba]",
    };
  }

  if (level === 1)
    return {
      bg: isActive ? "bg-[#fbe9d4]" : "bg-[#f4eedf]",
      text: isActive ? "text-[#8a5a25]" : "text-[#bcb39d]",
      border: isActive ? "border-[#f0d8b3]" : "border-[#e6ddc4]",
    };
  if (level === 2)
    return {
      bg: isActive ? "bg-[#f0e7ce]" : "bg-[#f4eedf]",
      text: isActive ? "text-[#5a5448]" : "text-[#bcb39d]",
      border: isActive ? "border-[#dfd4b5]" : "border-[#e6ddc4]",
    };
  return {
    bg: isActive ? "bg-[#fdf3d4]" : "bg-[#f4eedf]",
    text: isActive ? "text-[#7a5a10]" : "text-[#bcb39d]",
    border: isActive ? "border-[#f0e1a3]" : "border-[#e6ddc4]",
  };
}

function TierPill({
  level,
  state,
}: {
  level: 1 | 2 | 3;
  state: TierState;
}) {
  const palette = tierPalette(level, state);
  const isActive = state.kind === "approved" || state.kind === "approve_or_flag";
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-full border px-3 py-1.5 ${palette.bg} ${palette.border}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <TIER_ICON level={level} active={isActive} />
        <span className={`truncate text-xs font-semibold ${palette.text}`}>
          {state.kind === "data_discrepancy"
            ? `${TIER_LABEL[level]} - Data Discrepancy`
            : TIER_LABEL[level]}
        </span>
      </div>

      {state.kind === "approved" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#dfe9d4] px-2 py-0.5 text-[10px] font-semibold text-[#1f3a1f]">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </span>
      )}
      {state.kind === "approve_or_flag" && (
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dfe9d4] px-2 py-0.5 text-[10px] font-semibold text-[#1f3a1f]">
            <CheckCircle2 className="h-3 w-3" />
            Approve
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fde7e3] px-2 py-0.5 text-[10px] font-semibold text-[#9a3a2c]">
            <AlertTriangle className="h-3 w-3" />
            Flag Audit
          </span>
        </div>
      )}
      {state.kind === "data_discrepancy" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#9a3a2c] px-2 py-0.5 text-[10px] font-semibold text-white">
          <Flag className="h-3 w-3" />
          Flag Audit
        </span>
      )}
      {state.kind === "awaiting_data" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f4eedf] px-2 py-0.5 text-[10px] font-semibold text-[#bcb39d]">
          <Hourglass className="h-3 w-3" />
          Awaiting Data
        </span>
      )}
    </div>
  );
}

const PARAMETER_TAGS_BY_CATEGORY: Record<string, string[]> = {
  wildlife_protection: ["WILDLIFE", "HABITAT"],
  habitat_protection: ["HABITAT", "URBAN"],
  regenerative_agriculture: ["AGRI", "SOIL"],
};

export function ArchiveVerifierTable({
  data,
  isLoading,
}: ArchiveVerifierTableProps) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#e6ddc4] px-6 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1f3a1f]">
          Pending Verification
        </h2>
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e6ddc4] bg-white text-[#6b6353] hover:text-[#1f3a1f]">
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e6ddc4] bg-white text-[#6b6353] hover:text-[#1f3a1f]">
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 px-6 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
        <div className="col-span-3">Project / Date</div>
        <div className="col-span-3">Reporter & Parameters</div>
        <div className="col-span-6">Verification Status (White Paper Tiers)</div>
      </div>

      {isLoading && (
        <div className="px-6 py-8 text-center text-sm text-[#8a8170]">
          Loading…
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className="px-6 py-12 text-center text-sm text-[#6b6353]">
          All caught up! No submissions awaiting review.
        </div>
      )}

      <ul className="divide-y divide-[#f0e7ce]">
        {data.map((rc) => {
          const tiers = deriveTierStates(rc);
          const tags =
            PARAMETER_TAGS_BY_CATEGORY[rc.category] || [
              CATEGORY_LABELS[rc.category]
                .split(" ")[0]
                .toUpperCase(),
            ];
          const initials = rc.reporter.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("");

          return (
            <li
              key={rc.id}
              className="grid grid-cols-12 items-center gap-4 px-6 py-5"
            >
              {/* Project + date */}
              <Link
                href={`/verifier/${rc.id}`}
                className="col-span-3 group min-w-0"
              >
                <p className="font-serif text-base font-bold text-[#1f3a1f] group-hover:underline">
                  {rc.title}
                </p>
                <p className="mt-1 text-xs text-[#8a8170]">
                  {new Date(rc.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </Link>

              {/* Reporter + tag chips */}
              <div className="col-span-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f3a1f] text-[10px] font-semibold text-[#f4eedf]">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f3a1f]">
                    {rc.reporter.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tags.map((t, i) => (
                      <span
                        key={t}
                        className={
                          "inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider " +
                          (i === 0
                            ? "bg-[#dfe9d4] text-[#1f3a1f]"
                            : "bg-[#f0e7ce] text-[#5a5448]")
                        }
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3 tier pills */}
              <div className="col-span-6 space-y-2">
                <TierPill level={1} state={tiers.l1} />
                <TierPill level={2} state={tiers.l2} />
                <TierPill level={3} state={tiers.l3} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-[#e6ddc4] px-6 py-4 text-center">
        <Link
          href="/verifier/queue"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#1f3a1f] hover:underline"
        >
          View all pending →
        </Link>
      </div>
    </div>
  );
}
