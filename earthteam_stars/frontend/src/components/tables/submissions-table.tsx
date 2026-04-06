"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { StarBadge } from "@/components/ui/star-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TYPE_LABELS, CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { List } from "lucide-react";
import type { ReportCardListItem } from "@/lib/types";

interface SubmissionsTableProps {
  data: ReportCardListItem[];
  isLoading?: boolean;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 w-24 rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SubmissionsTable({ data, isLoading }: SubmissionsTableProps) {
  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        icon={<List className="h-10 w-10" />}
        title="No submissions yet"
        description="Create your first report card to get started."
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
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Submitted
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Stars
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
                  <Link
                    href={`/report-cards/${rc.id}`}
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    {rc.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {TYPE_LABELS[rc.type]}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {CATEGORY_LABELS[rc.category]}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={rc.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(rc.created_at)}
                </td>
                <td className="px-6 py-4">
                  {rc.star_level && rc.stars_awarded ? (
                    <StarBadge level={rc.star_level} amount={rc.stars_awarded} />
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
