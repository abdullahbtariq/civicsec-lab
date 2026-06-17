import { Badge } from "../../../components/ui/Badge";

const variantMap: Record<string, "neutral" | "sage" | "amber" | "rose" | "blue"> = {
  low: "sage",
  medium: "amber",
  high: "rose",
  critical: "rose",
};

export function FindingSeverityBadge({ severity, label }: { severity: string; label?: string }) {
  return (
    <Badge variant={variantMap[severity] ?? "neutral"}>
      {label ?? severity}
    </Badge>
  );
}
