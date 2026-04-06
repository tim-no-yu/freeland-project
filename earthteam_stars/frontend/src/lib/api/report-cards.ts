import { apiClient } from "./client";
import { mockReportCards, mockReportCardDetail } from "@/lib/mocks/report-cards";
import type {
  ReportCard,
  ReportCardListItem,
  CreateReportCardPayload,
  PaginatedResponse,
} from "@/lib/types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/**
 * Normalize field names from Tim's backend to frontend types.
 * Backend uses: card_type, submitter, "pending"
 * Frontend uses: type, reporter, "submitted"
 */
function normalizeReportCard(raw: Record<string, unknown>): ReportCardListItem {
  return {
    ...raw,
    type: (raw.card_type ?? raw.type) as ReportCardListItem["type"],
    reporter: raw.submitter ?? raw.reporter,
    status: raw.status === "pending" ? "submitted" : raw.status,
  } as unknown as ReportCardListItem;
}

export async function getReportCards(params?: {
  status?: string;
  type?: string;
  page?: number;
}): Promise<PaginatedResponse<ReportCardListItem>> {
  if (USE_MOCKS) {
    let items = [...mockReportCards];
    if (params?.status) items = items.filter((r) => r.status === params.status);
    if (params?.type) items = items.filter((r) => r.type === params.type);
    return { count: items.length, next: null, previous: null, results: items };
  }

  // Tim's backend uses card_type not type as filter param
  const apiParams: Record<string, string | number> = {};
  if (params?.status) apiParams.status = params.status === "submitted" ? "pending" : params.status;
  if (params?.type) apiParams.card_type = params.type;
  if (params?.page) apiParams.page = params.page;

  const { data } = await apiClient.get("/report-cards/", { params: apiParams });
  const items = Array.isArray(data) ? data : data.results ?? [];
  const normalized = items.map(normalizeReportCard);
  return { count: normalized.length, next: null, previous: null, results: normalized };
}

export async function getReportCard(id: number): Promise<ReportCard> {
  if (USE_MOCKS) {
    return { ...mockReportCardDetail, id };
  }
  const { data } = await apiClient.get(`/report-cards/${id}/`);
  return normalizeReportCard(data) as unknown as ReportCard;
}

export async function createReportCard(
  payload: CreateReportCardPayload,
): Promise<ReportCard> {
  if (USE_MOCKS) {
    return {
      ...mockReportCardDetail,
      ...payload,
      id: Date.now(),
      status: "draft",
      evidence: [],
      verifications: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reporter: mockReportCardDetail.reporter,
    };
  }

  // Map frontend field names to Tim's backend field names
  const backendPayload: Record<string, unknown> = {
    card_type: payload.type,
    title: payload.title,
    description: payload.description,
    outputs: payload.notes ?? "",
    outcomes: payload.outcomes ?? "",
  };

  const { data } = await apiClient.post("/report-cards/", backendPayload);
  return normalizeReportCard(data) as unknown as ReportCard;
}

export async function submitReportCard(id: number): Promise<ReportCard> {
  if (USE_MOCKS) {
    return { ...mockReportCardDetail, id, status: "submitted" };
  }
  // Tim's backend creates directly with status "pending" (submitted)
  // No separate submit endpoint — the card is submitted on create
  const { data } = await apiClient.get(`/report-cards/${id}/`);
  return normalizeReportCard(data) as unknown as ReportCard;
}

export async function uploadEvidence(
  reportCardId: number,
  file: File,
  description?: string,
): Promise<{ id: number; file_url: string; file_name: string }> {
  if (USE_MOCKS) {
    return {
      id: Date.now(),
      file_url: URL.createObjectURL(file),
      file_name: file.name,
    };
  }
  const form = new FormData();
  form.append("file", file);
  if (description) form.append("caption", description);
  const { data } = await apiClient.post(
    `/report-cards/${reportCardId}/evidence/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return { id: data.id, file_url: data.file, file_name: file.name };
}
