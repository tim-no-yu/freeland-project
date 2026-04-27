"use client";

/**
 * Archive-mode (Stitch) components.
 *
 * These re-create the editorial layouts shown in the Stitch screenshots:
 * three-column page (sidebar + main + right insight rail), Mother Earth
 * Oracle card, big circular consistency gauge, tier stat cards, and
 * tier-grouped submission lists.
 *
 * They use Tailwind utilities backed by the theme's CSS variables, so the
 * cream/forest-green palette is applied automatically when the
 * [data-theme="stitch"] attribute is active on <html>.
 */

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Globe,
  Flower2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { forecastStars } from "@/lib/utils/star-forecast";
import type { ReportCardListItem, StarLevel } from "@/lib/types";

/* ── Three-column shell ─────────────────────────────────────────── */

export function ArchiveShell({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-8">{children}</div>
      {rail && <aside className="space-y-5">{rail}</aside>}
    </div>
  );
}

/* ── Editorial page header ──────────────────────────────────────── */

export function ArchiveHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="min-w-0">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-gray-900 lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── Mother Earth Oracle panel (light + dark variants) ──────────── */

export function OraclePanel({
  title = "Mother Earth Oracle",
  subtitle,
  variant = "light",
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  variant?: "light" | "dark";
  children: React.ReactNode;
  className?: string;
}) {
  const isDark = variant === "dark";
  return (
    <section
      className={cn(
        "rounded-2xl border p-5",
        isDark
          ? "border-emerald-700 bg-emerald-600 text-white"
          : "border-gray-200 bg-white",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles
          className={cn(
            "h-4 w-4",
            isDark ? "text-yellow-400" : "text-yellow-600",
          )}
        />
        <h3
          className={cn(
            "font-serif text-base font-semibold leading-tight",
            isDark ? "text-white" : "text-gray-900",
          )}
        >
          {title}
        </h3>
      </div>
      {subtitle && (
        <p
          className={cn(
            "mb-3 text-[11px] font-semibold uppercase tracking-wider",
            isDark ? "text-white/60" : "text-gray-500",
          )}
        >
          {subtitle}
        </p>
      )}
      <div
        className={cn(
          "text-sm leading-relaxed",
          isDark ? "text-white/90" : "text-gray-600",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/* ── Big circular consistency gauge ─────────────────────────────── */

export function ConsistencyGauge({
  percentage,
  label = "Cumulative Consistency",
  stats,
}: {
  percentage: number;
  label?: string;
  stats?: { label: string; value: string }[];
}) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-yellow-600" />
        <h3 className="font-serif text-base font-semibold leading-tight text-gray-900">
          Mother Earth Oracle
        </h3>
      </div>
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <div className="flex justify-center py-2">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-yellow-100"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="text-yellow-600"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-3xl font-bold text-gray-900">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {stats && stats.length > 0 && (
        <dl className="mt-4 space-y-2 border-t border-gray-100 pt-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline justify-between text-sm"
            >
              <dt className="text-gray-500">{s.label}</dt>
              <dd className="font-serif font-semibold text-gray-900">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/* ── Tier stat cards (Collaboration / Action / Impact) ──────────── */

const tierMeta: Record<
  "collaboration" | "action" | "impact",
  { label: string; tier: string; icon: typeof Users; highlight?: boolean }
> = {
  collaboration: {
    label: "Collaboration",
    tier: "Bronze Stars",
    icon: Users,
  },
  action: {
    label: "Action",
    tier: "Silver Stars",
    icon: Flower2,
  },
  impact: {
    label: "Impact",
    tier: "Gold Stars",
    icon: Globe,
    highlight: true,
  },
};

export function TierStatCards({
  collaboration,
  action,
  impact,
}: {
  collaboration: number;
  action: number;
  impact: number;
}) {
  const counts: Record<keyof typeof tierMeta, number> = {
    collaboration,
    action,
    impact,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {(Object.keys(tierMeta) as (keyof typeof tierMeta)[]).map((key) => {
        const meta = tierMeta[key];
        const Icon = meta.icon;
        return (
          <div
            key={key}
            className={cn(
              "rounded-2xl border p-5",
              meta.highlight
                ? "border-yellow-100 bg-yellow-100/40"
                : "border-gray-200 bg-white",
            )}
          >
            <div className="mb-3 flex items-start justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {meta.label}
              </span>
              <Icon
                className={cn(
                  "h-5 w-5",
                  meta.highlight ? "text-yellow-700" : "text-gray-400",
                )}
              />
            </div>
            <p className="font-serif text-4xl font-bold leading-none text-gray-900">
              {counts[key]}
            </p>
            <p className="mt-2 text-sm text-gray-500">{meta.tier}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Lifetime impact card with horizontal progress bars ─────────── */

export function LifetimeImpactCard({
  metrics,
}: {
  metrics: {
    label: string;
    value: string;
    progress: number;
    tone?: "green" | "gray" | "gold";
  }[];
}) {
  const toneClass: Record<NonNullable<typeof metrics[number]["tone"]>, string> =
    {
      green: "bg-emerald-600",
      gray: "bg-gray-300",
      gold: "bg-yellow-600",
    };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="font-serif text-2xl font-bold leading-tight text-gray-900">
        Lifetime Ecological Impact
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {m.label}
            </p>
            <p className="mt-1 font-serif text-3xl font-bold text-gray-900">
              {m.value}
            </p>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  toneClass[m.tone ?? "green"],
                )}
                style={{ width: `${Math.min(100, Math.max(0, m.progress))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Active Interventions card (recent items list) ──────────────── */

export function ActiveInterventionsCard({
  items,
}: {
  items: ReportCardListItem[];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-100/60 p-5">
      <h2 className="mb-4 font-serif text-2xl font-bold leading-tight text-gray-900">
        Active Interventions
      </h2>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-gray-500">No active interventions yet.</p>
        )}
        {items.map((rc) => {
          const isVerified = rc.status === "approved" || rc.status === "issued";
          return (
            <Link
              key={rc.id}
              href={`/report-cards/${rc.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-emerald-600"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <Flower2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base font-semibold text-gray-900">
                  {rc.title}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {rc.location ?? TYPE_LABELS[rc.type]}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  isVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700",
                )}
              >
                <span className="mr-1">●</span>
                {isVerified ? "Impact Verified" : "Verification: Pending"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ── Tier-grouped submissions list (Archive of Impact) ──────────── */

const tierLabels: Record<StarLevel, { level: string; tone: string }> = {
  gold: {
    level: "Level 3: Impact Tier",
    tone: "text-yellow-700",
  },
  silver: {
    level: "Level 2: Action Tier",
    tone: "text-gray-700",
  },
  copper: {
    level: "Level 1: Collaboration Tier",
    tone: "text-amber-700",
  },
  platinum: {
    level: "Platinum Tier",
    tone: "text-indigo-900",
  },
};

const tierPillClass: Record<StarLevel, string> = {
  gold: "bg-yellow-100 text-yellow-900",
  silver: "bg-green-100 text-green-700",
  copper: "bg-gray-200 text-gray-700",
  platinum: "bg-indigo-200 text-indigo-900",
};

const tierIcon: Record<StarLevel, string> = {
  gold: "★",
  silver: "▲",
  copper: "●",
  platinum: "◆",
};

export function TierGroupedSubmissions({
  data,
}: {
  data: ReportCardListItem[];
}) {
  const buckets: Record<StarLevel, ReportCardListItem[]> = {
    platinum: [],
    gold: [],
    silver: [],
    copper: [],
  };

  for (const rc of data) {
    const level = rc.star_level ?? forecastStars(rc).level;
    buckets[level].push(rc);
  }

  const order: StarLevel[] = ["platinum", "gold", "silver", "copper"];

  return (
    <div className="space-y-10">
      {order.map((level) => {
        const items = buckets[level];
        if (items.length === 0) return null;
        const meta = tierLabels[level];
        return (
          <section key={level}>
            <h2
              className={cn(
                "mb-4 flex items-center gap-2 font-serif text-lg font-semibold tracking-tight",
                meta.tone,
              )}
            >
              <span aria-hidden>{tierIcon[level]}</span>
              {meta.level}
            </h2>
            <div className="space-y-3">
              {items.map((rc) => (
                <SubmissionTierCard key={rc.id} rc={rc} fallbackLevel={level} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SubmissionTierCard({
  rc,
  fallbackLevel,
}: {
  rc: ReportCardListItem;
  fallbackLevel: StarLevel;
}) {
  const level = rc.star_level ?? fallbackLevel;
  const earned = rc.stars_awarded != null;
  const stars =
    rc.stars_awarded ??
    (level === "gold" ? 450 : level === "silver" ? 85 : 10);

  const isApproved = rc.status === "approved" || rc.status === "issued";
  const isPending =
    rc.status === "submitted" || rc.status === "under_review";

  return (
    <Link
      href={`/report-cards/${rc.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-emerald-600"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl font-bold text-gray-900">
            {rc.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Submitted on {formatDate(rc.created_at)}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
            tierPillClass[level],
          )}
        >
          {level}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          {isApproved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Approved
            </>
          ) : isPending ? (
            <>
              <Clock className="h-4 w-4 text-yellow-600" />
              Evidence Pending
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-yellow-600" />
              AI Validated
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {earned ? "Stars Earned" : isApproved ? "Stars Earned" : "Potential Stars"}
          </p>
          <p className="font-serif text-2xl font-bold leading-tight text-gray-900">
            {stars} <span className="text-sm font-normal text-gray-500">★</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── Recommended focus list (small) ─────────────────────────────── */

export function RecommendedFocus({ items }: { items: string[] }) {
  return (
    <div className="mt-4 border-t border-white/15 pt-4 text-white/85">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
        Recommended Focus
      </p>
      <ul className="space-y-2 text-sm">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-yellow-400" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
