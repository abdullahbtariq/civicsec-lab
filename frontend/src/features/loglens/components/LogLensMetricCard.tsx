import { Card, CardContent } from "../../../components/ui/Card";

interface Props {
  label: string;
  value: number | string;
  tone?: "neutral" | "rose" | "amber";
  badgeLabel?: string;
}

const valueClasses: Record<string, string> = {
  neutral: "text-ink",
  rose: "text-rose-ink",
  amber: "text-gold-ink",
};

export function LogLensMetricCard({ label, value, tone = "neutral", badgeLabel }: Props) {
  const isZero = value === 0;
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
          {badgeLabel && (
            <span className="shrink-0 whitespace-nowrap rounded bg-paper-line px-1.5 py-0.5 text-[10px] text-ink-soft">
              {badgeLabel}
            </span>
          )}
        </div>
        <p className={`mt-2 text-2xl font-bold tabular-nums ${isZero ? "text-ink-soft" : valueClasses[tone]}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
