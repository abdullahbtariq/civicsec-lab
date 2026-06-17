import { Badge } from "../../../components/ui/Badge";

const variantMap: Record<string, "neutral" | "sage" | "amber" | "rose" | "blue"> = {
  direct_identifier:   "rose",
  quasi_identifier:    "amber",
  sensitive_attribute: "blue",
  free_text_risk:      "rose",
  low_risk:            "sage",  // sage green = low/safe risk category
  unknown:             "neutral",
};

export function PrivacyCategoryBadge({ category, label }: { category: string; label?: string }) {
  return (
    <Badge variant={variantMap[category] ?? "neutral"}>
      {label ?? category}
    </Badge>
  );
}
