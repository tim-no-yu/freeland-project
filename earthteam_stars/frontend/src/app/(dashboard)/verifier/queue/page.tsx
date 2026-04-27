"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { VerifierQueueTable } from "@/components/tables/verifier-queue-table";
import { getVerifierQueue } from "@/lib/api/verifier";
import { useThemeStore } from "@/stores/theme-store";
import {
  ArchiveShell,
  ArchiveHeader,
  OraclePanel,
} from "@/components/archive/components";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function VerifierQueuePage() {
  const theme = useThemeStore((s) => s.theme);

  const { data, isLoading } = useQuery({
    queryKey: ["verifier-queue"],
    queryFn: () => getVerifierQueue(),
  });

  const queue = data?.results ?? [];

  // ── Archive (Stitch) layout ───────────────────────────────────
  if (theme === "stitch") {
    const total = queue.length || 25;
    const done = Math.max(0, total - queue.length) || 14;
    const queuePct = Math.min(100, Math.round((done / total) * 100));

    return (
      <ArchiveShell
        rail={
          <>
            <OraclePanel
              variant="dark"
              title="Oracle Auditor"
              subtitle={undefined}
            >
              <p className="text-sm leading-relaxed">
                AI analysis indicates a 15% increase in &lsquo;Wildlife&rsquo;
                parameter reports from the Pacific Northwest region over the
                last 48 hours. Suggest prioritizing level 2 and 3 reviews in
                this sector to maintain White Paper compliance.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                Analyze Region
              </button>
            </OraclePanel>

            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-serif text-base font-semibold text-gray-900">
                Recent Verifications
              </h3>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Soil Carbon Sampling
                    </p>
                    <p className="text-xs text-gray-500">
                      Level 3 Verified 2 hrs ago
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Pollinator Garden Init…
                    </p>
                    <p className="text-xs text-gray-500">
                      Level 2 Verified 5 hrs ago
                    </p>
                  </div>
                </li>
              </ul>
            </section>
          </>
        }
      >
        <ArchiveHeader
          title="Verifier Workspace"
          description="Review, validate, and verify ecological impact reports submitted by the EarthTeam community following the White Paper tiers."
          action={
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Queue Status
              </p>
              <div className="mt-0.5 flex items-center justify-end gap-2">
                <span className="font-serif text-base font-bold text-gray-900">
                  {done}/{total} done
                </span>
                <svg
                  className="h-6 w-6 -rotate-90"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-200"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 10}
                    strokeDashoffset={2 * Math.PI * 10 * (1 - queuePct / 100)}
                    className="text-emerald-600"
                  />
                </svg>
              </div>
            </div>
          }
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-serif text-2xl font-bold text-gray-900">
            Pending Verification
          </h2>
          <VerifierQueueTable data={queue} isLoading={isLoading} />
        </section>
      </ArchiveShell>
    );
  }

  // ── Classic layout ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Queue"
        description="Submissions awaiting your review, oldest first."
      />
      <VerifierQueueTable data={queue} isLoading={isLoading} />
    </div>
  );
}
