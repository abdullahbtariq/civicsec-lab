import { Badge } from "../../../components/ui/Badge";

const variantMap: Record<string, "neutral" | "sage" | "amber" | "rose" | "blue"> = {
  low:      "sage",   // sage green = low risk
  medium:   "amber",
  high:     "rose",
  critical: "rose",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant={variantMap[severity] ?? "neutral"}>
      {severity.toUpperCase()}
    </Badge>
  );
}
