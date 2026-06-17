import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../lib/utils";
import type { DiscourseDataset } from "../../types/api";
import { getDatasets } from "./api";

export function DatasetListPage() {
  const { user } = useAuth();
  const canUpload = user?.role === "admin" || user?.role === "analyst";

  const [datasets, setDatasets] = useState<DiscourseDataset[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getDatasets(statusFilter ? { processing_status: statusFilter } : undefined)
      .then(setDatasets)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load datasets."))
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-ink-soft">
            <Link
              to="/modules/misinformation-observatory"
              className="transition-colors hover:text-ink"
            >
              Observatory
            </Link>{" "}
            / Datasets
          </nav>
          <h1 className="font-display text-xl font-semibold text-ink">Discourse Datasets</h1>
        </div>
        {canUpload && (
          <ButtonLink to="/modules/misinformation-observatory/upload" variant="primary">
            + Upload Dataset
          </ButtonLink>
        )}
      </div>

      <Card>
        <CardHeader title="All Datasets" />
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="complete">Complete</option>
              <option value="failed">Failed</option>
            </Select>
          </div>

          {isLoading ? (
            <LoadingState label="Loading datasets" />
          ) : error ? (
            <ErrorState message={error} />
          ) : datasets.length === 0 ? (
            <EmptyState
              title="No datasets"
              description="Upload a CSV to start analysing public discourse patterns."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-paper-line text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-3 py-2 text-left">Filename</th>
                    <th className="px-3 py-2 text-left">Posts</th>
                    <th className="px-3 py-2 text-left">Clusters</th>
                    <th className="px-3 py-2 text-left">Review needed</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line">
                  {datasets.map((ds) => (
                    <tr key={ds.id} className="transition-colors hover:bg-paper-raise">
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/modules/misinformation-observatory/datasets/${ds.id}`}
                          className="font-medium text-ink transition-colors hover:text-orange-ink"
                        >
                          {ds.original_filename}
                        </Link>
                        {ds.description && (
                          <p className="mt-0.5 truncate text-xs text-ink-soft max-w-xs">
                            {ds.description}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-ink-soft">
                        {ds.row_count.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-ink-soft">
                        {ds.cluster_count}
                      </td>
                      <td className="px-3 py-2.5">
                        {ds.needs_review_count > 0 ? (
                          <span className="font-semibold text-gold-ink">
                            {ds.needs_review_count}
                          </span>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            ds.processing_status === "complete"
                              ? "bg-civic-teal/10 text-orange-ink"
                              : ds.processing_status === "failed"
                                ? "bg-civic-rose/10 text-rose-ink"
                                : "bg-civic-amber/10 text-gold-ink"
                          }`}
                        >
                          {ds.processing_status_display}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-soft">
                        {formatDateTime(ds.uploaded_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
