"use client";

import { cn } from "@/lib/utils/cn";
import { STAR_LEVEL_LABELS } from "@/lib/constants";
import { TrendingUp } from "lucide-react";
import type { StarForecast } from "@/lib/utils/star-forecast";

const levelColors: Record<string, string> = {
  copper: "border-amber-600 text-amber-700 bg-amber-50",
  silver: "border-gray-400 text-gray-600 bg-gray-50",
  gold: "border-yellow-500 text-yellow-700 bg-yellow-50",
  platinum: "border-indigo-400 text-indigo-600 bg-indigo-50",
};

const confidenceDots: Record<string, string> = {
  low: "opacity-40",
  medium: "opacity-70",
  high: "opacity-100",
};

interface StarForecastBadgeProps {
  forecast: StarForecast;
  className?: string;
}

export function StarForecastBadge({ forecast, className }: StarForecastBadgeProps) {
  return (
    <span
      title={forecast.reason}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium",
        levelColors[forecast.level],
        confidenceDots[forecast.confidence],
        className,
      )}
    >
      <TrendingUp className="h-3 w-3" />
      {STAR_LEVEL_LABELS[forecast.level]}
    </span>
  );
}
