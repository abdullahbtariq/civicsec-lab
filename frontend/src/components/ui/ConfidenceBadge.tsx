import { Badge } from "./Badge";

function bandForConfidence(value?: number | null) {
  if (value === null || value === undefined) {
    return { label: "not set", variant: "neutral" as const };
  }
  if (value < 0.4) {
    return { label: "low", variant: "neutral" as const };
  }
  if (value < 0.7) {
    return { label: "medium", variant: "amber" as const };
  }
  if (value < 0.9) {
    return { label: "high", variant: "blue" as const };
  }
  return { label: "very high", variant: "sage" as const };
}

export function ConfidenceBadge({ confidence }: { confidence?: number | null }) {
  const band = bandForConfidence(confidence);
  const percent = confidence === null || confidence === undefined ? "" : ` ${Math.round(confidence * 100)}%`;
  return <Badge variant={band.variant}>{`${band.label}${percent}`}</Badge>;
}
