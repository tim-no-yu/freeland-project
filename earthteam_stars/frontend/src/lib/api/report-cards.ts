import { apiClient } from "./client";
import { mockReportCards, mockReportCardDetail } from "@/lib/mocks/report-cards";
import type {
  ReportCard,
  ReportCardListItem,
  CreateReportCardPayload,
  PaginatedResponse,
} from "@/lib/types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

function isLocalBackend(): boolean {
  const url = process.env.NEXT_PUBLIC_API_URL || "";
  return url.includes("/api/v1");
}

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

  const { data } = await apiClient.get("/report-cards/", { params });
  const items = Array.isArray(data) ? data : data.results ?? [];
  const normalized = isLocalBackend() ? items : items.map(normalizeReportCard);
  return { count: normalized.length, next: null, previous: null, results: normalized };
}

export async function getReportCard(id: number): Promise<ReportCard> {
  if (USE_MOCKS) {
    return { ...mockReportCardDetail, id };
  }
  const { data } = await apiClient.get(`/report-cards/${id}/`);
  if (isLocalBackend()) return data as ReportCard;
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

  let body: Record<string, unknown>;
  if (isLocalBackend()) {
    body = { ...payload };
  } else {
    body = {
      card_type: payload.type,
      title: payload.title,
      description: payload.description,
      outputs: payload.notes ?? "",
      outcomes: payload.outcomes ?? "",
    };
  }

  const { data } = await apiClient.post("/report-cards/", body);
  if (isLocalBackend()) return data as ReportCard;
  return normalizeReportCard(data) as unknown as ReportCard;
}

export async function submitReportCard(id: number): Promise<ReportCard> {
  if (USE_MOCKS) {
    return { ...mockReportCardDetail, id, status: "submitted" };
  }
  if (isLocalBackend()) {
    const { data } = await apiClient.post(`/report-cards/${id}/submit/`);
    return data as ReportCard;
  }
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
  if (description) form.append(isLocalBackend() ? "description" : "caption", description);
  const { data } = await apiClient.post(
    `/report-cards/${reportCardId}/evidence/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return { id: data.id, file_url: data.file_url ?? data.file, file_name: file.name };
}
