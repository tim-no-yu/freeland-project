import { apiClient } from "./client";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

function isLocalBackend(): boolean {
  const url = process.env.NEXT_PUBLIC_API_URL || "";
  return url.includes("/api/v1");
}

export async function exportVerifiedActions(params: {
  format: "csv" | "json";
  from?: string;
  to?: string;
}): Promise<Blob> {
  if (USE_MOCKS) {
    const mockCsv =
      "id,title,type,category,status,stars_awarded\n1,Anti-poaching patrol,action,wildlife_protection,issued,8";
    return new Blob([mockCsv], { type: "text/csv" });
  }

  const endpoint = isLocalBackend()
    ? "/exports/verified-actions/"
    : "/report-cards/export/";

  const { data } = await apiClient.get(endpoint, {
    params: { format: params.format, from: params.from, to: params.to },
    responseType: "blob",
  });
  return data;
}
