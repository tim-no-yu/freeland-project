"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ReportCardForm } from "@/components/forms/report-card-form";
import { createReportCard, submitReportCard } from "@/lib/api/report-cards";
import type { CreateReportCardPayload } from "@/lib/types";

export default function NewReportCardPage() {
  const router = useRouter();

  const handleSubmit = async (data: Record<string, unknown>, _files: File[]) => {
    const payload = data as unknown as CreateReportCardPayload;
    const created = await createReportCard(payload);
    await submitReportCard(created.id);
    router.push("/submissions");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Report Card"
        description="Submit evidence of your action or impact for planetary health."
      />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Report Card Details
          </h2>
        </CardHeader>
        <CardContent>
          <ReportCardForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
