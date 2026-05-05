"use client";

import Link from "next/link";
import { ChevronRight, Layers, MapPin, Calendar, Filter } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { forecastStars } from "@/lib/utils/star-forecast";
import type { ReportCardListItem, StarLevel } from "@/lib/types";

const TIER_META: Record<
  StarLevel,
  { label: string; color: string; glow: string }
> = {
  gold: { label: "Gold · Tier 1", color: "#F5D547", glow: "rgba(245,213,71,0.45)" },
  silver: { label: "Silver · Tier 2", color: "#C0C5CD", glow: "rgba(192,197,205,0.35)" },
  copper: { label: "Copper · Tier 3", color: "#C08A52", glow: "rgba(192,138,82,0.35)" },
  platinum: { label: "Platinum · Tier 0", color: "#A78BFA", glow: "rgba(167,139,250,0.4)" },
};

interface CelestialVerifierConsoleProps {
  queue: ReportCardListItem[];
  isLoading?: boolean;
}

export function CelestialVerifierConsole({
  queue,
  isLoading,
}: CelestialVerifierConsoleProps) {
  const total = queue.length;
  const inProgress = queue.filter((q) => q.status === "under_review").length;
  const pendingFresh = total - inProgress;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1>Verification Console</h1>
          <p>
            Review, validate, and escalate environmental impact reports from
            field operatives before minting new EarthTeam Stars.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-[#2a3540] bg-[#15202b] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#d0d6dc] hover:border-[#3dddb7]/40 hover:text-[#f5f8fa]"
        >
          <Filter className="h-3.5 w-3.5" />
          Filter Queue
        </button>
      </div>

      {/* Queue stats strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ConsoleStat label="Pending Dossiers" value={total.toString()} accent />
        <ConsoleStat
          label="Under Active Review"
          value={inProgress.toString()}
        />
        <ConsoleStat label="Fresh Submissions" value={pendingFresh.toString()} />
      </div>

      {/* Dossier list */}
      <section className="rounded-2xl border border-[#1a2530] bg-[#0d171f]">
        <header className="grid grid-cols-12 gap-3 border-b border-[#1a2530] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
          <div className="col-span-5">Dossier</div>
          <div className="col-span-2">Reporter</div>
          <div className="col-span-2">Tier</div>
          <div className="col-span-2">Submitted</div>
          <div className="col-span-1 text-right">Open</div>
        </header>

        {isLoading && (
          <div className="px-6 py-12 text-center text-sm text-[#6b7785]">
            Loading dossiers…
          </div>
        )}

        {!isLoading && queue.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Layers className="h-10 w-10 text-[#3dddb7]/50" />
            <p className="text-sm text-[#b5bcc4]">
              All dossiers cleared. Queue is empty.
            </p>
          </div>
        )}

        <ul className="divide-y divide-[#1a2530]">
          {queue.map((rc) => {
            const tier = (rc.star_level ?? forecastStars(rc).level) as StarLevel;
            const meta = TIER_META[tier];
            return (
              <li key={rc.id}>
                <Link
                  href={`/verifier/${rc.id}`}
                  className="group grid grid-cols-12 items-center gap-3 px-6 py-4 transition-colors hover:bg-[#15202b]/60"
                >
                  <div className="col-span-5 flex items-start gap-3">
                    <div
                      className="mt-1 h-2 w-2 rounded-full"
                      style={{
                        background: meta.color,
                        boxShadow: `0 0 12px ${meta.glow}`,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base italic text-[#f5f8fa]">
                        {rc.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-[#6b7785]">
                        {CATEGORY_LABELS[rc.category]}
                        {rc.location && (
                          <span className="ml-2 inline-flex items-center gap-1 normal-case tracking-normal">
                            <MapPin className="h-3 w-3" />
                            {rc.location}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-[#e3e8ec]">{rc.reporter.name}</p>
                  </div>

                  <div className="col-span-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        borderColor: meta.color + "55",
                        background: meta.color + "12",
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center gap-1 text-xs text-[#b5bcc4]">
                    <Calendar className="h-3 w-3 text-[#6b7785]" />
                    {formatDate(rc.created_at)}
                  </div>

                  <div className="col-span-1 flex items-center justify-end">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#2a3540] text-[#3dddb7] transition-all group-hover:border-[#3dddb7]/40">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ConsoleStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1a2530] bg-[#0d171f] px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
        {label}
      </p>
      <p
        className={
          "mt-1 font-serif text-3xl italic " +
          (accent
            ? "text-[#3dddb7] [text-shadow:0_0_24px_rgba(61,221,183,0.4)]"
            : "text-[#f5f8fa]")
        }
      >
        {value}
      </p>
    </div>
  );
}
