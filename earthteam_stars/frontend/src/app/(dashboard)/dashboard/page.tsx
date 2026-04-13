"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { StarForecastBadge } from "@/components/ui/star-forecast-badge";
import { useAuthStore } from "@/stores/auth-store";
import { getReportCards } from "@/lib/api/report-cards";
import { forecastStars } from "@/lib/utils/star-forecast";
import { STAR_LEVEL_LABELS, STAR_LEVEL_COLORS } from "@/lib/constants";
import { FilePlus, List, ClipboardCheck, Download, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { StarLevel } from "@/lib/types";

const reporterActions = [
  {
    title: "New Report Card",
    description: "Submit an Action or Impact report",
    href: "/report-cards/new",
    icon: FilePlus,
    color: "text-emerald-600",
  },
  {
    title: "My Submissions",
    description: "Track your submitted report cards",
    href: "/submissions",
    icon: List,
    color: "text-blue-600",
  },
  {
    title: "Exports",
    description: "Download verified actions",
    href: "/exports",
    icon: Download,
    color: "text-gray-600",
  },
];

const verifierActions = [
  {
    title: "Review Queue",
    description: "Submissions awaiting your review",
    href: "/verifier/queue",
    icon: ClipboardCheck,
    color: "text-yellow-600",
  },
  {
    title: "Exports",
    description: "Download verified actions",
    href: "/exports",
    icon: Download,
    color: "text-gray-600",
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "reporter";
  const actions = role === "verifier" ? verifierActions : reporterActions;

  const { data } = useQuery({
    queryKey: ["report-cards"],
    queryFn: () => getReportCards(),
  });

  const submissions = data?.results ?? [];
  const totalStars = submissions.reduce((sum, rc) => sum + (rc.stars_awarded ?? 0), 0);
  const pendingCount = submissions.filter(
    (rc) => rc.status === "submitted" || rc.status === "under_review",
  ).length;

  const forecastDistribution = submissions.reduce<Record<StarLevel, number>>(
    (acc, rc) => {
      const forecast = forecastStars(rc);
      acc[forecast.level] = (acc[forecast.level] || 0) + 1;
      return acc;
    },
    { copper: 0, silver: 0, gold: 0, platinum: 0 },
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
        description="What would you like to do today?"
      />

      {/* ── Quick Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-gray-500">Total Submissions</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-gray-500">Stars Earned</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">{totalStars}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-gray-500">Pending Review</p>
            <p className="mt-1 text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Star Forecast Distribution ──────────────────── */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">Star Forecast</h2>
            </div>
            <p className="text-xs text-gray-500">
              Projected star levels based on submission detail and type
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {(["copper", "silver", "gold"] as const).map((level) => {
                const count = forecastDistribution[level];
                if (count === 0) return null;
                return (
                  <div key={level} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        STAR_LEVEL_COLORS[level],
                      )}
                    >
                      {count}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {STAR_LEVEL_LABELS[level]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Per-submission forecast list */}
            <div className="mt-4 space-y-2">
              {submissions.slice(0, 5).map((rc) => {
                const forecast = forecastStars(rc);
                return (
                  <div
                    key={rc.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <Link
                      href={`/report-cards/${rc.id}`}
                      className="truncate text-sm font-medium text-gray-800 hover:text-emerald-700"
                    >
                      {rc.title}
                    </Link>
                    <StarForecastBadge forecast={forecast} />
                  </div>
                );
              })}
              {submissions.length > 5 && (
                <Link
                  href="/submissions"
                  className="block text-center text-sm text-emerald-600 hover:underline"
                >
                  View all {submissions.length} submissions
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Actions ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
              <CardContent className="flex items-start gap-4 py-6">
                <a.icon className={`h-8 w-8 ${a.color}`} />
                <div>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{a.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
