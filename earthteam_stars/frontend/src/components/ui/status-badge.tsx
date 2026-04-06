"use client";

import { cn } from "@/lib/utils/cn";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import type { ReportCardStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ReportCardStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
