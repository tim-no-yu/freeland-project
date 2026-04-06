"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewForm } from "@/components/forms/review-form";
import { getReportCard } from "@/lib/api/report-cards";
import { submitReview } from "@/lib/api/verifier";
import { CATEGORY_LABELS, TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import type { SubmitReviewPayload } from "@/lib/types";

export default function VerifierReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: rc, isLoading } = useQuery({
    queryKey: ["report-card", id],
    queryFn: () => getReportCard(Number(id)),
  });

  const { mutateAsync: sendReviewMutation } = useMutation({
    mutationFn: (payload: SubmitReviewPayload) => submitReview(payload),
    onSuccess: () => router.push("/verifier/queue"),
  });

  const sendReview = async (payload: SubmitReviewPayload): Promise<void> => {
    await sendReviewMutation(payload);
  };

  if (isLoading || !rc) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Review Submission"
        description={`Submitted by ${rc.reporter.name}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Submission Detail (left 3 cols) ───────────── */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 py-5">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">
                {rc.title}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {rc.description}
              </p>
              {rc.outcomes && (
                <div className="mt-4 rounded-lg bg-yellow-50 p-3">
                  <p className="text-xs font-semibold text-yellow-700">
                    Outcomes
                  </p>
                  <p className="mt-1 text-sm">{rc.outcomes}</p>
                </div>
              )}
            </CardContent>
          </Card>

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
                    <li
                      key={e.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {e.file_name}
                        </p>
                        {e.description && (
                          <p className="text-xs text-gray-500">
                            {e.description}
                          </p>
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
        </div>

        {/* ── Review Form (right 2 cols) ─────────────────── */}
        <div className="lg:col-span-2">
          <Card className="sticky top-0">
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">
                Your Review
              </h2>
            </CardHeader>
            <CardContent>
              <ReviewForm reportCardId={rc.id} onSubmit={sendReview} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
