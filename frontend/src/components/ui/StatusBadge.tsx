import { Badge } from "./Badge";

const statusVariant: Record<string, "neutral" | "teal" | "amber" | "rose" | "blue" | "sage"> = {
  // Informational / queued
  new:                   "blue",
  queued:                "blue",
  open:                  "blue",
  // In-progress / partial
  running:               "amber",
  triaged:               "amber",
  investigating:         "amber",
  contained:             "amber",
  completed_with_errors: "amber",
  // Positive / resolved — sage (green) is the semantic success color
  resolved:              "sage",
  completed:             "sage",
  closed:                "sage",
  done:                  "sage",
  // Errors / failed
  failed:                "rose",
  // Neutral / withdrawn
  dismissed:             "neutral",
  false_positive:        "neutral",
  cancelled:             "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Badge>;
}
