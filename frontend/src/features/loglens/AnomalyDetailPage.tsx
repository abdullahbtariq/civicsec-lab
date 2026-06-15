import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
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
  score >= 70 ? "text-civic-rose" : score >= 45 ? "text-civic-amber" : "text-civic-muted";

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

  if (isLoading) return <LoadingState label="Loading anomaly" />;
  if (error || !anomaly) return <ErrorState message={error ?? "Anomaly not found."} />;

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div>
        <nav className="mb-1 text-xs text-civic-muted">
          <Link to="/modules/loglens" className="transition-colors hover:text-white">
            LogLens
          </Link>{" "}
          /{" "}
          <Link to="/modules/loglens/anomalies" className="transition-colors hover:text-white">
            Anomalies
          </Link>{" "}
          / #{anomaly.id}
        </nav>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-white">{anomaly.title}</h1>
            <p className="mt-1 text-sm text-civic-muted">{anomaly.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={anomaly.severity} />
            <AnomalyStatusBadge status={anomaly.status} statusDisplay={anomaly.status_display} />
          </div>
        </div>
      </div>

      {/* Responsible-use note */}
      <div className="rounded-lg border border-civic-line bg-[#14181d]/60 px-4 py-3 text-xs text-civic-muted">
        <span className="font-medium text-white">Human verification required. </span>
        Evidence suggests a potential pattern — confidence scores indicate likelihood, not certainty.
        Review all supporting evidence before taking action.
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-civic-line bg-[#14181d] p-3">
          <p className="text-[10px] uppercase tracking-wide text-civic-muted">Risk Score</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${SCORE_CLASS(anomaly.risk_score)}`}>
            {anomaly.risk_score}
          </p>
          <p className="mt-0.5 text-[10px] text-civic-muted">out of 100</p>
        </div>
        <div className="rounded-lg border border-civic-line bg-[#14181d] p-3">
          <p className="text-[10px] uppercase tracking-wide text-civic-muted">Confidence</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {(anomaly.confidence * 100).toFixed(0)}%
          </p>
          <p className="mt-0.5 text-[10px] text-civic-muted">{anomaly.confidence_band}</p>
        </div>
        <div className="rounded-lg border border-civic-line bg-[#14181d] p-3">
          <p className="text-[10px] uppercase tracking-wide text-civic-muted">Linked Events</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {anomaly.linked_event_count}
          </p>
          <p className="mt-0.5 text-[10px] text-civic-muted">login records</p>
        </div>
        <div className="rounded-lg border border-civic-line bg-[#14181d] p-3">
          <p className="text-[10px] uppercase tracking-wide text-civic-muted">Risk Event</p>
          {anomaly.risk_event ? (
            <Link
              to={`/risk-events/${anomaly.risk_event}`}
              className="mt-1 block text-sm font-semibold text-civic-teal hover:underline"
            >
              #{anomaly.risk_event} →
            </Link>
          ) : (
            <p className="mt-1 text-sm text-civic-muted">None (below threshold)</p>
          )}
        </div>
      </div>

      {/* Detail fields */}
      <Card>
        <CardHeader title="Anomaly Details" />
        <CardContent>
          <dl className="divide-y divide-civic-line">
            {(
              [
                ["Account", anomaly.user_identifier],
                ["Type", anomaly.anomaly_type_display],
                ["Start time", formatDate(anomaly.start_time)],
                ["End time", formatDate(anomaly.end_time)],
                ...(anomaly.mitre_tactic ? [["MITRE Tactic", anomaly.mitre_tactic]] : []),
                ...(anomaly.mitre_technique ? [["MITRE Technique", anomaly.mitre_technique]] : []),
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="grid grid-cols-[9rem_1fr] gap-2 py-2">
                <dt className="self-start pt-0.5 text-xs font-medium uppercase tracking-wide text-civic-muted">
                  {label}
                </dt>
                <dd className="text-sm text-white">
                  {label.startsWith("MITRE") ? (
                    <span className="font-mono text-xs">{value}</span>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Evidence detail */}
      {anomaly.evidence_detail && Object.keys(anomaly.evidence_detail).length > 0 && (
        <Card>
          <CardHeader
            title="Evidence Detail"
            description="Raw evidence supporting this detection. Requires review."
          />
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-[#111418] p-4 text-xs leading-relaxed text-civic-muted">
              {JSON.stringify(anomaly.evidence_detail, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Status update */}
      {canAct && (
        <Card>
          <CardHeader title="Update Status" />
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Button
                variant="primary"
                disabled={isSaving || selectedStatus === anomaly.status}
                onClick={() => void handleStatusUpdate()}
              >
                {isSaving ? "Saving…" : "Save Status"}
              </Button>
              {saveMsg && <span className="text-xs text-civic-muted">{saveMsg}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-civic-muted transition-colors hover:text-white"
        >
          ← Back
        </button>
        <Link
          to="/modules/loglens/anomalies"
          className="text-xs text-civic-muted transition-colors hover:text-white"
        >
          All Anomalies
        </Link>
      </div>
    </div>
  );
}
