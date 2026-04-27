"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus, Filter, Globe2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { forecastStars } from "@/lib/utils/star-forecast";
import type { ReportCardListItem, StarLevel } from "@/lib/types";

/**
 * Interactive impact globe.
 * - Renders a 3D globe (react-globe.gl) with one glowing pin per submission
 *   that has lat/long coordinates parseable from its `location` string.
 * - User can click any empty point on the globe (or the "+ Mint Star" button)
 *   to drop a temporary pin and submit a new report from that location.
 * - Tier color: gold = top, silver = mid, copper = base.
 */

// react-globe.gl uses three.js / WebGL → must be client-only.
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <GlobeLoading />,
});

type Pin = {
  id: number | string;
  lat: number;
  lng: number;
  title: string;
  level: StarLevel;
  isNew?: boolean;
  url?: string;
};

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

/* Demo seed pins so the globe never feels empty. */
const SEED_PINS: Pin[] = [
  {
    id: "seed-1",
    lat: -3.4653,
    lng: -62.2159,
    title: "Amazon Reforestation",
    level: "gold",
  },
  {
    id: "seed-2",
    lat: -16.5,
    lng: 145.7,
    title: "Great Barrier Reef Survey",
    level: "silver",
  },
  {
    id: "seed-3",
    lat: -1.2921,
    lng: 36.8219,
    title: "Maasai Mara Anti-Poaching",
    level: "gold",
  },
  {
    id: "seed-4",
    lat: 19.4326,
    lng: -99.1332,
    title: "Urban Pollinator Habitat",
    level: "silver",
  },
  {
    id: "seed-5",
    lat: 64.9631,
    lng: -19.0208,
    title: "Iceland Glacier Watch",
    level: "copper",
  },
  {
    id: "seed-6",
    lat: 27.9881,
    lng: 86.925,
    title: "Himalayan Snow-Leopard Census",
    level: "silver",
  },
  {
    id: "seed-7",
    lat: -54.4208,
    lng: -68.3289,
    title: "Patagonia Seabird Tracking",
    level: "copper",
  },
];

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
  const [size, setSize] = useState({ width: 800, height: 560 });
  const [filter, setFilter] = useState<StarLevel | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [draftPin, setDraftPin] = useState<Pin | null>(null);
  const [localPins, setLocalPins] = useState<Pin[]>([]);

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
          title: p.title,
          lat: p.lat,
          lng: p.lng,
          level: p.level ?? "copper",
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

  // ── Derived pins from submissions + seeds + draft ───────────────
  const submissionPins = useMemo<Pin[]>(() => {
    return submissions.flatMap((rc) => {
      const coords = parseCoords(rc.location);
      if (!coords) return [];
      const level: StarLevel = rc.star_level ?? forecastStars(rc).level;
      return [
        {
          id: rc.id,
          lat: coords.lat,
          lng: coords.lng,
          title: rc.title,
          level,
          url: `/report-cards/${rc.id}`,
        },
      ];
    });
  }, [submissions]);

  const allPins = useMemo<Pin[]>(() => {
    const base = [...SEED_PINS, ...submissionPins, ...localPins];
    const filtered =
      filter === "all" ? base : base.filter((p) => p.level === filter);
    return draftPin ? [...filtered, draftPin] : filtered;
  }, [submissionPins, localPins, filter, draftPin]);

  // ── Add pin via globe click ─────────────────────────────────────
  const handleGlobeClick = ({
    lat,
    lng,
  }: {
    lat: number;
    lng: number;
  }) => {
    setDraftPin({
      id: "draft",
      lat,
      lng,
      title: "New Mission",
      level: "copper",
      isNew: true,
    });
    setShowForm(true);
  };

  return (
    <div className="relative">
      <div
        ref={wrapperRef}
        className="relative h-[560px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
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
          pointColor={(d) => TIER_COLOR[(d as Pin).level]}
          pointAltitude={(d) => ((d as Pin).isNew ? 0.06 : 0.025)}
          pointRadius={(d) => ((d as Pin).isNew ? 0.6 : 0.35)}
          pointLabel={(d) => {
            const p = d as Pin;
            return `
              <div style="
                background:#0b1419;
                border:1px solid #2a3540;
                border-radius:8px;
                padding:8px 12px;
                color:#f5f8fa;
                font-family:Inter,sans-serif;
                font-size:12px;
                box-shadow:0 0 24px rgba(61,221,183,0.25);
              ">
                <div style="font-weight:600;color:${TIER_COLOR[p.level]};">${p.title}</div>
                <div style="font-size:10px;color:#8b95a0;margin-top:2px;">${p.lat.toFixed(2)}, ${p.lng.toFixed(2)} · ${p.level}</div>
              </div>
            `;
          }}
          onPointClick={(d) => {
            const p = d as Pin;
            if (p.url) window.location.href = p.url;
          }}
          onGlobeClick={handleGlobeClick}
        />

        {/* HUD — top right filter pill */}
        <div className="pointer-events-none absolute right-4 top-4 flex flex-col gap-2">
          <div className="pointer-events-auto rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 backdrop-blur">
            <Globe2 className="mr-1 inline h-3 w-3" />
            Tap globe to mint a star
          </div>
        </div>

        {/* HUD — bottom-left stat bar */}
        <div className="pointer-events-auto absolute bottom-4 left-4 flex gap-2">
          <Stat label="Total Stars Minted" value={totalStars.toLocaleString()} />
          <Stat label="Active Projects" value={activeProjects.toLocaleString()} />
        </div>

        {/* HUD — bottom-right action buttons */}
        <div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setDraftPin({
                id: "draft",
                lat: 20,
                lng: 0,
                title: "New Mission",
                level: "copper",
                isNew: true,
              });
              setShowForm(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Mint Star
          </Button>
          <FilterPill filter={filter} setFilter={setFilter} />
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

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <LegendDot color={TIER_COLOR.gold} label="Gold (Impact)" />
        <LegendDot color={TIER_COLOR.silver} label="Silver (Action)" />
        <LegendDot color={TIER_COLOR.copper} label="Copper (Collaboration)" />
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function GlobeLoading() {
  return (
    <div className="flex h-[560px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
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

function FilterPill({
  filter,
  setFilter,
}: {
  filter: StarLevel | "all";
  setFilter: (f: StarLevel | "all") => void;
}) {
  const opts: { value: StarLevel | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "gold", label: "Gold" },
    { value: "silver", label: "Silver" },
    { value: "copper", label: "Copper" },
  ];
  return (
    <div className="inline-flex items-center gap-0 rounded-lg border border-gray-200 bg-white/80 p-1 backdrop-blur">
      <Filter className="ml-2 mr-1 h-3.5 w-3.5 text-gray-500" />
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => setFilter(o.value)}
          className={
            "rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors " +
            (filter === o.value
              ? "bg-emerald-600 text-white"
              : "text-gray-600 hover:text-gray-900")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Add-pin drawer (creative deviation: lets user mint a star
 *    directly from the globe with location-text + project title) ── */

function AddPinDrawer({ pin, onClose }: { pin: Pin; onClose: () => void }) {
  const [title, setTitle] = useState(pin.title === "New Mission" ? "" : pin.title);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Persist additions in localStorage so they survive reloads in mock mode.
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
              setCategory(e.target.value as typeof CATEGORY_OPTIONS[number]["value"])
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
