/**
 * A simple horizontal bar showing sentiment score from -1 (hostile) to +1 (positive).
 */
export function SentimentBar({ score }: { score: number }) {
  // Map [-1, 1] to [0, 100]%
  const pct = Math.round(((score + 1) / 2) * 100);
  const color =
    score <= -0.3
      ? "bg-civic-rose"
      : score <= -0.1
        ? "bg-civic-amber"
        : score >= 0.2
          ? "bg-civic-sage"   // sage green = positive sentiment (orange is the UI accent, not a sentiment colour)
          : "bg-civic-muted";

  const label =
    score <= -0.3
      ? "Hostile"
      : score <= -0.1
        ? "Negative"
        : score >= 0.2
          ? "Positive"
          : "Neutral";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>{label}</span>
        <span>{score.toFixed(2)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-paper-line">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
