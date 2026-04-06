"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { StarBadge } from "@/components/ui/star-badge";
import { PageHeader } from "@/components/layout/page-header";
import { getReportCard } from "@/lib/api/report-cards";
import { CATEGORY_LABELS, TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";

export default function ReportCardDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: rc, isLoading } = useQuery({
    queryKey: ["report-card", id],
    queryFn: () => getReportCard(Number(id)),
  });

  if (isLoading || !rc) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={rc.title} />

      {/* ── Meta Info ─────────────────────────────────────── */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Status</p>
            <StatusBadge status={rc.status} className="mt-1" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Type</p>
            <p className="mt-1 text-sm font-medium">{TYPE_LABELS[rc.type]}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Category</p>
            <p className="mt-1 text-sm">{CATEGORY_LABELS[rc.category]}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Activity Date</p>
            <p className="mt-1 text-sm">{formatDate(rc.activity_date)}</p>
          </div>
          {rc.star_level && (
            <div>
              <p className="text-xs font-medium text-gray-500">Stars</p>
              <StarBadge
                level={rc.star_level}
                amount={rc.stars_awarded}
                className="mt-1"
              />
            </div>
          )}
          {rc.location && (
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-500">Location</p>
              <p className="mt-1 text-sm">{rc.location}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Description ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Description</h2>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {rc.description}
          </p>
        </CardContent>
      </Card>

      {/* ── Impact Details ────────────────────────────────── */}
      {rc.type === "impact" && rc.outcomes && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-yellow-800">
              Impact Details
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Outcomes</p>
              <p className="text-sm">{rc.outcomes}</p>
            </div>
            {rc.metrics_value && (
              <div>
                <p className="text-xs font-medium text-gray-500">Metric</p>
                <p className="text-sm">
                  {rc.metrics_value} {rc.metrics_unit}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Evidence ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            Evidence ({rc.evidence.length})
          </h2>
        </CardHeader>
        <CardContent>
          {rc.evidence.length === 0 ? (
            <p className="text-sm text-gray-400">No evidence attached.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rc.evidence.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {e.file_name}
                    </p>
                    {e.description && (
                      <p className="text-xs text-gray-500">{e.description}</p>
                    )}
                  </div>
                  <a
                    href={e.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-emerald-600 hover:underline"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Witnesses ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            Witnesses ({rc.witnesses.length})
          </h2>
        </CardHeader>
        <CardContent>
          {rc.witnesses.length === 0 ? (
            <p className="text-sm text-gray-400">No witnesses listed.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rc.witnesses.map((w, i) => (
                <li key={i} className="py-3">
                  <p className="text-sm font-medium text-gray-700">{w.name}</p>
                  <p className="text-xs text-gray-500">
                    {[w.organization, w.relationship, w.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Chain Record ──────────────────────────────────── */}
      {rc.chain_record && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-purple-700">
              On-Chain Record
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs font-medium text-gray-500">Transaction</p>
              <a
                href={rc.chain_record.explorer_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-emerald-600 hover:underline break-all"
              >
                {rc.chain_record.transaction_hash}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Network</p>
              <p className="text-sm capitalize">{rc.chain_record.network}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
