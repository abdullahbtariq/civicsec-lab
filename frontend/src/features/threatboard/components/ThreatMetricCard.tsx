import type { ReactNode } from "react";

import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent } from "../../../components/ui/Card";

export function ThreatMetricCard({
  label,
  value,
  tone = "neutral",
  helper,
  badgeLabel,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "teal" | "amber" | "rose" | "blue";
  helper?: ReactNode;
  badgeLabel?: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm text-ink-soft">{label}</p>
          {badgeLabel ? <Badge variant={tone}>{badgeLabel}</Badge> : null}
        </div>
        <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
        {helper ? <div className="mt-3 text-xs leading-5 text-ink-soft">{helper}</div> : null}
      </CardContent>
    </Card>
  );
}
