import { Badge } from "../../../components/ui/Badge";

const config: Record<string, { label: string; variant: "neutral" | "sage" | "amber" | "rose" }> = {
  low: { label: "Low", variant: "sage" },
  moderate: { label: "Moderate", variant: "amber" },
  high: { label: "High", variant: "rose" },
  severe: { label: "Severe", variant: "rose" },
};

export function RiskBandBadge({ band, score }: { band: string; score?: number }) {
  const c = config[band] ?? { label: band || "—", variant: "neutral" as const };
  return (
    <Badge variant={c.variant}>
      {c.label}{score !== undefined && ` (${score}/100)`}
    </Badge>
  );
}
