import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { getThreatBoardOverview } from "./api";
import { AssetMatchTable } from "./components/AssetMatchTable";
import { IngestionRunTable } from "./components/IngestionRunTable";
import { RiskScoreBreakdown } from "./components/RiskScoreBreakdown";
import { ThreatBoardActionPanel } from "./components/ThreatBoardActionPanel";
import { ThreatBoardHeader } from "./components/ThreatBoardHeader";
import { ThreatBoardTabs } from "./components/ThreatBoardTabs";
import { ThreatMetricCard } from "./components/ThreatMetricCard";
import type { ThreatBoardOverview } from "./types";

export function ThreatBoardOverviewPage() {
  const [overview, setOverview] = useState<ThreatBoardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOverview(await getThreatBoardOverview());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load ThreatBoard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  return (
    <div className="space-y-6">
      <ThreatBoardHeader
        subtitle="Vulnerability intelligence and exposure prioritisation for civic organisations."
        title="ThreatBoard"
      />
      <ThreatBoardTabs />

      {isLoading ? <LoadingState label="Loading ThreatBoard overview" /> : null}
      {error ? <ErrorState message={error} /> : null}

      {overview ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <ThreatMetricCard label="Total Vulnerabilities" value={overview.vulnerability_count} />
            <ThreatMetricCard
              badgeLabel="KEV"
              label="Known Exploited"
              tone="rose"
              value={overview.kev_vulnerability_count}
            />
            <ThreatMetricCard
              badgeLabel="scoped"
              label="Asset Matches"
              tone="blue"
              value={overview.asset_match_count}
            />
            <ThreatMetricCard
              badgeLabel="critical"
              label="Critical Matches"
              tone="rose"
              value={overview.critical_match_count}
            />
            <ThreatMetricCard
              badgeLabel="high"
              label="High Matches"
              tone="amber"
              value={overview.high_match_count}
            />
            <ThreatMetricCard
              badgeLabel="overdue"
              label="Overdue Matches"
              tone="amber"
              value={overview.overdue_match_count}
            />
          </section>

          <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
            <Card>
              <CardHeader
                action={
                  <ButtonLink to="/modules/threatboard/matches" variant="secondary">
                    View all
                  </ButtonLink>
                }
                description="Most recent organisation-scoped asset vulnerability matches."
                title="Latest Asset Matches"
              />
              <CardContent>
                {overview.latest_matches.length ? (
                  <AssetMatchTable matches={overview.latest_matches} />
                ) : (
                  <EmptyState
                    description="Run matching after adding assets or ingesting vulnerability metadata."
                    title="No asset matches yet"
                  />
                )}
              </CardContent>
            </Card>

            <ThreatBoardActionPanel onActionComplete={() => void loadOverview()} />
          </div>

          <Card>
            <CardHeader
              action={
                <Link className="text-sm font-semibold text-civic-teal" to="/modules/threatboard/ingestion-runs">
                  View runs
                </Link>
              }
              description="Recent ingestion, enrichment, and matching activity."
              title="Latest Ingestion Runs"
            />
            <CardContent>
              {overview.latest_ingestion_runs.length ? (
                <IngestionRunTable runs={overview.latest_ingestion_runs} />
              ) : (
                <EmptyState
                  description="Ingestion and matching runs will appear here once analysts trigger ThreatBoard jobs."
                  title="No ingestion runs yet"
                />
              )}
            </CardContent>
          </Card>

          <RiskScoreBreakdown />
        </>
      ) : null}
    </div>
  );
}
