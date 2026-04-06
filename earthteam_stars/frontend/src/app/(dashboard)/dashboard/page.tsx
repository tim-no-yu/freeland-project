"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/stores/auth-store";
import { FilePlus, List, ClipboardCheck, Download } from "lucide-react";

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

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
        description="What would you like to do today?"
      />

      {/* ── Quick Stats (placeholder for real data) ────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-gray-500">Total Submissions</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">6</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-gray-500">Stars Earned</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">20</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-gray-500">Pending Review</p>
            <p className="mt-1 text-3xl font-bold text-yellow-600">2</p>
          </CardContent>
        </Card>
      </div>

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
