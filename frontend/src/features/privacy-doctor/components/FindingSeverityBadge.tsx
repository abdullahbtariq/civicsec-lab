interface Props {
  severity: string;
  label?: string;
}

const severityConfig: Record<string, string> = {
  low: "border-green-800 bg-green-950/40 text-green-300",
  medium: "border-amber-700 bg-amber-950/40 text-amber-300",
  high: "border-orange-700 bg-orange-950/40 text-orange-300",
  critical: "border-rose-800 bg-rose-950/40 text-rose-300",
};

export function FindingSeverityBadge({ severity, label }: Props) {
  const classes =
    severityConfig[severity] ?? "border-neutral-700 bg-neutral-900 text-neutral-400";
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${classes}`}>
      {label ?? severity}
    </span>
  );
}
