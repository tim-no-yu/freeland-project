"use client";

import { cn } from "@/lib/utils/cn";
import { STAR_LEVEL_LABELS, STAR_LEVEL_COLORS } from "@/lib/constants";
import type { StarLevel } from "@/lib/types";

interface StarBadgeProps {
  level: StarLevel;
  amount?: number;
  className?: string;
}

export function StarBadge({ level, amount, className }: StarBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STAR_LEVEL_COLORS[level],
        className,
      )}
    >
      ★ {STAR_LEVEL_LABELS[level]}
      {amount != null && <span>· {amount}</span>}
    </span>
  );
}
