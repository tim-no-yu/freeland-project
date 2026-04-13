"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { StarForecastBadge } from "@/components/ui/star-forecast-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { TYPE_LABELS, CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { forecastStars } from "@/lib/utils/star-forecast";
import { ClipboardCheck } from "lucide-react";
import type { ReportCardListItem } from "@/lib/types";

interface VerifierQueueTableProps {
  data: ReportCardListItem[];
  isLoading?: boolean;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 w-24 rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function VerifierQueueTable({
  data,
  isLoading,
}: VerifierQueueTableProps) {
  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-10 w-10" />}
        title="No submissions awaiting review"
        description="All caught up! Check back later."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Reporter
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Submitted
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Star Forecast
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <SkeletonRows />
          ) : (
            data.map((rc) => (
              <tr
                key={rc.id}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {rc.title}
                    </span>
                    <StatusBadge status={rc.status} />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {rc.reporter.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {TYPE_LABELS[rc.type]}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {CATEGORY_LABELS[rc.category]}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(rc.created_at)}
                </td>
                <td className="px-6 py-4">
                  <StarForecastBadge forecast={forecastStars(rc)} />
                </td>
                <td className="px-6 py-4">
                  <Link href={`/verifier/${rc.id}`}>
                    <Button size="sm" variant="secondary">
                      Review
                    </Button>
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
