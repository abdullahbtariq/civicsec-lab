import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button, ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { useAuth } from "../../hooks/useAuth";
import { generateSyntheticLogs, getLogLensOverview, runDetection } from "./api";
import { AnomalyTable } from "./components/AnomalyTable";
import { LogLensMetricCard } from "./components/LogLensMetricCard";
import type { LogLensOverview } from "./types";

export function LogLensOverviewPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<LogLensOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const canAct = user?.role === "admin" || user?.role === "analyst";

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOverview(await getLogLensOverview());
    } catch {
      setError("Could not load LogLens overview. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleGenerateLogs() {
    setIsActing(true);
    setActionMsg(null);
    try {
      const result = await generateSyntheticLogs(7, false);
      setActionMsg(`Generated ${result.total_created} synthetic events (batch ${result.batch_id}).`);
      void loadOverview();
    } catch {
      setActionMsg("Failed to generate logs.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleRunDetection() {
    setIsActing(true);
    setActionMsg(null);
    try {
      const result = await runDetection();
      setActionMsg(
        `Detection complete — ${result.detection.anomalies_created} new anomalies, ` +
          `${result.risk_events.risk_events_created} risk events created.`,
      );
      void loadOverview();
    } catch {
      setActionMsg("Detection run failed.");
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">LogLens</h1>
          <p className="mt-0.5 text-sm text-civic-muted">
            Suspicious login and behavioural anomaly detection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/modules/loglens/anomalies" variant="secondary">
            All Anomalies
          </ButtonLink>
          <ButtonLink to="/modules/loglens/upload" variant="secondary">
            Upload Logs
          </ButtonLink>
        </div>
      </div>

      {/* Responsible-use note */}
      <div className="rounded-lg border border-civic-line bg-[#14181d]/60 px-4 py-3 text-xs text-civic-muted">
        <span className="font-medium text-white">Human review required. </span>
        LogLens outputs are decision-support signals, not confirmed security incidents. All alerts
        require human verification before escalation.
      </div>

      {/* Analyst actions */}
      {canAct && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            disabled={isActing}
            onClick={() => void handleGenerateLogs()}
          >
            {isActing ? "Working…" : "Generate Synthetic Logs"}
          </Button>
          <Button
            variant="secondary"
            disabled={isActing}
            onClick={() => void handleRunDetection()}
          >
            {isActing ? "Working…" : "Run Detection"}
          </Button>
          {actionMsg && (
            <span className="text-xs text-civic-muted">{actionMsg}</span>
          )}
        </div>
      )}

      {isLoading && <LoadingState label="Loading LogLens data" />}
      {error && <ErrorState message={error} />}

      {overview && !isLoading && (
        <>
          {/* Metrics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <LogLensMetricCard label="Login Events" value={overview.total_events} />
            <LogLensMetricCard
              label="Open Anomalies"
              tone={overview.open_anomalies > 0 ? "rose" : "neutral"}
              value={overview.open_anomalies}
            />
            <LogLensMetricCard
              label="High / Critical"
              tone={overview.high_risk_count > 0 ? "rose" : "neutral"}
              value={overview.high_risk_count}
              badgeLabel="needs review"
            />
            <LogLensMetricCard
              label="Impossible Travel"
              tone={overview.impossible_travel_count > 0 ? "amber" : "neutral"}
              value={overview.impossible_travel_count}
            />
            <LogLensMetricCard
              label="Failed Login Bursts"
              tone={overview.failed_burst_count > 0 ? "amber" : "neutral"}
              value={overview.failed_burst_count}
            />
            <LogLensMetricCard
              label="Sensitive Access Alerts"
              tone={overview.sensitive_access_count > 0 ? "rose" : "neutral"}
              value={overview.sensitive_access_count}
            />
            <LogLensMetricCard label="Total Anomalies" value={overview.total_anomalies} />
          </section>

          {/* Top affected users */}
          {overview.top_affected_users.length > 0 && (
            <Card>
              <CardHeader title="Top Affected Accounts" />
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-civic-line text-xs uppercase tracking-wide text-civic-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Account</th>
                        <th className="px-4 py-2 text-right">Anomalies</th>
                        <th className="px-4 py-2 text-right">Max Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-civic-line">
                      {overview.top_affected_users.map((u) => (
                        <tr key={u.user_identifier} className="transition-colors hover:bg-[#20252b]">
                          <td className="px-4 py-2 font-mono text-xs text-white">
                            {u.user_identifier}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums font-bold text-civic-rose">
                            {u.anomaly_count}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-civic-muted">
                            {u.max_risk?.toFixed(0) ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest anomalies */}
          <Card>
            <CardHeader
              title="Latest Anomalies"
              action={
                <Link
                  to="/modules/loglens/anomalies"
                  className="text-xs font-medium text-civic-muted transition-colors hover:text-civic-teal"
                >
                  View all →
                </Link>
              }
            />
            <CardContent>
              <AnomalyTable anomalies={overview.latest_anomalies} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
