import type { ReportCardListItem, StarLevel } from "@/lib/types";

export interface StarForecast {
  level: StarLevel;
  confidence: "low" | "medium" | "high";
  reason: string;
}

export function forecastStars(rc: ReportCardListItem): StarForecast {
  // Impact reports can reach Gold; action reports cap at Silver.
  const isImpact = rc.type === "impact";

  let detailScore = 0;

  if (rc.problem_statement) detailScore++;
  if (rc.tags && rc.tags.length > 0) detailScore++;
  if (rc.results) detailScore++;
  if (rc.location) detailScore++;
  if (rc.activity_date) detailScore++;
  if (rc.notes) detailScore++;

  // Impact-specific fields
  const hasOutcomes = isImpact && !!rc.outcomes;
  const hasMetrics = isImpact && rc.metrics_value != null && rc.metrics_value > 0;
  const hasBaseline = isImpact && !!rc.baseline_description;

  if (hasOutcomes) detailScore += 2;
  if (hasMetrics) detailScore += 2;
  if (hasBaseline) detailScore++;

  // Gold: impact type with outcomes + metrics
  if (isImpact && hasOutcomes && hasMetrics) {
    const confidence = hasBaseline && detailScore >= 8 ? "high" : "medium";
    return {
      level: "gold",
      confidence,
      reason: "Impact report with measurable outcomes and metrics",
    };
  }

  // Silver: action type with evidence/context, or impact without full metrics
  if (isImpact && detailScore >= 3) {
    return {
      level: "silver",
      confidence: "medium",
      reason: "Impact report — add outcomes and metrics to reach Gold",
    };
  }

  if (!isImpact && detailScore >= 3) {
    return {
      level: "silver",
      confidence: detailScore >= 5 ? "high" : "medium",
      reason: "Action report with good supporting evidence",
    };
  }

  if (!isImpact && detailScore >= 1) {
    return {
      level: "silver",
      confidence: "low",
      reason: "Action report — add more detail to strengthen forecast",
    };
  }

  // Copper: bare minimum
  return {
    level: "copper",
    confidence: detailScore === 0 ? "low" : "medium",
    reason: isImpact
      ? "Impact report with minimal detail — add evidence to level up"
      : "Basic submission — add context and evidence to reach Silver",
  };
}
