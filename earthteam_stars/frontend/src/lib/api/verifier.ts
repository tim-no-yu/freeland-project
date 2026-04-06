import { apiClient } from "./client";
import { mockReportCards } from "@/lib/mocks/report-cards";
import { mockVerifier } from "@/lib/mocks/users";
import type {
  ReportCardListItem,
  PaginatedResponse,
  SubmitReviewPayload,
  Verification,
} from "@/lib/types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export async function getVerifierQueue(params?: {
  type?: string;
  category?: string;
  page?: number;
}): Promise<PaginatedResponse<ReportCardListItem>> {
  if (USE_MOCKS) {
    const queue = mockReportCards.filter(
      (r) => r.status === "submitted" || r.status === "under_review",
    );
    return { count: queue.length, next: null, previous: null, results: queue };
  }

  // Tim's backend has no separate verifier queue — use report-cards filtered by pending
  const { data } = await apiClient.get("/report-cards/", {
    params: { status: "pending" },
  });
  const items = (Array.isArray(data) ? data : data.results ?? []).map(
    (raw: Record<string, unknown>) => ({
      ...raw,
      type: raw.card_type ?? raw.type,
      reporter: raw.submitter ?? raw.reporter,
      status: raw.status === "pending" ? "submitted" : raw.status,
    }),
  );
  return { count: items.length, next: null, previous: null, results: items as ReportCardListItem[] };
}

export async function submitReview(
  payload: SubmitReviewPayload,
): Promise<Verification> {
  if (USE_MOCKS) {
    const totalScore = Object.values(payload.scores).reduce((a, b) => a + b, 0);
    return {
      id: Date.now(),
      report_card_id: payload.report_card_id,
      verifier: mockVerifier,
      decision: payload.decision,
      scores: payload.scores,
      total_score: totalScore,
      comments: payload.comments,
      created_at: new Date().toISOString(),
    };
  }

  // Tim's backend: POST /api/verifications/<card_id>/
  const { data } = await apiClient.post(
    `/verifications/${payload.report_card_id}/`,
    {
      decision: payload.decision,
      scores: payload.scores,
      comments: payload.comments,
    },
  );
  return data as Verification;
}
