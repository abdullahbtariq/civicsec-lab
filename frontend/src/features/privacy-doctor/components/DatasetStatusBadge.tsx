import { Badge } from "../../../components/ui/Badge";

const variantMap: Record<string, "neutral" | "sage" | "amber" | "rose" | "blue"> = {
  pending:    "neutral",
  processing: "amber",
  complete:   "sage",   // sage green = successful completion
  failed:     "rose",
};

export function DatasetStatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <Badge variant={variantMap[status] ?? "neutral"}>
      {label ?? status}
    </Badge>
  );
}
