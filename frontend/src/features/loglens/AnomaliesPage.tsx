import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAnomalies } from "./api";
import { AnomalyTable } from "./components/AnomalyTable";
import type { AnomalyParams, LoginAnomaly } from "./types";

const ANOMALY_TYPES = [
  { value: "", label: "All types" },
  { value: "failed_login_burst", label: "Failed login burst" },
  { value: "suspicious_success_after_failures", label: "Success after failures" },
  { value: "impossible_travel", label: "Impossible travel" },
  { value: "new_device", label: "New device" },
  { value: "unusual_time", label: "Unusual time" },
  { value: "sensitive_access_after_anomaly", label: "Sensitive access" },
];

const SEVERITIES = [
  { value: "", label: "All severities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "escalated", label: "Escalated" },
  { value: "dismissed", label: "Dismissed" },
  { value: "false_positive", label: "False positive" },
];

export function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<LoginAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<AnomalyParams>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAnomalies(await getAnomalies(params));
    } catch {
      setError("Could not load anomalies.");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  function setParam(key: keyof AnomalyParams, value: string) {
    setParams((prev) => ({ ...prev, [key]: value || undefined }));
  }

  const selectClass =
    "rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-600";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-neutral-500">
            <Link to="/modules/loglens" className="hover:text-neutral-300">
              LogLens
            </Link>{" "}
            / Anomalies
          </nav>
          <h1 className="text-xl font-semibold text-neutral-100">Login Anomalies</h1>
          <p className="mt-0.5 text-sm text-neutral-400">
            All detected anomaly patterns — review and triage.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className={selectClass} onChange={(e) => setParam("anomaly_type", e.target.value)}>
          {ANOMALY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select className={selectClass} onChange={(e) => setParam("severity", e.target.value)}>
          {SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select className={selectClass} onChange={(e) => setParam("status", e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          className={selectClass}
          placeholder="Filter by user…"
          type="text"
          onChange={(e) => setParam("user_identifier", e.target.value)}
        />
      </div>

      {/* Responsible-use note */}
      <p className="text-xs text-neutral-600">
        Outputs are decision-support signals. Human verification is required before escalation.
      </p>

      {isLoading && (
        <div className="py-8 text-center text-sm text-neutral-500">Loading anomalies…</div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {!isLoading && !error && <AnomalyTable anomalies={anomalies} />}
    </div>
  );
}
