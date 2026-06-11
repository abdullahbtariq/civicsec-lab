interface Props {
  label: string;
  value: number | string;
  tone?: "neutral" | "rose" | "amber" | "blue" | "green";
  badgeLabel?: string;
}

const toneClasses: Record<string, string> = {
  neutral: "border-neutral-700 bg-neutral-900",
  rose: "border-rose-800 bg-rose-950/40",
  amber: "border-amber-800 bg-amber-950/40",
  blue: "border-blue-800 bg-blue-950/40",
  green: "border-green-800 bg-green-950/40",
};

const valueClasses: Record<string, string> = {
  neutral: "text-neutral-100",
  rose: "text-rose-300",
  amber: "text-amber-300",
  blue: "text-blue-300",
  green: "text-green-300",
};

export function LogLensMetricCard({ label, value, tone = "neutral", badgeLabel }: Props) {
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
        {badgeLabel && (
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">
            {badgeLabel}
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueClasses[tone]}`}>{value}</p>
    </div>
  );
}
