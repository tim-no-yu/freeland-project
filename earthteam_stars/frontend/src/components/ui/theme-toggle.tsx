"use client";

import { useEffect, useState } from "react";
import { Sun, BookOpen, Globe2 } from "lucide-react";
import { useThemeStore, type Theme } from "@/stores/theme-store";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  variant?: "switch" | "icon";
  className?: string;
}

/**
 * A two-state toggle that flips between the original "Classic" design and
 * the Stitch-inspired "Eco" dark design.
 *
 * `variant="switch"` renders a labelled segmented switch (great for a sidebar
 * or settings row). `variant="icon"` renders a single round icon button —
 * useful in tight spots like the login screen corner.
 */
export function ThemeToggle({ variant = "switch", className }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  // Avoid hydration mismatch: render placeholder until mounted on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const themeMeta: Record<
    Theme,
    { label: string; icon: typeof Sun }
  > = {
    classic: { label: "Classic", icon: Sun },
    stitch: { label: "Archive", icon: BookOpen },
    celestial: { label: "Celestial", icon: Globe2 },
  };

  if (variant === "icon") {
    const current = mounted ? theme : "classic";
    const Icon = themeMeta[current].icon;
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Cycle design theme"
        title={`Theme: ${themeMeta[current].label} (click to cycle)`}
        suppressHydrationWarning
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
          className,
        )}
      >
        <span suppressHydrationWarning>
          <Icon className="h-4 w-4" />
        </span>
      </button>
    );
  }

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "classic", label: "Classic", icon: Sun },
    { value: "stitch", label: "Archive", icon: BookOpen },
    { value: "celestial", label: "Celestial", icon: Globe2 },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Design theme"
      data-theme-toggle="root"
      className={cn(
        "inline-flex w-full items-center rounded-lg border border-gray-200 bg-gray-50 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-theme-toggle="option"
            data-active={active ? "true" : "false"}
            onClick={() => setTheme(opt.value)}
            suppressHydrationWarning
            title={opt.label}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
              active
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
