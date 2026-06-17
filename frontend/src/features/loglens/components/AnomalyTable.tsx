import { Link } from "react-router-dom";

import { EmptyState } from "../../../components/ui/EmptyState";
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
      <EmptyState
        title="No anomalies found"
        description="Generate synthetic logs or upload a CSV, then run detection."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-paper-line">
      <table className="w-full text-sm">
        <thead className="border-b border-paper-line bg-paper text-xs uppercase tracking-wide text-ink-soft">
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
        <tbody className="divide-y divide-paper-line bg-paper-card">
          {anomalies.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-paper-raise">
              <td className="px-4 py-3 font-mono text-xs text-ink">{a.user_identifier}</td>
              <td className="px-4 py-3 text-ink-soft">
                {ANOMALY_TYPE_LABELS[a.anomaly_type] ?? a.anomaly_type_display}
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={a.severity} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                <span
                  className={`font-bold ${
                    a.risk_score >= 70
                      ? "text-rose-ink"
                      : a.risk_score >= 45
                        ? "text-gold-ink"
                        : "text-ink-soft"
                  }`}
                >
                  {a.risk_score}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-soft">
                {(a.confidence * 100).toFixed(0)}%
              </td>
              <td className="px-4 py-3 text-xs text-ink-soft">{formatDate(a.start_time)}</td>
              <td className="px-4 py-3">
                <AnomalyStatusBadge status={a.status} statusDisplay={a.status_display} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/modules/loglens/anomalies/${a.id}`}
                  className="text-xs text-orange-ink transition-colors hover:underline"
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
