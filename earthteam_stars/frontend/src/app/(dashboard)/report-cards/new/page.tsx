"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ReportCardForm } from "@/components/forms/report-card-form";
import { createReportCard, submitReportCard, uploadEvidence } from "@/lib/api/report-cards";
import type { CreateReportCardPayload } from "@/lib/types";

export default function NewReportCardPage() {
  const router = useRouter();

  const handleSubmit = async (data: Record<string, unknown>, files: File[]) => {
    const payload: CreateReportCardPayload = {
      type: data.type as CreateReportCardPayload["type"],
      title: data.title as string,
      description: data.description as string,
      category: data.category as CreateReportCardPayload["category"],
      activity_date: (data.activity_date as string) || undefined,
      location: (data.location as string) || undefined,
      notes: (data.notes as string) || undefined,
      problem_statement: (data.problem_statement as string) || undefined,
      tags: (data.tags as string[]) || undefined,
      results: (data.results as string) || undefined,
      outcomes: (data.outcomes as string) || undefined,
      metrics_value: data.metrics_value ? Number(data.metrics_value) : undefined,
      metrics_unit: (data.metrics_unit as string) || undefined,
      baseline_description: (data.baseline_description as string) || undefined,
      witnesses: (data.witnesses as CreateReportCardPayload["witnesses"]) || [],
    };

    const created = await createReportCard(payload);

    for (const file of files) {
      await uploadEvidence(created.id, file, file.name);
    }

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
