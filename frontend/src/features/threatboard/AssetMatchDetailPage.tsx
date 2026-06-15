import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { ConfidenceBadge } from "../../components/ui/ConfidenceBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { RiskScoreBadge } from "../../components/ui/RiskScoreBadge";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatDateTime, formatLabel } from "../../lib/utils";
import { getAssetMatch } from "./api";
import { ThreatBoardTabs } from "./components/ThreatBoardTabs";
import type { AssetVulnerabilityMatch } from "./types";
import { formatPercent } from "./utils";

const nextSteps = [
  "Confirm whether the asset is affected.",
  "Review vendor guidance.",
  "Apply patch or mitigation if affected.",
  "Review logs for suspicious activity if exposure is high.",
  "Update remediation status once verified.",
];

export function AssetMatchDetailPage() {
  const { id } = useParams();
  const [match, setMatch] = useState<AssetVulnerabilityMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatch() {
      if (!id) {
        setError("Missing match identifier.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        setMatch(await getAssetMatch(id));
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Could not load asset match.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadMatch();
  }, [id]);

  if (isLoading) return <LoadingState label="Loading asset match" />;
  if (error) return <ErrorState message={error} />;
  if (!match) return <EmptyState description="The requested match could not be found." title="Not found" />;

  return (
    <div className="space-y-6">
      <div>
        <nav className="mb-1 text-xs text-civic-muted">
          <Link to="/modules/threatboard" className="transition-colors hover:text-white">
            ThreatBoard
          </Link>
          {" / "}
          <Link to="/modules/threatboard/matches" className="transition-colors hover:text-white">
            Asset Matches
          </Link>
          {" / "}{match.vulnerability.cve_id}
        </nav>
        <h1 className="font-display text-xl font-semibold text-white">
          {match.vulnerability.cve_id} × {match.asset.name}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <SeverityBadge severity={match.risk_band} />
          <StatusBadge status={match.status} />
          <RiskScoreBadge score={match.calculated_risk_score} />
        </div>
      </div>
      <ThreatBoardTabs />

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            action={
              <ButtonLink to={`/assets/${match.asset.id}`} variant="secondary">
                Open asset
              </ButtonLink>
            }
            description="Organisation asset context used in prioritisation."
            title={match.asset.name}
          />
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Detail label="Type" value={formatLabel(match.asset.asset_type)} />
            <Detail label="Criticality" value={<SeverityBadge severity={match.asset.criticality} />} />
            <Detail label="Internet exposure" value={match.asset.internet_exposed ? "Exposed" : "Not exposed"} />
            <Detail label="Data sensitivity" value={formatLabel(match.asset.data_sensitivity)} />
            <Detail label="Vendor" value={match.asset.vendor || "Not set"} />
            <Detail label="Product" value={match.asset.product || "Not set"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            action={
              <Link
                className="text-sm font-semibold text-civic-teal"
                to={`/modules/threatboard/vulnerabilities/${match.vulnerability.id}`}
              >
                Open vulnerability
              </Link>
            }
            description={match.vulnerability.title}
            title={match.vulnerability.cve_id}
          />
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Detail label="Vendor" value={match.vulnerability.vendor || "Not set"} />
            <Detail label="Product" value={match.vulnerability.product || "Not set"} />
            <Detail label="EPSS percentile" value={formatPercent(match.vulnerability.score?.epss_percentile)} />
            <Detail
              label="Known exploited"
              value={match.vulnerability.score?.kev_known_exploited ? <Badge variant="rose">Yes</Badge> : <Badge>No</Badge>}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader description="Explainable match and score context." title="Risk Assessment" />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Detail label="Risk score" value={<RiskScoreBadge score={match.calculated_risk_score} />} />
          <Detail label="Risk band" value={<SeverityBadge severity={match.risk_band} />} />
          <Detail label="Confidence" value={<ConfidenceBadge confidence={match.match_confidence} />} />
          <Detail label="Exposure score" value={match.exposure_score} />
          <Detail label="Match method" value={formatLabel(match.match_method)} />
          <Detail label="Status" value={<StatusBadge status={match.status} />} />
          <Detail label="Remediation" value={<Badge variant="amber">{formatLabel(match.remediation_status)}</Badge>} />
          <Detail label="Last seen" value={formatDateTime(match.last_seen_at)} />
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Explanation" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              {match.explanation || "No explanation was recorded for this match."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Defensive Next Steps" />
          <CardContent>
            <ol className="grid gap-3">
              {nextSteps.map((step) => (
                <li className="rounded-lg border border-civic-line bg-[#14181d] p-3 text-sm text-civic-muted" key={step}>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-civic-line bg-[#14181d] p-4">
      <p className="text-xs uppercase text-civic-muted">{label}</p>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
