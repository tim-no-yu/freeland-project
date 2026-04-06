import { apiClient } from "./client";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

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

  // Tim's backend: GET /api/report-cards/export/?format=csv|json
  const { data } = await apiClient.get("/report-cards/export/", {
    params: { format: params.format },
    responseType: "blob",
  });
  return data;
}
