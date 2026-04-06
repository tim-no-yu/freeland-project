"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { exportVerifiedActions } from "@/lib/api/exports";

export default function ExportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const download = async (format: "csv" | "json") => {
    setLoading(true);
    try {
      const blob = await exportVerifiedActions({ format, from, to });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `earthteam-verified-actions.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exports"
        description="Download verified actions for reporting and audits."
      />
      <Card className="max-w-lg">
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            Export Verified Actions
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              label="To Date"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              loading={loading}
              onClick={() => download("csv")}
            >
              Download CSV
            </Button>
            <Button
              variant="secondary"
              loading={loading}
              onClick={() => download("json")}
            >
              Download JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
