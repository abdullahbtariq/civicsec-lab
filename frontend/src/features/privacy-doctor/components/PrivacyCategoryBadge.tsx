interface Props {
  category: string;
  label?: string;
}

const categoryConfig: Record<string, string> = {
  direct_identifier: "border-rose-800 bg-rose-950/40 text-rose-300",
  quasi_identifier: "border-amber-700 bg-amber-950/40 text-amber-300",
  sensitive_attribute: "border-purple-800 bg-purple-950/40 text-purple-300",
  free_text_risk: "border-orange-700 bg-orange-950/40 text-orange-300",
  low_risk: "border-green-800 bg-green-950/40 text-green-300",
  unknown: "border-neutral-700 bg-neutral-900 text-neutral-500",
};

export function PrivacyCategoryBadge({ category, label }: Props) {
  const classes =
    categoryConfig[category] ?? "border-neutral-700 bg-neutral-900 text-neutral-400";
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label ?? category}
    </span>
  );
}
