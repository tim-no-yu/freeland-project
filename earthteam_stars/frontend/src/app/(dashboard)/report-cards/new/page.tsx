"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ReportCardForm } from "@/components/forms/report-card-form";
import {
  createReportCard,
  submitReportCard,
  uploadEvidence,
} from "@/lib/api/report-cards";
import { useThemeStore } from "@/stores/theme-store";
import {
  ArchiveShell,
  ArchiveHeader,
  OraclePanel,
} from "@/components/archive/components";
import type { CreateReportCardPayload } from "@/lib/types";

export default function NewReportCardPage() {
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);

  const handleSubmit = async (
    data: Record<string, unknown>,
    files: File[],
  ) => {
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
      metrics_value: data.metrics_value
        ? Number(data.metrics_value)
        : undefined,
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

  // ── Archive (Stitch) layout ───────────────────────────────────
  if (theme === "stitch") {
    return (
      <ArchiveShell
        rail={
          <OraclePanel subtitle="Consistency Score">
            <p className="font-serif text-4xl font-bold leading-none text-gray-900">
              78%{" "}
              <span className="text-base font-normal text-gray-500">
                Aligned
              </span>
            </p>

            <div className="mt-4 rounded-lg border-l-2 border-yellow-600 bg-gray-100 p-3 text-xs leading-relaxed text-gray-600">
              Your intervention abstract shows strong alignment with regional
              conservation goals. To increase your odds of a Gold-Tier rating,
              provide specific taxonomic details in the upcoming Impact phase.
            </div>

            <div
              aria-hidden
              className="mt-4 h-32 w-full rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, #4a6b3a 0%, #2d4a2b 60%, #1f3a1f 100%)",
                backgroundImage:
                  "radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.15), transparent 50%), linear-gradient(135deg, #5a7d4a 0%, #2d4a2b 60%, #1f3a1f 100%)",
              }}
            />
          </OraclePanel>
        }
      >
        <ArchiveHeader
          title="Initiate Action"
          description="Document your environmental intervention. The Atmospheric Archive records actions of intent and impact."
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <ReportCardForm onSubmit={handleSubmit} />
        </div>
      </ArchiveShell>
    );
  }

  // ── Classic layout ────────────────────────────────────────────
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
