"use client";

import { useState, useMemo } from "react";
import {
  Save,
  Bell,
  Settings as Cog,
  FileText,
  BarChart3,
  Share2,
  Lock,
  Rocket,
  Check,
  X,
  AlertCircle,
  MapPin,
  Layers,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/constants";
import type {
  ReportCard,
  SubmitReviewPayload,
  VerificationDecision,
} from "@/lib/types";

/**
 * Celestial verifier dossier — visual replica of the "Pangolin Protection
 * Initiative" screenshot. Maps the existing 3-field rubric to a 3-stage
 * gated flow: Collaboration · Results · Impact.
 *
 * Each stage exposes 4 quality criteria as ETS-rewarded checkboxes; the
 * verifier toggles them on, the verification score animates upward, and a
 * "gate unlock" toggle gates the next stage. Final action mints ETS tokens,
 * which is just the existing `submitReview` call with decision="approve"
 * and the derived rubric scores.
 */

type StageKey = "collaboration" | "results" | "impact";

interface Criterion {
  id: string;
  label: string;
  ets: number;
}

interface Stage {
  key: StageKey;
  index: number;
  title: string;
  subtitle: string;
  criteria: Criterion[];
}

const STAGES: Stage[] = [
  {
    key: "collaboration",
    index: 1,
    title: "Human Network Synergies",
    subtitle: "Verify community engagement and disclosure quality",
    criteria: [
      { id: "ami", label: "Account Matrix Integration", ets: 1 },
      { id: "csd", label: "Comprehensive Solution Disclosure", ets: 5 },
      { id: "pts", label: "Public Townhall Spotlight Presentation", ets: 5 },
      { id: "sea", label: "Social Ecosystem Amplification", ets: 5 },
    ],
  },
  {
    key: "results",
    index: 2,
    title: "Field Metric Validation",
    subtitle: "Confirm reported outcomes against on-the-ground evidence",
    criteria: [
      { id: "om", label: "Officers Trained Verified", ets: 4 },
      { id: "ps", label: "Patrols Supported Confirmed", ets: 4 },
      { id: "rc", label: "Route Disruption Cross-Checked", ets: 6 },
      { id: "br", label: "Baseline Reduction Documented", ets: 6 },
    ],
  },
  {
    key: "impact",
    index: 3,
    title: "Trust Consensus & Chain Anchor",
    subtitle: "External verification and on-chain provenance",
    criteria: [
      { id: "pa", label: "Peer Auditor Co-Signature", ets: 8 },
      { id: "ev", label: "External Verification Provided", ets: 8 },
      { id: "cm", label: "Methodology Citation Logged", ets: 4 },
      { id: "ch", label: "Chain-Anchored Provenance", ets: 10 },
    ],
  },
];

const TOTAL_AVAILABLE_ETS = STAGES.reduce(
  (sum, s) => sum + s.criteria.reduce((t, c) => t + c.ets, 0),
  0,
);

interface CelestialVerifierDossierProps {
  rc: ReportCard;
  onSubmitReview: (payload: SubmitReviewPayload) => Promise<void>;
}

export function CelestialVerifierDossier({
  rc,
  onSubmitReview,
}: CelestialVerifierDossierProps) {
  // Per-criterion checked state, plus a manual "gate unlock" toggle per stage
  // (lets the verifier explicitly attest the stage is complete even if not
  // every box is checked, mirroring the screenshot's GATE UNLOCK control).
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [gates, setGates] = useState<Record<StageKey, boolean>>({
    collaboration: false,
    results: false,
    impact: false,
  });
  const [submitting, setSubmitting] = useState<VerificationDecision | null>(
    null,
  );

  // ── Derived score state ─────────────────────────────────────────
  const stageEarnedEts = (s: Stage) =>
    s.criteria.reduce((t, c) => t + (checked[c.id] ? c.ets : 0), 0);

  const totalEarned = STAGES.reduce((t, s) => t + stageEarnedEts(s), 0);
  const verificationScore = Math.round(
    (totalEarned / TOTAL_AVAILABLE_ETS) * 100,
  );

  const isStageUnlocked = (s: Stage): boolean => {
    if (s.index === 1) return true;
    const prior = STAGES[s.index - 2];
    const checksDone = prior.criteria.filter((c) => checked[c.id]).length;
    return gates[prior.key] || checksDone >= 3;
  };

  const allGatesUnlocked = STAGES.slice(0, -1).every(
    (s) =>
      gates[s.key] || s.criteria.filter((c) => checked[c.id]).length >= 3,
  );

  // ── Submit handlers ─────────────────────────────────────────────
  const buildScores = () => {
    const stageScore = (s: Stage) =>
      Math.max(
        1,
        Math.min(
          5,
          Math.round(
            (stageEarnedEts(s) /
              s.criteria.reduce((t, c) => t + c.ets, 0)) *
              5,
          ) || 1,
        ),
      );
    return {
      evidence_quality: stageScore(STAGES[0]),
      impact_clarity: stageScore(STAGES[1]),
      completeness: stageScore(STAGES[2]),
    };
  };

  const submit = async (decision: VerificationDecision) => {
    setSubmitting(decision);
    try {
      await onSubmitReview({
        report_card_id: rc.id,
        decision,
        scores: buildScores(),
        comments:
          decision === "approve"
            ? `Celestial review · ${verificationScore}/100 · ${totalEarned} ETS earned`
            : `Celestial review · ${verificationScore}/100 · gates ${
                Object.entries(gates)
                  .filter(([, v]) => v)
                  .map(([k]) => k)
                  .join(", ") || "none"
              }`,
      });
    } finally {
      setSubmitting(null);
    }
  };

  const toggleCheck = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleGate = (key: StageKey) =>
    setGates((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="celestial-dossier -mx-8 -my-10">
      {/* Top action bar */}
      <header className="flex items-center justify-between border-b border-[#1a2530] bg-[#0d171f] px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#3dddb7]/30 bg-[#15202b]">
            <Layers className="h-5 w-5 text-[#3dddb7]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
              Verifier Dossier
            </p>
            <h2 className="font-serif text-lg italic text-[#f5f8fa]">
              {rc.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
              Total ETS Cumulated
            </p>
            <p className="font-serif text-xl italic text-[#3dddb7]">
              {totalEarned.toFixed(2)}{" "}
              <span className="text-base text-[#f5d547]">★</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => submit("request_info")}
            disabled={submitting !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2a3540] bg-[#15202b] px-4 py-2 text-xs font-semibold text-[#d0d6dc] transition-colors hover:border-[#3dddb7]/40 hover:text-[#f5f8fa] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {submitting === "request_info" ? "Saving…" : "Save Progress"}
          </button>
          <Bell className="h-4 w-4 text-[#6b7785]" />
          <Cog className="h-4 w-4 text-[#6b7785]" />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-0">
        {/* ── Left rail: dossier ──────────────────────────────── */}
        <aside className="col-span-12 border-r border-[#1a2530] bg-[#0d171f] px-7 py-6 lg:col-span-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
            Project Dossier
          </p>
          <h1 className="mt-3 font-serif text-3xl italic leading-[1.1] text-[#f5f8fa]">
            {rc.title}
          </h1>

          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#1a2530] py-4">
            <div>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7785]">
                <MapPin className="h-3 w-3" />
                Location
              </p>
              <p className="mt-1 text-sm text-[#e3e8ec]">
                {rc.location || "Coordinates pending"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7785]">
                Impact Level
              </p>
              <p className="mt-1 text-sm text-[#e3e8ec]">
                {CATEGORY_LABELS[rc.category]} · Tier{" "}
                {rc.type === "impact" ? "1" : "2"}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-[#b5bcc4]">
            {rc.description}
          </p>

          {/* Evidence Vault */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
                Evidence Vault
              </p>
              <p className="text-[10px] text-[#3dddb7]">
                {rc.evidence.length} Verified Artifact
                {rc.evidence.length === 1 ? "" : "s"}
              </p>
            </div>
            {rc.evidence.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#2a3540] bg-[#15202b]/50 p-4 text-center text-xs text-[#6b7785]">
                No artifacts uploaded
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {rc.evidence.slice(0, 4).map((e) => (
                  <a
                    key={e.id}
                    href={e.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex aspect-square flex-col justify-end rounded-lg border border-[#2a3540] bg-[#15202b] p-3 transition-all hover:border-[#3dddb7]/40 hover:shadow-[0_0_18px_rgba(61,221,183,0.18)]"
                  >
                    <FileText className="mb-2 h-5 w-5 text-[#3dddb7]/70 group-hover:text-[#3dddb7]" />
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#d0d6dc]">
                      {e.file_name.replace(/\.[^.]+$/, "").slice(0, 24)}
                    </p>
                  </a>
                ))}
              </div>
            )}

            <div className="mt-3 flex aspect-[2/1] items-end gap-2 rounded-lg border border-[#2a3540] bg-[#15202b] p-3">
              <Share2 className="h-4 w-4 text-[#3dddb7]/70" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#d0d6dc]">
                Social Validation
              </p>
            </div>
          </div>

          {/* Reporter footer */}
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-[#1a2530] bg-[#15202b]/50 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2530] text-[10px] font-semibold uppercase text-[#3dddb7]">
              {rc.reporter.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#e3e8ec]">
                {rc.reporter.name}
              </p>
              <p className="truncate text-[10px] text-[#6b7785]">
                Field Reporter
              </p>
            </div>
            <BarChart3 className="ml-auto h-4 w-4 text-[#6b7785]" />
          </div>
        </aside>

        {/* ── Right pane: gated stages ────────────────────────── */}
        <section className="col-span-12 bg-[#0b1419] px-8 py-6 lg:col-span-8">
          {/* Stepper + verification score */}
          <div className="flex items-center justify-between">
            <Stepper stages={STAGES} checked={checked} gates={gates} />
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
                Verification Score
              </p>
              <p className="font-serif text-3xl italic text-[#f5f8fa]">
                {verificationScore}
                <span className="text-lg text-[#6b7785]">/100</span>
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {STAGES.map((stage) => {
              const unlocked = isStageUnlocked(stage);
              const earned = stageEarnedEts(stage);
              const stageMax = stage.criteria.reduce((t, c) => t + c.ets, 0);
              const checksDone = stage.criteria.filter(
                (c) => checked[c.id],
              ).length;
              const gateReady = checksDone >= 3 || gates[stage.key];

              return (
                <div
                  key={stage.key}
                  className={
                    "rounded-xl border bg-[#0d171f] transition-all " +
                    (unlocked
                      ? "border-[#1a2530] opacity-100"
                      : "border-[#161f28] opacity-50")
                  }
                >
                  <div className="flex items-center justify-between border-b border-[#1a2530] px-6 py-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
                        Stage {stage.index}
                      </p>
                      <h3 className="mt-1 font-serif text-xl italic text-[#f5f8fa]">
                        {stage.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {!unlocked && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#2a3540] bg-[#15202b] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b7785]">
                          <Lock className="h-3 w-3" />
                          Locked Stage
                        </span>
                      )}
                      <span
                        className={
                          "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider " +
                          (earned > 0
                            ? "bg-[#3dddb7]/10 text-[#3dddb7]"
                            : "border border-[#2a3540] text-[#6b7785]")
                        }
                      >
                        +{earned} / {stageMax} ETS
                      </span>
                    </div>
                  </div>

                  {unlocked && (
                    <div className="space-y-2 px-6 py-5">
                      {stage.criteria.map((c) => {
                        const isChecked = !!checked[c.id];
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleCheck(c.id)}
                            className={
                              "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all " +
                              (isChecked
                                ? "border-[#3dddb7]/30 bg-[#15202b] shadow-[inset_0_0_18px_rgba(61,221,183,0.06)]"
                                : "border-[#1a2530] bg-[#15202b]/40 hover:border-[#2a3540] hover:bg-[#15202b]")
                            }
                          >
                            <span
                              className={
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all " +
                                (isChecked
                                  ? "bg-[#3dddb7] shadow-[0_0_12px_rgba(61,221,183,0.5)]"
                                  : "border border-[#3a4550]")
                              }
                            >
                              {isChecked && (
                                <Check className="h-3 w-3 text-[#0b1419]" strokeWidth={3} />
                              )}
                            </span>
                            <span
                              className={
                                "flex-1 text-xs font-semibold uppercase tracking-wider " +
                                (isChecked ? "text-[#f5f8fa]" : "text-[#b5bcc4]")
                              }
                            >
                              {c.label}
                            </span>
                            <span
                              className={
                                "text-[11px] font-semibold " +
                                (isChecked ? "text-[#3dddb7]" : "text-[#6b7785]")
                              }
                            >
                              +{c.ets} ETS
                            </span>
                          </button>
                        );
                      })}

                      {/* Gate unlock — last stage doesn't need one */}
                      {stage.index < STAGES.length && (
                        <div
                          className={
                            "mt-3 flex items-center justify-between rounded-lg border px-4 py-3 " +
                            (gates[stage.key]
                              ? "border-[#3dddb7]/40 bg-[#3dddb7]/8"
                              : "border-[#2a3540] bg-[#15202b]")
                          }
                        >
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3dddb7]">
                              Gate Unlock
                            </p>
                            <p className="mt-0.5 text-xs text-[#b5bcc4]">
                              Confirm {stage.key} authenticity to proceed to
                              the next stage.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleGate(stage.key)}
                            aria-pressed={gates[stage.key]}
                            className={
                              "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
                              (gates[stage.key]
                                ? "bg-[#3dddb7] shadow-[0_0_18px_rgba(61,221,183,0.4)]"
                                : "bg-[#2a3540]")
                            }
                          >
                            <span
                              className={
                                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all " +
                                (gates[stage.key] ? "left-[22px]" : "left-0.5")
                              }
                            />
                          </button>
                        </div>
                      )}

                      {!gateReady && stage.index < STAGES.length && (
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#6b7785]">
                          <AlertCircle className="h-3 w-3" />
                          Check at least 3 criteria or flip Gate Unlock to
                          proceed.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom CTA bar */}
          <div className="mt-6 flex flex-col items-stretch gap-3 rounded-xl border border-[#1a2530] bg-[#0d171f] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
                Action Required
              </p>
              <p className="mt-0.5 text-sm text-[#e3e8ec]">
                {allGatesUnlocked
                  ? "All gates unlocked — ready to mint ETS tokens"
                  : "Complete each stage gate to mint tokens"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => submit("reject")}
                disabled={submitting !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-[#3a2530] bg-[#15202b] px-4 py-2 text-xs font-semibold text-[#e27676] transition-colors hover:border-[#e27676]/50 hover:bg-[#1a1015] disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                {submitting === "reject" ? "Rejecting…" : "Reject Dossier"}
              </button>
              <button
                type="button"
                onClick={() => submit("approve")}
                disabled={submitting !== null || !allGatesUnlocked}
                className={
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all " +
                  (allGatesUnlocked
                    ? "bg-[#3dddb7] text-[#0b1419] shadow-[0_0_24px_rgba(61,221,183,0.45)] hover:shadow-[0_0_32px_rgba(61,221,183,0.6)]"
                    : "cursor-not-allowed bg-[#15202b] text-[#6b7785]")
                }
              >
                {submitting === "approve" ? "Minting…" : "Mint ETS Tokens"}
                <Rocket className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Stepper ──────────────────────────────────────────────────────── */

function Stepper({
  stages,
  checked,
  gates,
}: {
  stages: Stage[];
  checked: Record<string, boolean>;
  gates: Record<StageKey, boolean>;
}) {
  return (
    <div className="flex items-center gap-2">
      {stages.map((s, i) => {
        const checksDone = s.criteria.filter((c) => checked[c.id]).length;
        const isComplete = gates[s.key] || checksDone >= 3;
        const isCurrent =
          !isComplete &&
          (i === 0 ||
            stages
              .slice(0, i)
              .every(
                (p) =>
                  gates[p.key] ||
                  p.criteria.filter((c) => checked[c.id]).length >= 3,
              ));

        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={
                  "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-all " +
                  (isComplete
                    ? "border-[#3dddb7] bg-[#3dddb7] text-[#0b1419] shadow-[0_0_18px_rgba(61,221,183,0.45)]"
                    : isCurrent
                      ? "border-[#3dddb7]/60 bg-[#3dddb7]/10 text-[#3dddb7] shadow-[0_0_14px_rgba(61,221,183,0.25)]"
                      : "border-[#2a3540] bg-[#15202b] text-[#6b7785]")
                }
              >
                {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : s.index}
              </div>
              <p
                className={
                  "text-[10px] font-semibold uppercase tracking-[0.18em] " +
                  (isComplete || isCurrent ? "text-[#3dddb7]" : "text-[#6b7785]")
                }
              >
                {s.key}
              </p>
            </div>
            {i < stages.length - 1 && (
              <div
                className={
                  "mx-2 mb-5 h-px w-12 " +
                  (isComplete ? "bg-[#3dddb7]" : "bg-[#2a3540]")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
