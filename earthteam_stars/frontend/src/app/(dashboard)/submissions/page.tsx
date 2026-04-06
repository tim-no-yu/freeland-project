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

const statusOptions = [
  { value: "", label: "All statuses" },
  ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export default function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["report-cards", statusFilter],
    queryFn: () =>
      getReportCards(statusFilter ? { status: statusFilter } : undefined),
  });

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
        data={data?.results ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
