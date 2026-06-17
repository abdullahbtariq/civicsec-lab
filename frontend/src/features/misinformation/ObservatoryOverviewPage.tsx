import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../lib/utils";
import type { ObservatoryOverview } from "../../types/api";
import { getOverview } from "./api";
import { ClusterStatusBadge } from "./components/ClusterStatusBadge";
import { SentimentBar } from "./components/SentimentBar";

function StatCard({
  label,
  value,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "rose" | "amber" | "teal";
  sub?: string;
}) {
  const bg = {
    neutral: "border-paper-line bg-paper-card",
    rose: "border-civic-rose/40 bg-civic-rose/10",
    amber: "border-civic-amber/30 bg-civic-amber/5",
    teal: "border-civic-teal/40 bg-civic-teal/10",
  }[tone];
  const val = {
    neutral: "text-ink",
    rose: "text-rose-ink",
    amber: "text-gold-ink",
    teal: "text-orange-ink",
  }[tone];
  return (
    <div className={`rounded-lg border p-4 ${bg}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${val}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

export function ObservatoryOverviewPage() {
  const { user } = useAuth();
  const canUpload = user?.role === "admin" || user?.role === "analyst";

  const [overview, setOverview] = useState<ObservatoryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getOverview()
      .then(setOverview)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load overview."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState label="Loading Observatory" />;
  if (error) return <ErrorState message={error} />;
  if (!overview) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Misinformation Observatory</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            Narrative pattern detection, keyword burst analysis, and human review workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/modules/misinformation-observatory/datasets" variant="secondary">
            All Datasets
          </ButtonLink>
          <ButtonLink to="/modules/misinformation-observatory/clusters" variant="secondary">
            All Clusters
          </ButtonLink>
          {canUpload && (
            <ButtonLink to="/modules/misinformation-observatory/upload" variant="primary">
              + Upload Dataset
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Responsible use notice */}
      <div className="rounded-lg border border-civic-amber/30 bg-civic-amber/5 px-4 py-3 text-xs text-gold-ink">
        <span className="font-medium">Analyst support tool. </span>
        This module detects patterns in user-supplied data. It does not classify content as
        misinformation, identify individuals, or make enforcement recommendations. All findings
        require human review before any action is taken.
      </div>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Datasets" value={overview.total_datasets} />
        <StatCard label="Posts analysed" value={overview.total_posts.toLocaleString()} />
        <StatCard label="Narrative clusters" value={overview.total_clusters} />
        <StatCard
          label="Needs review"
          value={overview.needs_review}
          tone={overview.needs_review > 0 ? "amber" : "neutral"}
        />
        <StatCard
          label="Escalated"
          value={overview.escalated}
          tone={overview.escalated > 0 ? "rose" : "neutral"}
        />
        <StatCard label="Keyword bursts" value={overview.total_keyword_bursts} />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Recent datasets */}
        <Card>
          <CardHeader title="Recent Datasets" description="Last 5 uploaded discourse datasets." />
          <CardContent className="space-y-3">
            {overview.recent_datasets.length === 0 ? (
              <EmptyState
                title="No datasets yet"
                description="Upload a CSV of public posts to start analysing discourse patterns."
              />
            ) : (
              overview.recent_datasets.map((ds) => (
                <Link
                  key={ds.id}
                  to={`/modules/misinformation-observatory/datasets/${ds.id}`}
                  className="block rounded-lg border border-paper-line bg-paper-card p-4 transition-colors hover:border-civic-teal/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {ds.original_filename}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {ds.row_count.toLocaleString()} posts · {ds.cluster_count} clusters
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        ds.processing_status === "complete"
                          ? "bg-civic-teal/10 text-orange-ink"
                          : ds.processing_status === "failed"
                            ? "bg-civic-rose/10 text-rose-ink"
                            : "bg-civic-amber/10 text-gold-ink"
                      }`}
                    >
                      {ds.processing_status_display}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{formatDateTime(ds.uploaded_at)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Clusters needing review */}
        <Card>
          <CardHeader
            title="Clusters Needing Review"
            description="Flagged clusters awaiting analyst assessment."
          />
          <CardContent className="space-y-3">
            {overview.recent_clusters_needing_review.length === 0 ? (
              <EmptyState
                title="No clusters pending review"
                description="All detected clusters have been reviewed or none require attention."
              />
            ) : (
              overview.recent_clusters_needing_review.map((c) => (
                <Link
                  key={c.id}
                  to={`/modules/misinformation-observatory/clusters/${c.id}`}
                  className="block rounded-lg border border-civic-amber/30 bg-civic-amber/5 p-4 transition-colors hover:border-civic-amber/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-ink">{c.title}</p>
                    <ClusterStatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{c.cluster_size} posts</p>
                  <div className="mt-2">
                    <SentimentBar score={c.sentiment_score} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
