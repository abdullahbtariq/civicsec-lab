import { Badge } from "./Badge";

const severityVariant = {
  info:     "blue",
  low:      "sage",    // green = low risk
  medium:   "amber",   // gold
  high:     "teal",    // orange (brand accent)
  critical: "rose",    // red
} as const;

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant={severityVariant[severity as keyof typeof severityVariant] ?? "neutral"}>
      {severity.replace("_", " ")}
    </Badge>
  );
}
