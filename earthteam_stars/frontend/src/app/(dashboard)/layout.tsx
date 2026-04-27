"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { useThemeStore } from "@/stores/theme-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((s) => s.theme);

  // Avoid hydration mismatch — server always renders the sidebar layout,
  // we swap to the celestial top-nav after mount if needed.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (mounted && theme === "celestial") {
    return (
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">{children}</main>
    </div>
  );
}
