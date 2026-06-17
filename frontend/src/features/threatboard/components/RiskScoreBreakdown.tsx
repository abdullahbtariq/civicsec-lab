import { Card, CardContent, CardHeader } from "../../../components/ui/Card";

const scoreRows = [
  ["Known exploited signal", "Up to 30 points from KEV-style metadata."],
  ["EPSS likelihood", "Up to 20 points from exploit probability percentile or score."],
  ["Asset criticality", "Up to 15 points based on asset importance."],
  ["Internet exposure", "15 points when the affected asset is internet-facing."],
  ["Data sensitivity", "Up to 10 points for confidential or sensitive data context."],
  ["Overdue remediation", "5 points when the due date has passed."],
  ["Match confidence", "Up to 5 points based on vendor/product match confidence."],
];

export function RiskScoreBreakdown() {
  return (
    <Card>
      <CardHeader
        description="The score is explainable decision support. Analysts still verify whether an asset is affected."
        title="Risk Scoring"
      />
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {scoreRows.map(([label, description]) => (
            <div className="rounded-lg border border-paper-line bg-paper-card p-4" key={label}>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="mt-2 text-xs leading-5 text-ink-soft">{description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
