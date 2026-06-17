import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button, ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../lib/utils";
import type {
  DiscourseDataset,
  EntityMention,
  KeywordBurst,
  NarrativeCluster,
  PublicPost,
} from "../../types/api";
import {
  getClusters,
  getDataset,
  getEntityMentions,
  getKeywordBursts,
  getPosts,
  processDataset,
} from "./api";
import { ClusterStatusBadge } from "./components/ClusterStatusBadge";
import { SentimentBar } from "./components/SentimentBar";

const PAGE_SIZE = 25;

// ── Inline posts table ────────────────────────────────────────────────────────

function PostsSection({ datasetId }: { datasetId: number }) {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [total, setTotal] = useState(0);
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
      getPosts(datasetId, { limit: PAGE_SIZE, offset: pg * PAGE_SIZE, search: q || undefined })
        .then((data) => {
          setPosts(data.results);
          setTotal(data.count);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load posts."))
        .finally(() => setIsLoading(false));
    },
    [datasetId],
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
        title={`Posts (${total.toLocaleString()})`}
        description="All public posts in this dataset. Click a row's link icon to open the original source."
      />
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Search post text or author…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-paper-line bg-paper-card px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft focus:border-civic-teal/60 focus:outline-none"
          />
          {search && (
            <span className="self-center text-xs text-ink-soft">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-paper-line text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-3 py-2 text-left">Text</th>
                    <th className="px-3 py-2 text-left">Author</th>
                    <th className="px-3 py-2 text-left">Platform</th>
                    <th className="px-3 py-2 text-right">Engagement</th>
                    <th className="px-3 py-2 text-left">Timestamp</th>
                    <th className="px-3 py-2 text-left">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line">
                  {posts.map((post) => {
                    const sourceUrl = post.url || post.shared_url || "";
                    return (
                      <tr key={post.id} className="group transition-colors hover:bg-paper-raise">
                        <td className="max-w-xs px-3 py-2.5">
                          <p className="line-clamp-2 text-xs text-ink">{post.text}</p>
                          {post.reply_to && (
                            <p className="mt-0.5 text-xs text-ink-soft">
                              ↩ {post.reply_to}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-soft">
                          {post.author_identifier || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {post.platform ? (
                            <span className="rounded-full border border-paper-line bg-[#1a1f26] px-2 py-0.5 text-xs text-ink-soft">
                              {post.platform}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-soft">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-xs text-ink-soft">
                          {post.engagement_count > 0
                            ? post.engagement_count.toLocaleString()
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-soft">
                          {post.timestamp ? formatDateTime(post.timestamp) : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          {sourceUrl ? (
                            <a
                              href={sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 text-xs text-orange-ink opacity-70 transition-opacity hover:opacity-100"
                              title={sourceUrl}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span className="sr-only">Open source</span>
                            </a>
                          ) : (
                            <span className="text-xs text-ink-soft">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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

export function DatasetDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canAct = user?.role === "admin" || user?.role === "analyst";

  const [dataset, setDataset] = useState<DiscourseDataset | null>(null);
  const [clusters, setClusters] = useState<NarrativeCluster[]>([]);
  const [bursts, setBursts] = useState<KeywordBurst[]>([]);
  const [entities, setEntities] = useState<EntityMention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const datasetId = Number(id);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      getDataset(datasetId),
      getClusters({ dataset: datasetId }),
      getKeywordBursts(datasetId),
      getEntityMentions(datasetId),
    ])
      .then(([ds, cl, bu, en]) => {
        setDataset(ds);
        setClusters(cl);
        setBursts(bu);
        setEntities(en);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dataset."))
      .finally(() => setIsLoading(false));
  }, [id, datasetId]);

  async function handleProcess() {
    if (!id) return;
    setIsActing(true);
    setActionMsg(null);
    try {
      const updated = await processDataset(datasetId);
      setDataset(updated);
      const [cl, bu, en] = await Promise.all([
        getClusters({ dataset: datasetId }),
        getKeywordBursts(datasetId),
        getEntityMentions(datasetId),
      ]);
      setClusters(cl);
      setBursts(bu);
      setEntities(en);
      setActionMsg("Pipeline re-ran successfully.");
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setIsActing(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading dataset" />;
  if (error) return <ErrorState message={error} />;
  if (!dataset)
    return (
      <EmptyState description="Dataset not found or you do not have access." title="Not found" />
    );

  const hashtags = entities.filter((e) => e.entity_type === "hashtag");
  const domains = entities.filter((e) => e.entity_type === "domain");
  const authors = entities.filter((e) => e.entity_type === "person");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-ink-soft">
            <Link
              to="/modules/misinformation-observatory"
              className="transition-colors hover:text-ink"
            >
              Observatory
            </Link>{" "}
            /{" "}
            <Link
              to="/modules/misinformation-observatory/datasets"
              className="transition-colors hover:text-ink"
            >
              Datasets
            </Link>{" "}
            / {dataset.original_filename}
          </nav>
          <h1 className="font-display text-xl font-semibold text-ink">{dataset.original_filename}</h1>
          {dataset.description && (
            <p className="mt-0.5 text-sm text-ink-soft">{dataset.description}</p>
          )}
        </div>
        {canAct && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="secondary" onClick={() => void handleProcess()} disabled={isActing}>
              {isActing ? "Processing…" : "Re-process"}
            </Button>
          </div>
        )}
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-civic-teal/40 bg-civic-teal/10 px-4 py-2 text-xs text-orange-ink">
          {actionMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Posts", value: dataset.row_count.toLocaleString() },
          { label: "Clusters", value: String(dataset.cluster_count) },
          { label: "Needs review", value: String(dataset.needs_review_count) },
          { label: "Keyword bursts", value: String(dataset.burst_count) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-paper-line bg-paper-card p-4">
            <p className="text-xs uppercase text-ink-soft">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Status + metadata */}
      <Card>
        <CardHeader title="Dataset Info" />
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Status", value: dataset.processing_status_display },
            { label: "Retention", value: dataset.retention_policy },
            {
              label: "Language",
              value: dataset.detected_language
                ? dataset.detected_language.toUpperCase()
                : "Auto-detected",
            },
            { label: "Uploaded", value: formatDateTime(dataset.uploaded_at) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-paper-line bg-paper-card p-3">
              <p className="text-xs uppercase text-ink-soft">{label}</p>
              <p className="mt-1 text-sm font-medium text-ink">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {dataset.error_message && (
        <div className="rounded-lg border border-civic-rose/40 bg-civic-rose/10 px-4 py-3 text-sm text-rose-ink">
          <span className="font-medium">Pipeline error: </span>
          {dataset.error_message}
        </div>
      )}

      {/* Narrative clusters */}
      <Card>
        <CardHeader
          title={`Narrative Clusters (${clusters.length})`}
          description="Groups of semantically similar posts detected by the NLP pipeline."
        />
        <CardContent className="space-y-3">
          {clusters.length === 0 ? (
            <EmptyState
              title="No clusters"
              description="Run the pipeline to generate narrative clusters."
            />
          ) : (
            clusters.map((c) => (
              <Link
                key={c.id}
                to={`/modules/misinformation-observatory/clusters/${c.id}`}
                className="block rounded-lg border border-paper-line bg-paper-card p-4 transition-colors hover:border-civic-teal/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ClusterStatusBadge status={c.status} />
                  <span className="text-xs text-ink-soft">{c.cluster_size} posts</span>
                  <span className="text-xs text-ink-soft">
                    confidence {Math.round(c.confidence * 100)}%
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-ink">{c.title}</p>
                <div className="mt-2 max-w-xs">
                  <SentimentBar score={c.sentiment_score} />
                </div>
                {c.representative_terms.length > 0 && (
                  <p className="mt-2 text-xs text-ink-soft">
                    {c.representative_terms.slice(0, 5).join(", ")}
                  </p>
                )}
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Keyword bursts + entities */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={`Keyword Bursts (${bursts.length})`}
            description="Terms that appeared significantly more in the recent window."
          />
          <CardContent>
            {bursts.length === 0 ? (
              <EmptyState title="No bursts detected" description="No significant keyword spikes found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-paper-line text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Keyword</th>
                      <th className="px-2 py-1.5 text-right">Baseline</th>
                      <th className="px-2 py-1.5 text-right">Recent</th>
                      <th className="px-2 py-1.5 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-line">
                    {bursts.slice(0, 15).map((b) => (
                      <tr key={b.id}>
                        <td className="px-2 py-1.5 font-mono text-xs text-ink">{b.keyword}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-ink-soft">
                          {b.baseline_count}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-ink-soft">
                          {b.burst_count}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          <span
                            className={
                              b.burst_score >= 3
                                ? "font-semibold text-rose-ink"
                                : b.burst_score >= 2
                                  ? "text-gold-ink"
                                  : "text-ink-soft"
                            }
                          >
                            {b.burst_score.toFixed(1)}×
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={`Entity Mentions (${entities.length})`}
            description="Recurring hashtags, authors, and domains."
          />
          <CardContent className="space-y-4">
            {hashtags.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Hashtags
                </p>
                <div className="flex flex-wrap gap-2">
                  {hashtags.slice(0, 12).map((e) => (
                    <span
                      key={e.id}
                      className="rounded-full border border-paper-line bg-[#1a1f26] px-2.5 py-1 text-xs font-medium text-ink"
                    >
                      {e.entity_text}
                      <span className="ml-1 text-ink-soft">{e.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {authors.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Top authors
                </p>
                <div className="flex flex-wrap gap-2">
                  {authors.slice(0, 8).map((e) => (
                    <span
                      key={e.id}
                      className="rounded-full border border-paper-line bg-[#1a1f26] px-2.5 py-1 text-xs font-medium text-ink-soft"
                    >
                      {e.entity_text}
                      <span className="ml-1">{e.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {domains.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">
                  Domains
                </p>
                <div className="flex flex-wrap gap-2">
                  {domains.slice(0, 8).map((e) => (
                    <span
                      key={e.id}
                      className="rounded-full border border-paper-line bg-[#1a1f26] px-2.5 py-1 text-xs font-mono text-xs text-ink-soft"
                    >
                      {e.entity_text}
                      <span className="ml-1">{e.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {entities.length === 0 && (
              <EmptyState title="No entities" description="No recurring entities detected." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Posts */}
      <PostsSection datasetId={datasetId} />
    </div>
  );
}
