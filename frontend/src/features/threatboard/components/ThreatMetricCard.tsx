import type { ReactNode } from "react";

import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent } from "../../../components/ui/Card";

export function ThreatMetricCard({
  label,
  value,
  tone = "neutral",
  helper,
  badgeLabel = "live data",
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
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-civic-muted">{label}</p>
          <Badge variant={tone}>{badgeLabel}</Badge>
        </div>
        <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        {helper ? <div className="mt-3 text-xs leading-5 text-civic-muted">{helper}</div> : null}
      </CardContent>
    </Card>
  );
}
