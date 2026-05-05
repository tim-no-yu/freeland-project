"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus, Filter, Globe2, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { forecastStars } from "@/lib/utils/star-forecast";
import {
  fetchAllEarthTeamPins,
  colorForCategory,
  type EarthTeamPin,
  type FeedKind,
} from "@/lib/api/earthteam-map";
import type { ReportCardListItem, StarLevel } from "@/lib/types";

/**
 * Interactive impact globe.
 *
 * Loads two live data feeds straight from the public EarthTeam map API
 * (https://map.earth-team.org):
 *   - Solutions: ~86 conservation/partner projects
 *   - Wildlife Crime: ~682 incident reports
 *
 * Plus the user's own submissions (with parseable coordinates) and any
 * pins the user mints via the click-to-add drawer (persisted in
 * localStorage).
 *
 * Pins are color-coded by ProjectType / Event_Type and filterable
 * through the bottom-right feed tab. Click a pin → opens its source URL
 * (or the underlying report card for user submissions). Click an empty
 * spot on the globe → drops a draft pin and opens the mint flow.
 */

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <GlobeLoading />,
});

type PinSource = "earthteam" | "submission" | "local" | "draft";

type Pin = {
  id: string;
  source: PinSource;
  feed?: FeedKind; // for earthteam pins
  lat: number;
  lng: number;
  title: string;
  category: string; // "Habitat Protection", "Trafficking", etc.
  color: string;
  // Optional metadata
  organization?: string;
  country?: string;
  description?: string;
  date?: string;
  url?: string;
  isNew?: boolean;
};

type FeedKey = "all" | "solutions" | "wildlife" | "mine";

const TIER_COLOR: Record<StarLevel, string> = {
  gold: "#F5D547",
  silver: "#C0C5CD",
  copper: "#C08A52",
  platinum: "#A78BFA",
};

/* Match free-form text like "12.34, -56.78" or "lat: 12, lng: -34" */
export function parseCoords(
  text?: string,
): { lat: number; lng: number } | null {
  if (!text) return null;
  const match = text.match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    return null;
  return { lat, lng };
}

interface ImpactGlobeProps {
  submissions: ReportCardListItem[];
  totalStars: number;
  activeProjects: number;
}

export function ImpactGlobe({
  submissions,
  totalStars,
  activeProjects,
}: ImpactGlobeProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 620 });
  const [feed, setFeed] = useState<FeedKey>("all");
  const [showForm, setShowForm] = useState(false);
  const [draftPin, setDraftPin] = useState<Pin | null>(null);
  const [localPins, setLocalPins] = useState<Pin[]>([]);
  const [earthteamPins, setEarthteamPins] = useState<Pin[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // ── Load real EarthTeam data on mount ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingFeed(true);
    fetchAllEarthTeamPins()
      .then((pins: EarthTeamPin[]) => {
        if (cancelled) return;
        setEarthteamPins(
          pins.map((p) => ({
            id: p.id,
            source: "earthteam",
            feed: p.feed,
            lat: p.lat,
            lng: p.lng,
            title: p.title,
            category: p.category,
            color: colorForCategory(p.category, p.feed),
            organization: p.organization,
            country: p.country,
            description: p.description,
            date: p.date,
            url: p.sourceUrl,
          })),
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingFeed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Read locally-minted pins from localStorage ──────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("celestial.local-pins");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{
        id: string;
        title: string;
        lat: number;
        lng: number;
        level?: StarLevel;
      }>;
      setLocalPins(
        parsed.map((p) => ({
          id: p.id,
          source: "local" as PinSource,
          lat: p.lat,
          lng: p.lng,
          title: p.title,
          category: "My Mission",
          color: TIER_COLOR[p.level ?? "copper"],
        })),
      );
    } catch {
      // ignore corrupted state
    }
  }, []);

  // ── Resize observer (globe needs explicit width/height) ─────────
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({
        width: Math.max(400, r.width),
        height: Math.max(500, r.height),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Pin transforms from your own submissions ────────────────────
  const submissionPins = useMemo<Pin[]>(() => {
    return submissions.flatMap((rc) => {
      const coords = parseCoords(rc.location);
      if (!coords) return [];
      const level: StarLevel = rc.star_level ?? forecastStars(rc).level;
      return [
        {
          id: `sub-${rc.id}`,
          source: "submission" as PinSource,
          lat: coords.lat,
          lng: coords.lng,
          title: rc.title,
          category: "My Submission",
          color: TIER_COLOR[level],
          url: `/report-cards/${rc.id}`,
        },
      ];
    });
  }, [submissions]);

  // ── Combined pin set, filtered by active feed ───────────────────
  const allPins = useMemo<Pin[]>(() => {
    const userPins = [...submissionPins, ...localPins];
    const all = [...earthteamPins, ...userPins];

    let visible: Pin[] =
      feed === "all"
        ? all
        : feed === "mine"
          ? userPins
          : earthteamPins.filter((p) => p.feed === feed);

    return draftPin ? [...visible, draftPin] : visible;
  }, [earthteamPins, submissionPins, localPins, feed, draftPin]);

  // Counts for the tab bar
  const counts = useMemo(
    () => ({
      all:
        earthteamPins.length + submissionPins.length + localPins.length,
      solutions: earthteamPins.filter((p) => p.feed === "solutions").length,
      wildlife: earthteamPins.filter((p) => p.feed === "wildlife").length,
      mine: submissionPins.length + localPins.length,
    }),
    [earthteamPins, submissionPins, localPins],
  );

  // Categories used in the *visible* pin set, for the legend chips
  const visibleCategories = useMemo(() => {
    const seen = new Map<string, string>(); // category → color
    for (const p of allPins) {
      if (p.source === "draft") continue;
      if (!seen.has(p.category)) seen.set(p.category, p.color);
    }
    return Array.from(seen.entries())
      .slice(0, 6)
      .map(([cat, color]) => ({ category: cat, color }));
  }, [allPins]);

  // ── Click handlers ──────────────────────────────────────────────
  const handleGlobeClick = ({ lat, lng }: { lat: number; lng: number }) => {
    setDraftPin({
      id: "draft",
      source: "draft",
      lat,
      lng,
      title: "New Mission",
      category: "draft",
      color: "#3DDDB7",
      isNew: true,
    });
    setShowForm(true);
  };

  return (
    <div className="relative">
      <div
        ref={wrapperRef}
        className="relative h-[620px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
      >
        <Globe
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#3dddb7"
          atmosphereAltitude={0.18}
          pointsData={allPins}
          pointLat={(d) => (d as Pin).lat}
          pointLng={(d) => (d as Pin).lng}
          pointColor={(d) => (d as Pin).color}
          pointAltitude={(d) => ((d as Pin).isNew ? 0.06 : 0.012)}
          pointRadius={(d) =>
            (d as Pin).isNew
              ? 0.7
              : (d as Pin).source === "earthteam"
                ? 0.22
                : 0.4
          }
          pointLabel={(d) => {
            const p = d as Pin;
            const subline =
              p.source === "earthteam"
                ? `${p.category}${p.country ? " · " + p.country : ""}`
                : `${p.lat.toFixed(2)}, ${p.lng.toFixed(2)} · ${p.category}`;
            return `
              <div style="
                background:#0b1419;
                border:1px solid #2a3540;
                border-radius:10px;
                padding:10px 14px;
                color:#f5f8fa;
                font-family:Inter,sans-serif;
                font-size:12px;
                max-width:260px;
                box-shadow:0 0 24px rgba(61,221,183,0.25);
              ">
                <div style="font-weight:600;color:${p.color};margin-bottom:4px;line-height:1.3;">
                  ${escapeHtml(p.title)}
                </div>
                <div style="font-size:10px;color:#8b95a0;text-transform:uppercase;letter-spacing:0.06em;">
                  ${escapeHtml(subline)}
                </div>
                ${
                  p.source === "earthteam"
                    ? '<div style="font-size:10px;color:#3dddb7;margin-top:6px;">Click for source →</div>'
                    : ""
                }
              </div>
            `;
          }}
          onPointClick={(d) => {
            const p = d as Pin;
            if (p.url) {
              if (p.source === "earthteam")
                window.open(p.url, "_blank", "noopener,noreferrer");
              else window.location.href = p.url;
            }
          }}
          onGlobeClick={handleGlobeClick}
        />

        {/* HUD — top right hint */}
        <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-2">
          <div className="pointer-events-auto rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 backdrop-blur">
            <Globe2 className="mr-1 inline h-3 w-3" />
            Tap globe to mint a star
          </div>
          {loadingFeed && (
            <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 backdrop-blur">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading EarthTeam feed
            </div>
          )}
        </div>

        {/* HUD — bottom-left stat bar */}
        <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-wrap gap-2">
          <Stat
            label="Total Stars Minted"
            value={totalStars.toLocaleString()}
          />
          <Stat
            label="Active Projects"
            value={activeProjects.toLocaleString()}
          />
          <Stat label="Live Pins" value={allPins.length.toLocaleString()} />
        </div>

        {/* HUD — bottom-right action buttons */}
        <div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col items-end gap-2">
          <FeedTabs feed={feed} setFeed={setFeed} counts={counts} />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setDraftPin({
                id: "draft",
                source: "draft",
                lat: 20,
                lng: 0,
                title: "New Mission",
                category: "draft",
                color: "#3DDDB7",
                isNew: true,
              });
              setShowForm(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Mint Star
          </Button>
        </div>
      </div>

      {showForm && draftPin && (
        <AddPinDrawer
          pin={draftPin}
          onClose={() => {
            setShowForm(false);
            setDraftPin(null);
          }}
        />
      )}

      {/* Legend — categories present in the current visible feed */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          <Filter className="h-3 w-3" />
          Showing
        </span>
        {visibleCategories.map((c) => (
          <LegendDot key={c.category} color={c.color} label={c.category} />
        ))}
        {visibleCategories.length === 0 && (
          <span className="text-gray-400">No pins in this view</span>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function GlobeLoading() {
  return (
    <div className="flex h-[620px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
      <div className="flex flex-col items-center gap-3">
        <Globe2 className="h-8 w-8 animate-pulse text-emerald-600" />
        <span>Loading globe…</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-2 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      {label}
    </span>
  );
}

function FeedTabs({
  feed,
  setFeed,
  counts,
}: {
  feed: FeedKey;
  setFeed: (f: FeedKey) => void;
  counts: { all: number; solutions: number; wildlife: number; mine: number };
}) {
  const opts: { value: FeedKey; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "solutions", label: "Solutions", count: counts.solutions },
    { value: "wildlife", label: "Wildlife Crime", count: counts.wildlife },
    { value: "mine", label: "Mine", count: counts.mine },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white/85 p-1 backdrop-blur">
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => setFeed(o.value)}
          className={
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors " +
            (feed === o.value
              ? "bg-emerald-600 text-white"
              : "text-gray-600 hover:text-gray-900")
          }
        >
          {o.label}
          <span
            className={
              "rounded-full px-1.5 text-[10px] font-bold " +
              (feed === o.value
                ? "bg-white/25 text-white"
                : "bg-gray-100 text-gray-500")
            }
          >
            {o.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Add-pin drawer ─────────────────────────────────────────────── */

function AddPinDrawer({ pin, onClose }: { pin: Pin; onClose: () => void }) {
  const [title, setTitle] = useState(
    pin.title === "New Mission" ? "" : pin.title,
  );
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const KEY = "celestial.local-pins";
      const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
      existing.push({
        id: `local-${Date.now()}`,
        title: title || "Untitled Mission",
        category,
        location: `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`,
        lat: pin.lat,
        lng: pin.lng,
        level: "copper",
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(KEY, JSON.stringify(existing));
      setDone(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 700);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Mint a Star</h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3 w-3 text-emerald-600" />
              {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Mission name"
            placeholder="e.g., Coastal Mangrove Restoration"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select
            label="Category"
            options={CATEGORY_OPTIONS.map((c) => ({
              value: c.value,
              label: c.label,
            }))}
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value as (typeof CATEGORY_OPTIONS)[number]["value"],
              )
            }
          />

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="md"
              onClick={handleSubmit}
              loading={submitting}
              disabled={done}
              className="flex-1"
            >
              {done ? "✓ Star Minted" : "Mint Star"}
            </Button>
          </div>

          <p className="text-center text-[11px] text-gray-400">
            Or{" "}
            <Link
              href="/report-cards/new"
              className="font-semibold text-emerald-600 hover:underline"
            >
              open the full report flow →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
