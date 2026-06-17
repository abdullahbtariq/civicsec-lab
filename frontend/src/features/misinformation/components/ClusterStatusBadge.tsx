import { Badge } from "../../../components/ui/Badge";

type ClusterStatus =
  | "unreviewed"
  | "needs_review"
  | "reviewed_benign"
  | "reviewed_concerning"
  | "escalated";

const VARIANT_MAP: Record<ClusterStatus, "neutral" | "amber" | "sage" | "rose" | "blue"> = {
  unreviewed:          "neutral",
  needs_review:        "amber",
  reviewed_benign:     "sage",   // green = positive / benign outcome
  reviewed_concerning: "rose",
  escalated:           "rose",
};

const LABEL_MAP: Record<ClusterStatus, string> = {
  unreviewed: "Unreviewed",
  needs_review: "Needs review",
  reviewed_benign: "Benign",
  reviewed_concerning: "Concerning",
  escalated: "Escalated",
};

export function ClusterStatusBadge({ status }: { status: string }) {
  const s = status as ClusterStatus;
  return <Badge variant={VARIANT_MAP[s] ?? "neutral"}>{LABEL_MAP[s] ?? status}</Badge>;
}
