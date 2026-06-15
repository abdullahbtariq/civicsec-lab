import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button, ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { useAuth } from "../../hooks/useAuth";
import { deleteOriginalFile, downloadReport, getColumnProfiles, getDataset, getFindings } from "./api";
import { DatasetStatusBadge } from "./components/DatasetStatusBadge";
import { FindingSeverityBadge } from "./components/FindingSeverityBadge";
import { PrivacyCategoryBadge } from "./components/PrivacyCategoryBadge";
import { RiskBandBadge } from "./components/RiskBandBadge";
import type { DatasetColumnProfile, PrivacyFinding, UploadedDataset } from "./types";

type Tab = "summary" | "columns" | "findings";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 border-b border-civic-line py-2 text-sm last:border-0">
      <span className="w-48 shrink-0 text-xs text-civic-muted">{label}</span>
      <span className="text-white">{children}</span>
    </div>
  );
}

export function DatasetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [dataset, setDataset] = useState<UploadedDataset | null>(null);
  const [profiles, setProfiles] = useState<DatasetColumnProfile[]>([]);
  const [findings, setFindings] = useState<PrivacyFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  const canAct = user?.role === "admin" || user?.role === "analyst";

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [ds, profs, finds] = await Promise.all([
        getDataset(id),
        getColumnProfiles(id),
        getFindings(id),
      ]);
      setDataset(ds);
      setProfiles(profs);
      setFindings(finds);
    } catch {
      setError("Could not load dataset. It may not exist or you may not have access.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDeleteFile() {
    if (!id || !dataset) return;
    if (!confirm("Permanently delete the original CSV file? This cannot be undone.")) return;
    try {
      const result = await deleteOriginalFile(id);
      setDeleteMsg(result.message);
      setDataset((prev) => (prev ? { ...prev, original_file_deleted: true } : prev));
    } catch {
      setDeleteMsg("Failed to delete original file.");
    }
  }

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-xs font-medium transition-colors ${
      activeTab === tab
        ? "border-b-2 border-civic-teal text-civic-teal"
        : "text-civic-muted hover:text-white"
    }`;

  if (isLoading) return <LoadingState label="Loading dataset" />;
  if (error || !dataset) return <ErrorState message={error ?? "Dataset not found."} />;

  const isComplete = dataset.processing_status === "complete";

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-civic-muted">
            <Link to="/modules/privacy-doctor" className="transition-colors hover:text-white">
              DataPrivacy Doctor
            </Link>{" "}
            /{" "}
            <Link
              to="/modules/privacy-doctor/datasets"
              className="transition-colors hover:text-white"
            >
              Datasets
            </Link>{" "}
            / {dataset.original_filename}
          </nav>
          <h1 className="break-all font-display text-xl font-semibold text-white">
            {dataset.original_filename}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <DatasetStatusBadge
              status={dataset.processing_status}
              label={dataset.processing_status_display}
            />
            {dataset.risk_band && (
              <RiskBandBadge band={dataset.risk_band} score={dataset.privacy_risk_score} />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 self-start">
          {isComplete && (
            <Button
              variant="secondary"
              onClick={() => downloadReport(dataset.id, `privacy-report-${dataset.id}.md`)}
            >
              Download Report
            </Button>
          )}
          {canAct && !dataset.original_file_deleted && (
            <Button variant="danger" onClick={() => void handleDeleteFile()}>
              Delete Original File
            </Button>
          )}
          {dataset.risk_event && (
            <ButtonLink
              to={`/risk-events/${dataset.risk_event}`}
              variant="secondary"
            >
              View Risk Event
            </ButtonLink>
          )}
        </div>
      </div>

      {deleteMsg && (
        <div className="rounded-lg border border-civic-line bg-[#14181d] px-4 py-2 text-xs text-civic-muted">
          {deleteMsg}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Rows", value: dataset.row_count.toLocaleString() },
          { label: "Columns", value: dataset.column_count },
          { label: "Findings", value: dataset.finding_count },
          { label: "Risk Score", value: `${dataset.privacy_risk_score}/100` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-civic-line bg-[#14181d] p-3">
            <p className="text-xs uppercase tracking-wide text-civic-muted">{label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Identifier counts */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-civic-rose/30 bg-civic-rose/5 p-3">
          <p className="text-xs uppercase tracking-wide text-civic-rose">Direct Identifiers</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-civic-rose">
            {dataset.direct_identifier_count}
          </p>
          <p className="mt-0.5 text-xs text-civic-muted">columns</p>
        </div>
        <div className="rounded-lg border border-civic-amber/30 bg-civic-amber/5 p-3">
          <p className="text-xs uppercase tracking-wide text-civic-amber">Quasi-Identifiers</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-civic-amber">
            {dataset.quasi_identifier_count}
          </p>
          <p className="mt-0.5 text-xs text-civic-muted">columns</p>
        </div>
        <div className="rounded-lg border border-civic-blue/30 bg-civic-blue/5 p-3">
          <p className="text-xs uppercase tracking-wide text-civic-blue">Sensitive Attributes</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-civic-blue">
            {dataset.sensitive_attribute_count}
          </p>
          <p className="mt-0.5 text-xs text-civic-muted">columns</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-civic-line">
        <div className="flex gap-0">
          <button className={tabClass("summary")} onClick={() => setActiveTab("summary")}>
            Summary
          </button>
          <button className={tabClass("columns")} onClick={() => setActiveTab("columns")}>
            Column Profiles ({profiles.length})
          </button>
          <button className={tabClass("findings")} onClick={() => setActiveTab("findings")}>
            Findings ({findings.length})
          </button>
        </div>
      </div>

      {/* Tab: Summary */}
      {activeTab === "summary" && (
        <Card>
          <CardContent className="divide-y divide-civic-line">
            <InfoRow label="File name">{dataset.original_filename}</InfoRow>
            <InfoRow label="File size">
              {dataset.file_size > 0
                ? dataset.file_size < 1024 * 1024
                  ? `${(dataset.file_size / 1024).toFixed(1)} KB`
                  : `${(dataset.file_size / (1024 * 1024)).toFixed(2)} MB`
                : "—"}
            </InfoRow>
            <InfoRow label="Retention policy">
              {dataset.retention_policy.replace(/_/g, " ")}
            </InfoRow>
            <InfoRow label="Original file">
              {dataset.original_file_deleted ? (
                <span className="text-civic-teal">Deleted ✓</span>
              ) : (
                <span className="text-civic-amber">Retained</span>
              )}
            </InfoRow>
            <InfoRow label="Uploaded">
              {new Date(dataset.uploaded_at).toLocaleString()}
            </InfoRow>
            <InfoRow label="Scanned">
              {dataset.processed_at ? new Date(dataset.processed_at).toLocaleString() : "—"}
            </InfoRow>
            {dataset.risk_event && (
              <InfoRow label="Risk event">
                <Link
                  to={`/risk-events/${dataset.risk_event}`}
                  className="text-civic-teal hover:underline"
                >
                  #{dataset.risk_event}
                </Link>
              </InfoRow>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Column profiles */}
      {activeTab === "columns" && (
        <>
          {profiles.length === 0 ? (
            <EmptyState title="No column profiles yet" description="Run a scan to generate column-level privacy profiles." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-civic-line">
              <table className="w-full text-sm">
                <thead className="border-b border-civic-line bg-[#111418] text-xs uppercase tracking-wide text-civic-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Column</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Privacy Category</th>
                    <th className="px-4 py-2 text-right">Uniqueness</th>
                    <th className="px-4 py-2 text-right">Risk</th>
                    <th className="px-4 py-2 text-left">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-civic-line bg-civic-panel">
                  {profiles.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-[#20252b]">
                      <td className="px-4 py-2.5 font-mono text-xs text-white">
                        {p.column_name}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-civic-muted">
                        {p.inferred_type_display}
                      </td>
                      <td className="px-4 py-2.5">
                        <PrivacyCategoryBadge
                          category={p.privacy_category}
                          label={p.privacy_category_display}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-xs text-civic-muted">
                        {(p.uniqueness_ratio * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-xs font-semibold">
                        <span
                          className={
                            p.risk_score >= 70
                              ? "text-civic-rose"
                              : p.risk_score >= 40
                                ? "text-civic-amber"
                                : "text-civic-muted"
                          }
                        >
                          {p.risk_score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-civic-muted">
                        {p.recommended_transformation || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab: Findings */}
      {activeTab === "findings" && (
        <>
          {findings.length === 0 ? (
            <EmptyState title="No privacy findings detected" description="No significant privacy risks were identified in this dataset." />
          ) : (
            <div className="space-y-3">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="space-y-2 rounded-lg border border-civic-line bg-[#14181d]/60 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <FindingSeverityBadge severity={f.severity} label={f.severity_display} />
                    <span className="text-sm font-semibold text-white">{f.title}</span>
                    <span className="text-xs text-civic-muted">
                      {(f.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-civic-muted">{f.description}</p>
                  {f.affected_columns.length > 0 && (
                    <p className="text-xs text-civic-muted">
                      <span className="font-medium text-white">Affected columns: </span>
                      {f.affected_columns.join(", ")}
                    </p>
                  )}
                  <div className="rounded border border-civic-line bg-[#111418] px-3 py-2">
                    <p className="text-xs text-civic-muted">
                      <span className="font-medium text-white">Recommendation: </span>
                      {f.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Responsible-use footer */}
      <div className="rounded-lg border border-civic-line bg-[#14181d]/40 px-4 py-3 text-xs text-civic-muted">
        Automated analysis only. All findings require verification by a qualified data protection
        officer. This tool does not constitute legal advice.
      </div>
    </div>
  );
}
