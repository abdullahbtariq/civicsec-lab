import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

  const selectClass =
    "rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-600";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-neutral-500">
            <Link to="/modules/privacy-doctor" className="hover:text-neutral-300">
              DataPrivacy Doctor
            </Link>{" "}
            / Datasets
          </nav>
          <h1 className="text-xl font-semibold text-neutral-100">Datasets</h1>
          <p className="mt-0.5 text-sm text-neutral-400">All scanned CSV datasets for your organisation.</p>
        </div>
        <Link
          to="/modules/privacy-doctor/upload"
          className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors self-start"
        >
          Upload Dataset
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className={selectClass} onChange={(e) => setParam("risk_band", e.target.value)}>
          {RISK_BANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          onChange={(e) => setParam("processing_status", e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-neutral-600">
        Outputs are automated heuristics. Human review is required before taking compliance action.
      </p>

      {isLoading && (
        <div className="py-8 text-center text-sm text-neutral-500">Loading datasets…</div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {!isLoading && !error && datasets.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-800 py-16 text-center">
          <p className="text-sm text-neutral-500">No datasets found.</p>
          <p className="mt-2 text-xs text-neutral-600">
            Try adjusting the filters or{" "}
            <Link to="/modules/privacy-doctor/upload" className="text-blue-400 hover:text-blue-300">
              upload a CSV
            </Link>
            .
          </p>
        </div>
      )}

      {!isLoading && !error && datasets.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/80 text-xs uppercase tracking-wide text-neutral-500">
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
            <tbody className="divide-y divide-neutral-800 bg-neutral-950">
              {datasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-neutral-900/60 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/modules/privacy-doctor/datasets/${ds.id}`}
                      className="font-medium text-neutral-200 hover:text-blue-300 transition-colors"
                    >
                      {ds.original_filename}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-500 text-xs">
                    {formatBytes(ds.file_size)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-400">
                    {ds.row_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-400">
                    {ds.column_count}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {ds.risk_band ? (
                      <RiskBandBadge band={ds.risk_band} score={ds.privacy_risk_score} />
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <DatasetStatusBadge
                      status={ds.processing_status}
                      label={ds.processing_status_display}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neutral-400">
                    {ds.finding_count}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-neutral-500">
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
