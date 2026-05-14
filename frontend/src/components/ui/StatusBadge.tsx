import { Badge } from "./Badge";

const statusVariant: Record<string, "neutral" | "teal" | "amber" | "rose" | "blue"> = {
  new: "blue",
  queued: "blue",
  running: "amber",
  triaged: "amber",
  investigating: "amber",
  open: "blue",
  contained: "amber",
  resolved: "teal",
  completed: "teal",
  closed: "teal",
  done: "teal",
  dismissed: "neutral",
  false_positive: "neutral",
  failed: "rose",
  cancelled: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant[status] ?? "neutral"}>{status.replace("_", " ")}</Badge>;
}
