import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../lib/utils";
import type { NarrativeCluster, PostSnippet, PublicPost } from "../../types/api";
import { getCluster, getPosts, reviewCluster } from "./api";
import { ClusterStatusBadge } from "./components/ClusterStatusBadge";
import { SentimentBar } from "./components/SentimentBar";

const REVIEW_STATUSES = [
  { value: "reviewed_benign", label: "Reviewed — benign" },
  { value: "reviewed_concerning", label: "Reviewed — concerning" },
  { value: "escalated", label: "Escalate" },
  { value: "needs_review", label: "Keep as needs review" },
];

const PAGE_SIZE = 25;

// ── All-posts section ────────────────────────────────────────────────────────

function ClusterPostsSection({
  datasetId,
  clusterId,
  totalExpected,
}: {
  datasetId: number;
  clusterId: number;
  totalExpected: number;
}) {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [total, setTotal] = useState(totalExpected);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    (pg: number, q: string) => {
      setIsLoading(true);
      setError(null);
      getPosts(datasetId, {
        cluster: clusterId,
        limit: PAGE_SIZE,
        offset: pg * PAGE_SIZE,
        search: q || undefined,
      })
        .then((data) => {
          setPosts(data.results);
          setTotal(data.count);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load posts."))
        .finally(() => setIsLoading(false));
    },
    [datasetId, clusterId],
  );

  useEffect(() => {
    load(0, "");
  }, [load]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
      load(0, value);
    }, 350);
  }

  function goToPage(pg: number) {
    setPage(pg);
    load(pg, search);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card>
      <CardHeader
        title={`All Posts in Cluster (${total})`}
        description="Every post assigned to this cluster by the NLP pipeline."
      />
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search post text or author…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-paper-line bg-paper-card px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft focus:border-civic-teal/60 focus:outline-none"
          />
          {search && (
            <span className="text-xs text-ink-soft">
              {total} result{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <LoadingState label="Loading posts" />
        ) : error ? (
          <ErrorState message={error} />
        ) : posts.length === 0 ? (
          <EmptyState title="No posts" description="No posts match your search." />
        ) : (
          <>
            <div className="space-y-2">
              {posts.map((post) => {
                const sourceUrl = post.url || post.shared_url || "";
                return (
                  <div
                    key={post.id}
                    className="rounded-lg border border-paper-line bg-paper-card p-3 space-y-2 transition-colors hover:border-paper-line/80"
                  >
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {post.platform && (
                        <span className="rounded-full border border-paper-line bg-[#1a1f26] px-2 py-0.5 text-xs text-ink-soft">
                          {post.platform}
                        </span>
                      )}
                      {post.author_identifier && (
                        <span className="text-xs text-ink-soft">{post.author_identifier}</span>
                      )}
                      {post.timestamp && (
                        <span className="text-xs text-ink-soft">
                          {formatDateTime(post.timestamp)}
                        </span>
                      )}
                      {post.engagement_count > 0 && (
                        <span className="text-xs text-ink-soft">
                          ↑ {post.engagement_count.toLocaleString()}
                        </span>
                      )}
                      {post.reply_to && (
                        <span className="text-xs text-ink-soft">↩ {post.reply_to}</span>
                      )}
                      {sourceUrl && (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="ml-auto inline-flex items-center gap-1 text-xs text-orange-ink opacity-70 transition-opacity hover:opacity-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Source
                        </a>
                      )}
                    </div>

                    {/* Post text */}
                    <p className="text-sm leading-6 text-ink">{post.text}</p>

                    {/* Post ID chip */}
                    {post.post_id && (
                      <p className="font-mono text-xs text-ink-soft">{post.post_id}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-paper-line pt-3">
                <p className="text-xs text-ink-soft">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of{" "}
                  {total.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0}
                  >
                    ← Prev
                  </Button>
                  <span className="self-center text-xs text-ink-soft">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ClusterDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canReview = user?.role === "admin" || user?.role === "analyst";

  const [cluster, setCluster] = useState<NarrativeCluster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getCluster(Number(id))
      .then((c) => {
        setCluster(c);
        setReviewNotes(c.review_notes || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load cluster."))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleReview() {
    if (!id || !reviewStatus) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const updated = await reviewCluster(Number(id), {
        status: reviewStatus,
        review_notes: reviewNotes,
      });
      setCluster(updated);
      setSaveMsg("Review saved.");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save review.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading cluster" />;
  if (error) return <ErrorState message={error} />;
  if (!cluster) return <EmptyState description="Cluster not found." title="Not found" />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <nav className="mb-1 text-xs text-ink-soft">
          <Link to="/modules/misinformation-observatory" className="transition-colors hover:text-ink">
            Observatory
          </Link>{" "}
          /{" "}
          <Link to="/modules/misinformation-observatory/clusters" className="transition-colors hover:text-ink">
            Clusters
          </Link>{" "}
          / Cluster #{cluster.id}
        </nav>
        <h1 className="font-display text-xl font-semibold text-ink">{cluster.title}</h1>
      </div>

      {/* Overview metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Posts", value: String(cluster.cluster_size) },
          { label: "Confidence", value: `${Math.round(cluster.confidence * 100)}%` },
          { label: "Growth rate", value: `${Math.round(cluster.growth_rate * 100)}%` },
          { label: "Toxicity signal", value: cluster.toxicity_signal.toFixed(2) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-paper-line bg-paper-card p-4">
            <p className="text-xs uppercase text-ink-soft">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Sentiment + summary */}
      <Card>
        <CardHeader title="Cluster Summary" action={<ClusterStatusBadge status={cluster.status} />} />
        <CardContent className="space-y-4">
          {cluster.summary && (
            <p className="text-sm leading-6 text-ink-soft">{cluster.summary}</p>
          )}
          <div className="max-w-xs">
            <SentimentBar score={cluster.sentiment_score} />
          </div>
          {cluster.reviewed_at && (
            <p className="text-xs text-ink-soft">
              Last reviewed {formatDateTime(cluster.reviewed_at)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Representative terms */}
      <Card>
        <CardHeader title="Representative Terms" />
        <CardContent>
          {cluster.representative_terms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cluster.representative_terms.map((term, i) => (
                <span
                  key={i}
                  className="rounded-full border border-paper-line bg-[#1a1f26] px-3 py-1 font-mono text-xs text-ink"
                >
                  {term}
                </span>
              ))}
            </div>
          ) : (
            <EmptyState title="No terms" description="No representative terms extracted." />
          )}
        </CardContent>
      </Card>

      {/* All posts in cluster */}
      <ClusterPostsSection
        datasetId={cluster.dataset}
        clusterId={cluster.id}
        totalExpected={cluster.cluster_size}
      />

      {/* Linked risk event */}
      {cluster.linked_risk_event_id && (
        <Card>
          <CardHeader title="Linked Risk Event" />
          <CardContent>
            <Link
              to={`/risk-events/${cluster.linked_risk_event_id}`}
              className="text-sm font-medium text-orange-ink hover:underline"
            >
              View Risk Event #{cluster.linked_risk_event_id} →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {canReview && (
        <Card>
          <CardHeader
            title="Human Review"
            description="Record your assessment. This is a human decision — the system does not classify content."
          />
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-civic-amber/30 bg-civic-amber/5 px-4 py-3 text-xs text-gold-ink">
              Do not label content as misinformation, bot activity, or coordinated inauthentic
              behaviour without sufficient evidence and appropriate authority. This tool surfaces
              patterns for review — it does not make determinations.
            </div>
            {cluster.review_notes && (
              <div className="rounded-lg border border-paper-line bg-paper-card p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Previous notes
                </p>
                <p className="mt-1 text-sm text-ink-soft">{cluster.review_notes}</p>
              </div>
            )}
            <Select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
              <option value="">Select review outcome…</option>
              {REVIEW_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Textarea
              placeholder="Add review notes (reasoning, evidence, next steps)…"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
            {saveMsg && <p className="text-xs text-orange-ink">{saveMsg}</p>}
            <Button
              variant="primary"
              onClick={() => void handleReview()}
              disabled={!reviewStatus || isSaving}
            >
              {isSaving ? "Saving…" : "Save Review"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
