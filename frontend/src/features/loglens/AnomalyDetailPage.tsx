import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { getAnomaly, updateAnomalyStatus } from "./api";
import { AnomalyStatusBadge } from "./components/AnomalyStatusBadge";
import { SeverityBadge } from "./components/SeverityBadge";
import type { LoginAnomaly } from "./types";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "escalated", label: "Escalated" },
  { value: "dismissed", label: "Dismissed" },
  { value: "false_positive", label: "False positive" },
];

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-2 border-b border-neutral-800 last:border-0">
      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide self-start pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-neutral-200">{children}</dd>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const SCORE_CLASS = (score: number) =>
  score >= 70 ? "text-rose-400" : score >= 45 ? "text-amber-400" : "text-neutral-400";

export function AnomalyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAct = user?.role === "admin" || user?.role === "analyst";

  const [anomaly, setAnomaly] = useState<LoginAnomaly | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getAnomaly(id)
      .then((data) => {
        setAnomaly(data);
        setSelectedStatus(data.status);
      })
      .catch(() => setError("Could not load anomaly."))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleStatusUpdate() {
    if (!id || !selectedStatus) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateAnomalyStatus(id, selectedStatus);
      setAnomaly(updated);
      setSaveMsg("Status updated.");
    } catch {
      setSaveMsg("Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-neutral-500">Loading anomaly…</div>;
  }
  if (error || !anomaly) {
    return (
      <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
        {error ?? "Anomaly not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <nav className="mb-2 text-xs text-neutral-500">
          <Link to="/modules/loglens" className="hover:text-neutral-300">
            LogLens
          </Link>{" "}
          /{" "}
          <Link to="/modules/loglens/anomalies" className="hover:text-neutral-300">
            Anomalies
          </Link>{" "}
          / #{anomaly.id}
        </nav>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-100">{anomaly.title}</h1>
            <p className="mt-1 text-sm text-neutral-400">{anomaly.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={anomaly.severity} />
            <AnomalyStatusBadge status={anomaly.status} statusDisplay={anomaly.status_display} />
          </div>
        </div>
      </div>

      {/* Responsible-use note */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-xs text-neutral-500">
        <span className="font-medium text-neutral-400">Human verification required. </span>
        Evidence suggests a potential pattern — confidence scores indicate likelihood, not certainty.
        Review all supporting evidence before taking action.
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Risk Score</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${SCORE_CLASS(anomaly.risk_score)}`}>
            {anomaly.risk_score}
          </p>
          <p className="mt-0.5 text-[10px] text-neutral-600">out of 100</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Confidence</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-200">
            {(anomaly.confidence * 100).toFixed(0)}%
          </p>
          <p className="mt-0.5 text-[10px] text-neutral-600">{anomaly.confidence_band}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Linked Events</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-200">
            {anomaly.linked_event_count}
          </p>
          <p className="mt-0.5 text-[10px] text-neutral-600">login records</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Risk Event</p>
          {anomaly.risk_event ? (
            <Link
              to={`/risk-events/${anomaly.risk_event}`}
              className="mt-1 block text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              #{anomaly.risk_event} →
            </Link>
          ) : (
            <p className="mt-1 text-sm text-neutral-600">None (below threshold)</p>
          )}
        </div>
      </div>

      {/* Detail fields */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="border-b border-neutral-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-300">Anomaly Details</h2>
        </div>
        <dl className="px-4">
          <InfoRow label="Account">{anomaly.user_identifier}</InfoRow>
          <InfoRow label="Type">{anomaly.anomaly_type_display}</InfoRow>
          <InfoRow label="Start time">{formatDate(anomaly.start_time)}</InfoRow>
          <InfoRow label="End time">{formatDate(anomaly.end_time)}</InfoRow>
          {anomaly.mitre_tactic && (
            <InfoRow label="MITRE Tactic">
              <span className="font-mono text-xs">{anomaly.mitre_tactic}</span>
            </InfoRow>
          )}
          {anomaly.mitre_technique && (
            <InfoRow label="MITRE Technique">
              <span className="font-mono text-xs">{anomaly.mitre_technique}</span>
            </InfoRow>
          )}
        </dl>
      </div>

      {/* Evidence detail */}
      {anomaly.evidence_detail && Object.keys(anomaly.evidence_detail).length > 0 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-neutral-300">Evidence Detail</h2>
            <p className="mt-0.5 text-xs text-neutral-600">
              Raw evidence supporting this detection. Requires review.
            </p>
          </div>
          <div className="p-4">
            <pre className="overflow-x-auto rounded-md bg-neutral-950 p-4 text-xs text-neutral-300 leading-relaxed">
              {JSON.stringify(anomaly.evidence_detail, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Status update */}
      {canAct && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Update Status</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              disabled={isSaving || selectedStatus === anomaly.status}
              onClick={() => void handleStatusUpdate()}
              className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving…" : "Save Status"}
            </button>
            {saveMsg && <span className="text-xs text-neutral-400">{saveMsg}</span>}
          </div>
        </div>
      )}

      <div className="flex gap-3 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← Back
        </button>
        <Link
          to="/modules/loglens/anomalies"
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          All Anomalies
        </Link>
      </div>
    </div>
  );
}
