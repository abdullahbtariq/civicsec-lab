import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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
    <div className="flex items-start gap-2 py-2 text-sm border-b border-neutral-800 last:border-0">
      <span className="w-48 shrink-0 text-xs text-neutral-500">{label}</span>
      <span className="text-neutral-200">{children}</span>
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
        ? "border-b-2 border-blue-500 text-blue-400"
        : "text-neutral-500 hover:text-neutral-300"
    }`;

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-neutral-500">Loading dataset…</div>
    );
  }
  if (error || !dataset) {
    return (
      <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
        {error ?? "Dataset not found."}
      </div>
    );
  }

  const isComplete = dataset.processing_status === "complete";

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-neutral-500">
            <Link to="/modules/privacy-doctor" className="hover:text-neutral-300">
              DataPrivacy Doctor
            </Link>{" "}
            /{" "}
            <Link to="/modules/privacy-doctor/datasets" className="hover:text-neutral-300">
              Datasets
            </Link>{" "}
            / {dataset.original_filename}
          </nav>
          <h1 className="text-xl font-semibold text-neutral-100 break-all">
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
            <button
              onClick={() =>
                downloadReport(dataset.id, `privacy-report-${dataset.id}.md`)
              }
              className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              Download Report
            </button>
          )}
          {canAct && !dataset.original_file_deleted && (
            <button
              onClick={() => void handleDeleteFile()}
              className="rounded-md border border-rose-800 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/40 transition-colors"
            >
              Delete Original File
            </button>
          )}
          {dataset.risk_event && (
            <Link
              to={`/risk-events/${dataset.risk_event}`}
              className="rounded-md border border-amber-800 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-900/40 transition-colors"
            >
              View Risk Event
            </Link>
          )}
        </div>
      </div>

      {deleteMsg && (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 px-4 py-2 text-xs text-neutral-400">
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
          <div key={label} className="rounded-lg border border-neutral-700 bg-neutral-900 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-neutral-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Identifier counts */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-3">
          <p className="text-xs uppercase tracking-wide text-rose-400">Direct Identifiers</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-rose-300">
            {dataset.direct_identifier_count}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">columns</p>
        </div>
        <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3">
          <p className="text-xs uppercase tracking-wide text-amber-400">Quasi-Identifiers</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-amber-300">
            {dataset.quasi_identifier_count}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">columns</p>
        </div>
        <div className="rounded-lg border border-purple-800 bg-purple-950/30 p-3">
          <p className="text-xs uppercase tracking-wide text-purple-400">Sensitive Attributes</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-purple-300">
            {dataset.sensitive_attribute_count}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">columns</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-800">
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
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 divide-y divide-neutral-800">
          <InfoRow label="File name">{dataset.original_filename}</InfoRow>
          <InfoRow label="File size">
            {dataset.file_size > 0
              ? dataset.file_size < 1024 * 1024
                ? `${(dataset.file_size / 1024).toFixed(1)} KB`
                : `${(dataset.file_size / (1024 * 1024)).toFixed(2)} MB`
              : "—"}
          </InfoRow>
          <InfoRow label="Retention policy">{dataset.retention_policy.replace(/_/g, " ")}</InfoRow>
          <InfoRow label="Original file">
            {dataset.original_file_deleted ? (
              <span className="text-green-400">Deleted ✓</span>
            ) : (
              <span className="text-amber-400">Retained</span>
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
                className="text-blue-400 hover:text-blue-300"
              >
                #{dataset.risk_event}
              </Link>
            </InfoRow>
          )}
        </div>
      )}

      {/* Tab: Column profiles */}
      {activeTab === "columns" && (
        <>
          {profiles.length === 0 ? (
            <p className="text-sm text-neutral-500">No column profiles yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-800">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-800 bg-neutral-900/80 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Column</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Privacy Category</th>
                    <th className="px-4 py-2 text-right">Uniqueness</th>
                    <th className="px-4 py-2 text-right">Risk</th>
                    <th className="px-4 py-2 text-left">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 bg-neutral-950">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-900/40">
                      <td className="px-4 py-2.5 font-mono text-xs text-neutral-200">
                        {p.column_name}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutral-400">
                        {p.inferred_type_display}
                      </td>
                      <td className="px-4 py-2.5">
                        <PrivacyCategoryBadge
                          category={p.privacy_category}
                          label={p.privacy_category_display}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-xs text-neutral-400">
                        {(p.uniqueness_ratio * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-xs">
                        <span
                          className={
                            p.risk_score >= 70
                              ? "text-rose-300"
                              : p.risk_score >= 40
                                ? "text-amber-300"
                                : "text-neutral-400"
                          }
                        >
                          {p.risk_score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500">
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
            <div className="rounded-lg border border-dashed border-neutral-800 py-10 text-center">
              <p className="text-sm text-neutral-500">No privacy findings detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <FindingSeverityBadge severity={f.severity} label={f.severity_display} />
                    <span className="text-sm font-semibold text-neutral-100">{f.title}</span>
                    <span className="text-xs text-neutral-600">
                      {(f.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">{f.description}</p>
                  {f.affected_columns.length > 0 && (
                    <p className="text-xs text-neutral-500">
                      <span className="text-neutral-400 font-medium">Affected columns: </span>
                      {f.affected_columns.join(", ")}
                    </p>
                  )}
                  <div className="rounded border border-neutral-700 bg-neutral-950/60 px-3 py-2">
                    <p className="text-xs text-neutral-500">
                      <span className="font-medium text-neutral-400">Recommendation: </span>
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
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-3 text-xs text-neutral-600">
        Automated analysis only. All findings require verification by a qualified data protection
        officer. This tool does not constitute legal advice.
      </div>
    </div>
  );
}
