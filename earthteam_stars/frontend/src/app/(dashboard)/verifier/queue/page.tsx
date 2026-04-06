"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { VerifierQueueTable } from "@/components/tables/verifier-queue-table";
import { getVerifierQueue } from "@/lib/api/verifier";

export default function VerifierQueuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["verifier-queue"],
    queryFn: () => getVerifierQueue(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Queue"
        description="Submissions awaiting your review, oldest first."
      />
      <VerifierQueueTable data={data?.results ?? []} isLoading={isLoading} />
    </div>
  );
}
