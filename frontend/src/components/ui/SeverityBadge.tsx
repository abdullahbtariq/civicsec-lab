import { Badge } from "./Badge";

const severityVariant = {
  info: "blue",
  low: "teal",
  medium: "amber",
  high: "rose",
  critical: "rose",
} as const;

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant={severityVariant[severity as keyof typeof severityVariant] ?? "neutral"}>
      {severity.replace("_", " ")}
    </Badge>
  );
}
