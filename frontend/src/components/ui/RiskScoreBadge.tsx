import { Badge } from "./Badge";

function variantForScore(score: number) {
  if (score <= 20) return "teal";
  if (score <= 45) return "amber";
  if (score <= 70) return "rose";
  return "rose";
}

function labelForScore(score: number) {
  if (score <= 20) return "low";
  if (score <= 45) return "medium";
  if (score <= 70) return "high";
  return "critical";
}

export function RiskScoreBadge({ score }: { score: number }) {
  return <Badge variant={variantForScore(score)}>{`${score} ${labelForScore(score)}`}</Badge>;
}
