import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
          <h1 className="text-xl font-semibold text-neutral-100">LogLens</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            Suspicious login and behavioural anomaly detection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/modules/loglens/anomalies"
            className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            All Anomalies
          </Link>
          <Link
            to="/modules/loglens/upload"
            className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            Upload Logs
          </Link>
        </div>
      </div>

      {/* Responsible-use note */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-xs text-neutral-500">
        <span className="font-medium text-neutral-400">Human review required. </span>
        LogLens outputs are decision-support signals, not confirmed security incidents. All alerts
        require human verification before escalation.
      </div>

      {/* Analyst actions */}
      {canAct && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={isActing}
            onClick={() => void handleGenerateLogs()}
            className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isActing ? "Working…" : "Generate Synthetic Logs"}
          </button>
          <button
            disabled={isActing}
            onClick={() => void handleRunDetection()}
            className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isActing ? "Working…" : "Run Detection"}
          </button>
          {actionMsg && (
            <span className="text-xs text-neutral-400">{actionMsg}</span>
          )}
        </div>
      )}

      {/* Loading / Error */}
      {isLoading && (
        <div className="py-12 text-center text-sm text-neutral-500">Loading LogLens data…</div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

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
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
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
            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-300">Top Affected Accounts</h2>
              <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-800 bg-neutral-900/80 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Account</th>
                      <th className="px-4 py-2 text-right">Anomalies</th>
                      <th className="px-4 py-2 text-right">Avg Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 bg-neutral-950">
                    {overview.top_affected_users.map((u) => (
                      <tr key={u.user_identifier}>
                        <td className="px-4 py-2 font-mono text-xs text-neutral-200">
                          {u.user_identifier}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-rose-400 font-bold">
                          {u.anomaly_count}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-neutral-400">
                          {u.max_risk?.toFixed(0) ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Latest anomalies */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-300">Latest Anomalies</h2>
              <Link
                to="/modules/loglens/anomalies"
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                View all →
              </Link>
            </div>
            <AnomalyTable anomalies={overview.latest_anomalies} />
          </section>
        </>
      )}
    </div>
  );
}
