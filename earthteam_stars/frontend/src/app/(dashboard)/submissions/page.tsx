"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SubmissionsTable } from "@/components/tables/submissions-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getReportCards } from "@/lib/api/report-cards";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { useThemeStore } from "@/stores/theme-store";
import {
  ArchiveShell,
  ArchiveHeader,
  ConsistencyGauge,
  TierGroupedSubmissions,
} from "@/components/archive/components";

const statusOptions = [
  { value: "", label: "All statuses" },
  ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export default function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const theme = useThemeStore((s) => s.theme);

  const { data, isLoading } = useQuery({
    queryKey: ["report-cards", statusFilter],
    queryFn: () =>
      getReportCards(statusFilter ? { status: statusFilter } : undefined),
  });

  const submissions = data?.results ?? [];

  // ── Archive (Stitch) layout ───────────────────────────────────
  if (theme === "stitch") {
    const total = submissions.length;
    const validated = submissions.filter(
      (rc) => rc.status === "approved" || rc.status === "issued",
    ).length;
    const validationRate =
      total > 0 ? Math.round((validated / total) * 100) : 88;
    const lifetimeStars = submissions.reduce(
      (s, rc) => s + (rc.stars_awarded ?? 0),
      0,
    );

    return (
      <ArchiveShell
        rail={
          <ConsistencyGauge
            percentage={total > 0 ? validationRate : 92}
            stats={[
              { label: "Total Submissions", value: total > 0 ? String(total) : "14" },
              { label: "Validation Rate", value: `${total > 0 ? validationRate : 88}%` },
              {
                label: "Lifetime Stars",
                value: lifetimeStars > 0 ? lifetimeStars.toLocaleString() : "1,240",
              },
            ]}
          />
        }
      >
        <ArchiveHeader
          title="Archive of Impact"
          description="Review the ledger of your ecological initiatives. Each submission represents a tangible step toward planetary equilibrium."
          action={
            <Link href="/report-cards/new">
              <Button>New Initiative</Button>
            </Link>
          }
        />

        <div className="flex items-center gap-4">
          <div className="w-56">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading submissions…</p>
        ) : submissions.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No submissions yet. Click <strong>New Initiative</strong> to create
            your first one.
          </p>
        ) : (
          <TierGroupedSubmissions data={submissions} />
        )}
      </ArchiveShell>
    );
  }

  // ── Classic layout ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Submissions"
        description="All your report cards in one place."
        action={
          <Link href="/report-cards/new">
            <Button>New Report Card</Button>
          </Link>
        }
      />

      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      <SubmissionsTable
        data={submissions}
        isLoading={isLoading}
      />
    </div>
  );
}
