"use client";

import { useState } from "react";
import {
  BookOpen,
  FileText,
  ListChecks,
  History,
  ChevronRight,
  Settings as Cog,
  HelpCircle,
  Bell,
  User,
  Calendar,
  MapPin,
  Save,
  Download,
  Check,
  Lock,
  ShieldCheck,
  Image as ImageIcon,
  FileCheck2,
  Eye,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/constants";
import type {
  ReportCard,
  SubmitReviewPayload,
  VerificationDecision,
} from "@/lib/types";

/**
 * Archive verifier dossier — visual replica of the "Rainforest Reforestation
 * Project" screenshot. 3-column workspace: left nav rail · project dossier
 * · verification rubric. Maps the same 3-rubric-fields backend as the
 * celestial dossier (Collaboration → Results → Impact).
 */

type StageKey = "collaboration" | "results" | "impact";

interface Criterion {
  id: string;
  label: string;
  sublabel: string;
  ets: number;
}

const COLLAB_CRITERIA: Criterion[] = [
  {
    id: "ca",
    label: "Created account",
    sublabel: "Official registry presence verified",
    ets: 1,
  },
  {
    id: "ss",
    label: "Solution submitted",
    sublabel: "Technical dossier filed and complete",
    ets: 5,
  },
  {
    id: "ts",
    label: "Townhall spotlight",
    sublabel: "Presented to the community forum",
    ets: 10,
  },
  {
    id: "smp",
    label: "Social media posts",
    sublabel: "Public transparency engagement",
    ets: 1,
  },
];

const NAV_ITEMS = [
  { key: "dossier", label: "Dossier View", icon: BookOpen, active: true },
  { key: "evidence", label: "Evidence Vault", icon: FileText, active: false },
  { key: "rubric", label: "Scoring Rubric", icon: ListChecks, active: false },
  { key: "history", label: "Audit History", icon: History, active: false },
];

interface ArchiveVerifierDossierProps {
  rc: ReportCard;
  onSubmitReview: (payload: SubmitReviewPayload) => Promise<void>;
}

export function ArchiveVerifierDossier({
  rc,
  onSubmitReview,
}: ArchiveVerifierDossierProps) {
  // Stage state
  const [collab, setCollab] = useState<Record<string, boolean>>({
    ca: true,
    ss: true,
  });
  const [results, setResults] = useState({
    officersTrained: "",
    patrolsCompleted: "",
  });
  const [impact, setImpact] = useState({
    metricsLogged: false,
    chainAnchored: false,
  });
  const [resultsGate, setResultsGate] = useState(false);
  const [impactGate, setImpactGate] = useState(false);
  const [submitting, setSubmitting] = useState<VerificationDecision | null>(
    null,
  );

  // ── Derived state ─────────────────────────────────────────────
  const collabEarned = COLLAB_CRITERIA.reduce(
    (t, c) => t + (collab[c.id] ? c.ets : 0),
    0,
  );
  const resultsEarned =
    (results.officersTrained ? 6 : 0) + (results.patrolsCompleted ? 6 : 0);
  const impactEarned =
    (impact.metricsLogged ? 8 : 0) + (impact.chainAnchored ? 12 : 0);
  const totalEarned = collabEarned + resultsEarned + impactEarned;

  const collabReady =
    Object.values(collab).filter(Boolean).length >= 3 || resultsGate;
  const resultsReady =
    (results.officersTrained && results.patrolsCompleted) || impactGate;
  const allComplete = collabReady && resultsReady;

  // ── Submit ────────────────────────────────────────────────────
  const buildScores = () => ({
    evidence_quality: Math.max(
      1,
      Math.min(5, Math.round((collabEarned / 17) * 5) || 1),
    ),
    impact_clarity: Math.max(
      1,
      Math.min(5, Math.round((resultsEarned / 12) * 5) || 1),
    ),
    completeness: Math.max(
      1,
      Math.min(5, Math.round((impactEarned / 20) * 5) || 1),
    ),
  });

  const submit = async (decision: VerificationDecision) => {
    setSubmitting(decision);
    try {
      await onSubmitReview({
        report_card_id: rc.id,
        decision,
        scores: buildScores(),
        comments: `Archive review · ${totalEarned} ETS · ${
          decision === "approve" ? "minted" : decision
        }`,
      });
    } finally {
      setSubmitting(null);
    }
  };

  const toggleCollab = (id: string) =>
    setCollab((p) => ({ ...p, [id]: !p[id] }));

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="archive-dossier -mx-8 -my-8 flex min-h-[calc(100vh-2rem)] flex-col bg-[#f4eedf]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-[#e6ddc4] bg-[#faf6e9] px-8 py-4">
        <div className="flex items-center gap-8">
          <h2 className="font-serif text-base font-bold italic text-[#1f3a1f]">
            {rc.title}
          </h2>
          <nav className="flex items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <button className="text-[#6b6353] hover:text-[#1f3a1f]">
              Workspace
            </button>
            <button className="border-b-2 border-[#1f3a1f] pb-3 -mb-3 text-[#1f3a1f]">
              Global Archive
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6ddc4] bg-white px-3 py-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f5d547] text-[10px] font-bold text-[#5a4700]">
              ★
            </span>
            <span className="font-serif text-sm font-semibold text-[#1f3a1f]">
              {totalEarned > 0 ? totalEarned.toLocaleString() : "1,240"} ETS
              Cumulated
            </span>
          </div>
          <button
            type="button"
            onClick={() => submit("request_info")}
            disabled={submitting !== null}
            className="inline-flex items-center gap-2 rounded-full border border-[#d6cdb4] bg-white px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f] hover:bg-[#faf6e9] disabled:opacity-50"
          >
            <Save className="h-3 w-3" />
            {submitting === "request_info" ? "Saving" : "Save Progress"}
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e6ddc4] bg-white text-[#6b6353]">
            <Bell className="h-3.5 w-3.5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f3a1f] text-white">
            <User className="h-3.5 w-3.5" />
          </div>
        </div>
      </header>

      {/* 3-column body */}
      <div className="grid flex-1 grid-cols-12 gap-0">
        {/* ── Left nav rail ──────────────────────────────────── */}
        <aside className="col-span-12 flex flex-col border-r border-[#e6ddc4] bg-[#faf6e9] px-6 py-6 md:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
            Official Auditor ID: 8821
          </p>
          <h3 className="mt-2 font-serif text-xl font-bold italic text-[#1f3a1f]">
            Verifier Workspace
          </h3>

          <nav className="mt-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors " +
                    (item.active
                      ? "bg-[#1f3a1f] text-[#f4eedf]"
                      : "text-[#6b6353] hover:bg-[#f0e7ce] hover:text-[#1f3a1f]")
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 pt-8">
            <div className="rounded-lg border border-[#e6ddc4] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
                Protocol
              </p>
              <button className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1f3a1f]">
                View Guidelines <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6353] hover:text-[#1f3a1f]">
              <Cog className="h-3.5 w-3.5" />
              Settings
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6353] hover:text-[#1f3a1f]">
              <HelpCircle className="h-3.5 w-3.5" />
              Support
            </button>
          </div>
        </aside>

        {/* ── Main: project dossier ──────────────────────────── */}
        <section className="col-span-12 px-8 py-8 md:col-span-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dfe9d4] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f]">
            Verified Project Ref: 1044-{rc.category.split("_")[0]}
          </span>

          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-[#1f3a1f]">
            {rc.title}
          </h1>

          <div className="mt-4 flex items-center gap-5 text-sm text-[#6b6353]">
            {rc.activity_date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(rc.activity_date).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            {rc.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {rc.location}
              </span>
            )}
          </div>

          {/* Project details card */}
          <div className="mt-6 rounded-2xl border border-[#e6ddc4] bg-white px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
              Project Details
            </p>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Status" value="Physically Active" />
              <DetailField
                label="Scale"
                value={
                  rc.metrics_value
                    ? `${rc.metrics_value.toLocaleString()} ${rc.metrics_unit ?? "Units"}`
                    : "12,000 Hectares"
                }
              />
              <DetailField
                label="Lead Org"
                value={rc.reporter.organization ?? "Green Canopy Intl."}
              />
              <DetailField label="Duration" value="15 Year Cycle" />
            </div>
          </div>

          {/* Evidence vault */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
                Evidence Vault
              </p>
              <p className="text-[10px] text-[#8a8170]">
                {rc.evidence.length || 8} Items
              </p>
            </div>

            {/* Image tiles */}
            <div className="grid grid-cols-2 gap-3">
              <EvidenceImageTile
                label="Nursery Stage 1"
                gradient="from-[#7da06a] via-[#5b7d4b] to-[#3a5530]"
              />
              <EvidenceImageTile
                label="Field Site 44B"
                gradient="from-[#a3b88f] via-[#6e8a5b] to-[#4d6a3d]"
              />
            </div>

            {/* File rows */}
            <ul className="mt-3 space-y-2">
              {(rc.evidence.length > 0
                ? rc.evidence.slice(0, 2)
                : [
                    {
                      id: "a",
                      file_name: "Certification Report.pdf",
                      description: "Verified by Rainforest Alliance",
                      file_url: "#",
                      file_type: "pdf",
                    },
                    {
                      id: "b",
                      file_name: "Verification.jpg",
                      description: "Community Spotlight",
                      file_url: "#",
                      file_type: "image",
                    },
                  ]
              ).map((e) => {
                const isPdf = String(e.file_name).toLowerCase().endsWith(".pdf");
                return (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-xl border border-[#e6ddc4] bg-white px-4 py-3"
                  >
                    <div
                      className={
                        "flex h-8 w-8 items-center justify-center rounded-md " +
                        (isPdf
                          ? "bg-[#fde7e3] text-[#c54a3a]"
                          : "bg-[#dfe9d4] text-[#1f3a1f]")
                      }
                    >
                      {isPdf ? (
                        <FileCheck2 className="h-4 w-4" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1f3a1f]">
                        {e.file_name}
                      </p>
                      <p className="truncate text-xs text-[#8a8170]">
                        {e.description}
                      </p>
                    </div>
                    <button className="text-[#8a8170] hover:text-[#1f3a1f]">
                      {isPdf ? (
                        <Download className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── Right: verification rubric ──────────────────────── */}
        <section className="col-span-12 border-l border-[#e6ddc4] bg-[#faf6e9] px-8 py-8 md:col-span-5">
          <div className="flex items-center gap-2 border-b border-[#e6ddc4] pb-4">
            <ShieldCheck className="h-4 w-4 text-[#1f3a1f]" />
            <h2 className="font-serif text-xl font-bold italic text-[#1f3a1f]">
              Verification Rubric
            </h2>
          </div>

          {/* Stepper */}
          <div className="mt-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="border-b-2 border-[#1f3a1f] pb-1 text-[#1f3a1f]">
              1. Collaboration
            </span>
            <span className="text-[#bcb39d]">→</span>
            <span className="text-[#bcb39d]">2. Results</span>
            <span className="text-[#bcb39d]">→</span>
            <span className="text-[#bcb39d]">3. Impact</span>
          </div>

          {/* Stage 1: Collaboration */}
          <div className="mt-6 rounded-2xl border border-[#e6ddc4] bg-white px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1f3a1f]">
                  Stage 1: Collaboration
                </h3>
                <p className="mt-1 text-sm text-[#6b6353]">
                  Cross-check official entity activities and social alignment.
                </p>
              </div>
              <span className="rounded-full bg-[#f0e7ce] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f]">
                Active
              </span>
            </div>

            <div className="mt-5 space-y-2">
              {COLLAB_CRITERIA.map((c) => {
                const checked = !!collab[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCollab(c.id)}
                    className={
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all " +
                      (checked
                        ? "border-[#bcd2a8] bg-[#eaf2dd]"
                        : "border-[#e6ddc4] bg-white hover:border-[#d6cdb4]")
                    }
                  >
                    <span
                      className={
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded " +
                        (checked
                          ? "bg-[#1f3a1f] text-white"
                          : "border-2 border-[#bcb39d]")
                      }
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#1f3a1f]">
                        {c.label}
                        <span className="rounded-full bg-[#dfe9d4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1f3a1f]">
                          +{c.ets} ETS
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-[#8a8170]">
                        {c.sublabel}
                      </p>
                    </div>
                    {checked && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f3a1f] text-white">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[#e6ddc4] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f]">
                Verify & Unlock Results Gate
              </p>
              <button
                type="button"
                onClick={() => setResultsGate((v) => !v)}
                aria-pressed={resultsGate}
                className={
                  "relative h-6 w-11 shrink-0 rounded-full border transition-colors " +
                  (resultsGate
                    ? "border-[#1f3a1f] bg-[#1f3a1f]"
                    : "border-[#bcb39d] bg-white")
                }
              >
                <span
                  className={
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all " +
                    (resultsGate ? "left-[22px] bg-white" : "left-1 bg-[#bcb39d]")
                  }
                />
              </button>
            </div>
          </div>

          {/* Stage 2: Results */}
          <div
            className={
              "mt-5 rounded-2xl border bg-white px-6 py-5 transition-opacity " +
              (collabReady ? "border-[#e6ddc4]" : "border-[#eee5cc] opacity-70")
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1f3a1f]">
                  Stage 2: Results
                </h3>
                <p className="mt-1 text-sm text-[#6b6353]">
                  Quantitative performance tracking and data integrity.
                </p>
              </div>
              {!collabReady && <Lock className="h-4 w-4 text-[#bcb39d]" />}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <NumberField
                label="Officers Trained"
                value={results.officersTrained}
                onChange={(v) =>
                  setResults((p) => ({ ...p, officersTrained: v }))
                }
                disabled={!collabReady}
              />
              <NumberField
                label="Patrols Completed"
                value={results.patrolsCompleted}
                onChange={(v) =>
                  setResults((p) => ({ ...p, patrolsCompleted: v }))
                }
                disabled={!collabReady}
              />
            </div>

            {collabReady && (
              <div className="mt-5 flex items-center justify-between border-t border-[#e6ddc4] pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f]">
                  Verify & Unlock Impact Gate
                </p>
                <button
                  type="button"
                  onClick={() => setImpactGate((v) => !v)}
                  aria-pressed={impactGate}
                  className={
                    "relative h-6 w-11 shrink-0 rounded-full border transition-colors " +
                    (impactGate
                      ? "border-[#1f3a1f] bg-[#1f3a1f]"
                      : "border-[#bcb39d] bg-white")
                  }
                >
                  <span
                    className={
                      "absolute top-0.5 h-4 w-4 rounded-full shadow transition-all " +
                      (impactGate ? "left-[22px] bg-white" : "left-1 bg-[#bcb39d]")
                    }
                  />
                </button>
              </div>
            )}
          </div>

          {/* Stage 3: Impact */}
          <div
            className={
              "mt-5 rounded-2xl border bg-white px-6 py-5 transition-opacity " +
              (resultsReady
                ? "border-[#e6ddc4]"
                : "border-[#eee5cc] opacity-70")
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1f3a1f]">
                  Stage 3: Impact
                </h3>
                <p className="mt-1 text-sm text-[#6b6353]">
                  External provenance and chain anchoring for final mint.
                </p>
              </div>
              {!resultsReady && <Lock className="h-4 w-4 text-[#bcb39d]" />}
            </div>

            {resultsReady && (
              <div className="mt-4 space-y-2">
                <CheckRow
                  label="Metrics independently logged"
                  ets={8}
                  checked={impact.metricsLogged}
                  onToggle={() =>
                    setImpact((p) => ({
                      ...p,
                      metricsLogged: !p.metricsLogged,
                    }))
                  }
                />
                <CheckRow
                  label="Chain-anchored provenance"
                  ets={12}
                  checked={impact.chainAnchored}
                  onToggle={() =>
                    setImpact((p) => ({
                      ...p,
                      chainAnchored: !p.chainAnchored,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom action bar */}
      <footer className="sticky bottom-0 flex items-center justify-center gap-3 border-t border-[#e6ddc4] bg-gradient-to-t from-[#f4eedf] to-[#f4eedf]/90 px-8 py-5 backdrop-blur">
        <button
          type="button"
          onClick={() => submit("reject")}
          disabled={submitting !== null}
          className="rounded-full border border-[#d6cdb4] bg-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f] hover:bg-[#faf6e9] disabled:opacity-50"
        >
          {submitting === "reject" ? "Rejecting" : "Export Full Report"}
        </button>
        <button
          type="button"
          onClick={() => submit("approve")}
          disabled={submitting !== null || !allComplete}
          className={
            "rounded-full px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all " +
            (allComplete
              ? "bg-[#1f3a1f] text-[#f4eedf] hover:bg-[#2d4a2b]"
              : "cursor-not-allowed bg-[#d6cdb4] text-[#8a8170]")
          }
        >
          {submitting === "approve" ? "Minting…" : "Mint ETS Tokens"}
        </button>
      </footer>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[#1f3a1f]">{value}</p>
    </div>
  );
}

function EvidenceImageTile({
  label,
  gradient,
}: {
  label: string;
  gradient: string;
}) {
  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.3),transparent_60%)]" />
      <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
        <ImageIcon className="h-3 w-3" />
        {label}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
        {label}
      </label>
      <input
        type="number"
        min={0}
        placeholder="Qty"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[#e6ddc4] bg-[#faf6e9] px-3 py-2 text-sm text-[#1f3a1f] placeholder:text-[#bcb39d] focus:border-[#1f3a1f] focus:outline-none focus:ring-1 focus:ring-[#1f3a1f] disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function CheckRow({
  label,
  ets,
  checked,
  onToggle,
}: {
  label: string;
  ets: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all " +
        (checked
          ? "border-[#bcd2a8] bg-[#eaf2dd]"
          : "border-[#e6ddc4] bg-white hover:border-[#d6cdb4]")
      }
    >
      <span
        className={
          "flex h-5 w-5 shrink-0 items-center justify-center rounded " +
          (checked ? "bg-[#1f3a1f] text-white" : "border-2 border-[#bcb39d]")
        }
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <p className="flex-1 text-sm font-semibold text-[#1f3a1f]">{label}</p>
      <span className="rounded-full bg-[#dfe9d4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1f3a1f]">
        +{ets} ETS
      </span>
    </button>
  );
}
