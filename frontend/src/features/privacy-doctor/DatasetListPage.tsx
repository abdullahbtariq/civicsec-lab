import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { getDatasets } from "./api";
import { DatasetStatusBadge } from "./components/DatasetStatusBadge";
import { RiskBandBadge } from "./components/RiskBandBadge";
import type { DatasetParams, UploadedDataset } from "./types";

const RISK_BANDS = [
  { value: "", label: "All risk bands" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "severe", label: "Severe" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "complete", label: "Complete" },
  { value: "failed", label: "Failed" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DatasetListPage() {
  const [datasets, setDatasets] = useState<UploadedDataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<DatasetParams>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDatasets(await getDatasets(params));
    } catch {
      setError("Could not load datasets.");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  function setParam(key: keyof DatasetParams, value: string) {
    setParams((prev) => ({ ...prev, [key]: value || undefined }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-civic-muted">
            <Link to="/modules/privacy-doctor" className="transition-colors hover:text-white">
              DataPrivacy Doctor
            </Link>{" "}
            / Datasets
          </nav>
          <h1 className="font-display text-xl font-semibold text-white">Datasets</h1>
          <p className="mt-0.5 text-sm text-civic-muted">
            All scanned CSV datasets for your organisation.
          </p>
        </div>
        <ButtonLink
          to="/modules/privacy-doctor/upload"
          variant="primary"
          className="self-start"
        >
          Upload Dataset
        </ButtonLink>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select onChange={(e) => setParam("risk_band", e.target.value)}>
          {RISK_BANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </Select>
        <Select onChange={(e) => setParam("processing_status", e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <p className="text-xs text-civic-muted">
        Outputs are automated heuristics. Human review is required before taking compliance action.
      </p>

      {isLoading && <LoadingState label="Loading datasets" />}
      {error && <ErrorState message={error} />}

      {!isLoading && !error && datasets.length === 0 && (
        <EmptyState
          title="No datasets found"
          description="Try adjusting the filters or upload a CSV to get started."
          action={
            <Link to="/modules/privacy-doctor/upload" className="text-sm text-civic-teal hover:underline">
              Upload a CSV →
            </Link>
          }
        />
      )}

      {!isLoading && !error && datasets.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-civic-line">
          <table className="w-full text-sm">
            <thead className="border-b border-civic-line bg-[#111418] text-xs uppercase tracking-wide text-civic-muted">
              <tr>
                <th className="px-4 py-2 text-left">File</th>
                <th className="px-4 py-2 text-right">Size</th>
                <th className="px-4 py-2 text-right">Rows</th>
                <th className="px-4 py-2 text-right">Cols</th>
                <th className="px-4 py-2 text-center">Risk Band</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-right">Findings</th>
                <th className="px-4 py-2 text-right">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-civic-line bg-civic-panel">
              {datasets.map((ds) => (
                <tr key={ds.id} className="transition-colors hover:bg-[#20252b]">
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/modules/privacy-doctor/datasets/${ds.id}`}
                      className="font-medium text-white transition-colors hover:text-civic-teal"
                    >
                      {ds.original_filename}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-xs text-civic-muted">
                    {formatBytes(ds.file_size)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-civic-muted">
                    {ds.row_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-civic-muted">
                    {ds.column_count}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {ds.risk_band ? (
                      <RiskBandBadge band={ds.risk_band} score={ds.privacy_risk_score} />
                    ) : (
                      <span className="text-civic-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <DatasetStatusBadge
                      status={ds.processing_status}
                      label={ds.processing_status_display}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-civic-muted">
                    {ds.finding_count}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-civic-muted">
                    {new Date(ds.uploaded_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
