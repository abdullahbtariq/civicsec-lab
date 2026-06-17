import { Badge } from "../../../components/ui/Badge";

const variantMap: Record<string, "neutral" | "amber" | "rose" | "blue"> = {
  new: "rose",
  reviewed: "blue",
  escalated: "amber",
  dismissed: "neutral",
  false_positive: "neutral",
};

export function AnomalyStatusBadge({ status, statusDisplay }: { status: string; statusDisplay: string }) {
  return (
    <Badge variant={variantMap[status] ?? "neutral"}>
      {statusDisplay}
    </Badge>
  );
}
