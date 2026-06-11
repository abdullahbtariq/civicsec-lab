interface Props {
  severity: string;
}

const colours: Record<string, string> = {
  low: "bg-blue-900/40 text-blue-300 border border-blue-700",
  medium: "bg-amber-900/40 text-amber-300 border border-amber-700",
  high: "bg-orange-900/40 text-orange-300 border border-orange-700",
  critical: "bg-rose-900/40 text-rose-300 border border-rose-700",
};

export function SeverityBadge({ severity }: Props) {
  const classes = colours[severity] ?? "bg-neutral-800 text-neutral-400 border border-neutral-700";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${classes}`}>
      {severity.toUpperCase()}
    </span>
  );
}
