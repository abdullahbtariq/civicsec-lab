import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import type { NarrativeCluster } from "../../types/api";
import { getClusters } from "./api";
import { ClusterStatusBadge } from "./components/ClusterStatusBadge";
import { SentimentBar } from "./components/SentimentBar";

export function ClusterListPage() {
  const [clusters, setClusters] = useState<NarrativeCluster[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getClusters(statusFilter ? { status: statusFilter } : undefined)
      .then(setClusters)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load clusters."))
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
            / Clusters
          </nav>
          <h1 className="font-display text-xl font-semibold text-ink">Narrative Clusters</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            Analyst review queue for detected discourse patterns.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="All Clusters" />
        <CardContent className="space-y-4">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="needs_review">Needs review</option>
            <option value="reviewed_benign">Reviewed — benign</option>
            <option value="reviewed_concerning">Reviewed — concerning</option>
            <option value="escalated">Escalated</option>
          </Select>

          {isLoading ? (
            <LoadingState label="Loading clusters" />
          ) : error ? (
            <ErrorState message={error} />
          ) : clusters.length === 0 ? (
            <EmptyState
              title="No clusters"
              description="No narrative clusters match the selected filter."
            />
          ) : (
            <div className="space-y-3">
              {clusters.map((c) => (
                <Link
                  key={c.id}
                  to={`/modules/misinformation-observatory/clusters/${c.id}`}
                  className="block rounded-lg border border-paper-line bg-paper-card p-4 transition-colors hover:border-civic-teal/60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClusterStatusBadge status={c.status} />
                      <span className="text-xs text-ink-soft">{c.cluster_size} posts</span>
                      <span className="text-xs text-ink-soft">
                        confidence {Math.round(c.confidence * 100)}%
                      </span>
                    </div>
                    <span className="text-xs text-ink-soft">
                      Dataset #{c.dataset}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">{c.title}</p>
                  <div className="mt-2 max-w-sm">
                    <SentimentBar score={c.sentiment_score} />
                  </div>
                  {c.representative_terms.length > 0 && (
                    <p className="mt-2 text-xs text-ink-soft">
                      {c.representative_terms.slice(0, 6).join(" · ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
