import { Link } from "react-router-dom";

import type { LoginAnomaly } from "../types";
import { AnomalyStatusBadge } from "./AnomalyStatusBadge";
import { SeverityBadge } from "./SeverityBadge";

interface Props {
  anomalies: LoginAnomaly[];
}

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  failed_login_burst: "Failed login burst",
  suspicious_success_after_failures: "Success after failures",
  impossible_travel: "Impossible travel",
  new_device: "New device",
  unusual_time: "Unusual time",
  sensitive_access_after_anomaly: "Sensitive access",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnomalyTable({ anomalies }: Props) {
  if (anomalies.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-12 text-center">
        <p className="text-sm text-neutral-400">No anomalies found.</p>
        <p className="mt-1 text-xs text-neutral-600">
          Generate synthetic logs or upload a CSV, then run detection.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-800 bg-neutral-900/80 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3 text-left">User</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Severity</th>
            <th className="px-4 py-3 text-right">Risk</th>
            <th className="px-4 py-3 text-left">Confidence</th>
            <th className="px-4 py-3 text-left">Detected</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800 bg-neutral-950">
          {anomalies.map((a) => (
            <tr key={a.id} className="hover:bg-neutral-900/60 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-neutral-200">{a.user_identifier}</td>
              <td className="px-4 py-3 text-neutral-300">
                {ANOMALY_TYPE_LABELS[a.anomaly_type] ?? a.anomaly_type_display}
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={a.severity} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                <span className={`font-bold ${a.risk_score >= 70 ? "text-rose-400" : a.risk_score >= 45 ? "text-amber-400" : "text-neutral-400"}`}>
                  {a.risk_score}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-400">
                {(a.confidence * 100).toFixed(0)}%
              </td>
              <td className="px-4 py-3 text-neutral-500 text-xs">{formatDate(a.start_time)}</td>
              <td className="px-4 py-3">
                <AnomalyStatusBadge status={a.status} statusDisplay={a.status_display} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/modules/loglens/anomalies/${a.id}`}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
