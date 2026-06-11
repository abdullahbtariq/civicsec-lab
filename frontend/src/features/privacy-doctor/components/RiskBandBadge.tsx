interface Props {
  band: string;
  score?: number;
}

const bandConfig: Record<string, { label: string; classes: string }> = {
  low: { label: "Low", classes: "border-green-800 bg-green-950/40 text-green-300" },
  moderate: { label: "Moderate", classes: "border-amber-700 bg-amber-950/40 text-amber-300" },
  high: { label: "High", classes: "border-orange-700 bg-orange-950/40 text-orange-300" },
  severe: { label: "Severe", classes: "border-rose-800 bg-rose-950/40 text-rose-300" },
};

export function RiskBandBadge({ band, score }: Props) {
  const config = bandConfig[band] ?? {
    label: band || "—",
    classes: "border-neutral-700 bg-neutral-900 text-neutral-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold ${config.classes}`}
    >
      {config.label}
      {score !== undefined && (
        <span className="opacity-70 font-normal">({score}/100)</span>
      )}
    </span>
  );
}
