"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const reporterLinks = [
  { href: "/dashboard", label: "Impact Map" },
  { href: "/report-cards/new", label: "Report Action" },
  { href: "/submissions", label: "Submission History" },
];

const verifierLinks = [
  { href: "/dashboard", label: "Impact Map" },
  { href: "/verifier/queue", label: "Verification Console" },
  { href: "/exports", label: "Exports" },
];

export function TopNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "reporter";
  const links = role === "verifier" ? verifierLinks : reporterLinks;

  return (
    <header className="top-nav sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
      <div className="flex items-center gap-10">
        <Link href="/dashboard" className="brand-name text-lg font-bold">
          EarthTeam Stars
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors",
                  isActive
                    ? "text-emerald-600"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-[18px] left-0 h-0.5 w-full rounded-full bg-emerald-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle className="w-auto" />
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:text-gray-900"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-500">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
