export type UserRole = "admin" | "analyst" | "viewer";

export type Organisation = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  sector?: string;
  country?: string;
  risk_profile?: "low" | "medium" | "high" | "elevated";
  created_at?: string;
  updated_at?: string;
};

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  organisation: Pick<Organisation, "id" | "name" | "slug"> | null;
};

export type Asset = {
  id: number;
  organisation: Pick<Organisation, "id" | "name" | "slug">;
  name: string;
  asset_type: string;
  description: string;
  owner_name: string;
  criticality: "low" | "medium" | "high" | "critical";
  internet_exposed: boolean;
  data_sensitivity: "public" | "internal" | "confidential" | "sensitive" | "highly_sensitive";
  vendor: string;
  product: string;
  version: string;
  tags: string[];
  created_by?: number | null;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
};

export type RiskEvent = {
  id: number;
  organisation: Pick<Organisation, "id" | "name" | "slug">;
  source_module: string;
  event_type: string;
  title: string;
  summary: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  confidence: number;
  confidence_band: string;
  status: string;
  affected_asset_name?: string | null;
  affected_user_email?: string | null;
  risk_score: number;
  severity_rank: number;
  is_open: boolean;
  evidence_summary: string;
  recommended_action_summary: string;
  mapped_frameworks: Record<string, unknown>;
  tags: string[];
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type EvidenceItem = {
  id: number;
  organisation: Pick<Organisation, "id" | "name" | "slug">;
  risk_event?: number;
  risk_event_title: string;
  evidence_type: string;
  title: string;
  description: string;
  source: string;
  raw_reference: string;
  observed_at?: string | null;
  confidence?: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ActionRecommendation = {
  id: number;
  organisation: Pick<Organisation, "id" | "name" | "slug">;
  risk_event?: number;
  risk_event_title: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  owner_email?: string | null;
  due_date?: string | null;
  framework_mapping: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Incident = {
  id: number;
  organisation: Pick<Organisation, "id" | "name" | "slug">;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: string;
  incident_type: string;
  opened_at: string;
  closed_at?: string | null;
  owner_email?: string | null;
  linked_risk_events: number[];
  timeline_summary: string;
  lessons_learned: string;
  created_at: string;
  updated_at: string;
};

export type IncidentTimelineEntry = {
  id: number;
  organisation: Pick<Organisation, "id" | "name" | "slug">;
  incident?: number;
  incident_title: string;
  timestamp: string;
  entry_type: string;
  title: string;
  description: string;
  actor_email?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PlaybookStep = {
  id: number;
  order: number;
  title: string;
  description: string;
  estimated_minutes: number;
};

export type PlaybookTemplate = {
  id: number;
  name: string;
  description: string;
  incident_type: string;
  is_builtin: boolean;
  steps: PlaybookStep[];
  created_at: string;
};

export type IncidentTask = {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "done" | "skipped";
  status_display: string;
  assignee_email?: string | null;
  due_date?: string | null;
  order: number;
  notes: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
};

// ------------------------------------------------------------------
// Misinformation Observatory
// ------------------------------------------------------------------

export type PublicPost = {
  id: number;
  post_id: string;
  timestamp?: string | null;
  author_identifier: string;
  platform: string;
  text: string;
  url: string;
  shared_url: string;
  reply_to: string;
  language: string;
  engagement_count: number;
  created_at: string;
};

export type PostsPage = {
  count: number;
  limit: number;
  offset: number;
  results: PublicPost[];
};

/** Snippet stored in NarrativeCluster.representative_posts — may be a plain string (legacy) or a rich object. */
export type PostSnippet = {
  text: string;
  url: string;
  platform: string;
  author: string;
  post_id: string;
  timestamp: string;
  engagement_count: number;
};

export type DiscourseDataset = {
  id: number;
  original_filename: string;
  row_count: number;
  processing_status: "pending" | "processing" | "complete" | "failed";
  processing_status_display: string;
  description: string;
  error_message: string;
  retention_policy: string;
  uploaded_at: string;
  processed_at?: string | null;
  detected_language: string;
  cluster_count: number;
  burst_count: number;
  needs_review_count: number;
};

export type NarrativeCluster = {
  id: number;
  dataset: number;
  title: string;
  summary: string;
  representative_terms: string[];
  representative_posts: Array<PostSnippet | string>;
  cluster_size: number;
  start_time?: string | null;
  end_time?: string | null;
  sentiment_score: number;
  toxicity_signal: number;
  growth_rate: number;
  confidence: number;
  status: "unreviewed" | "needs_review" | "reviewed_benign" | "reviewed_concerning" | "escalated";
  status_display: string;
  review_notes: string;
  reviewed_at?: string | null;
  linked_risk_event_id?: number | null;
  created_at: string;
  updated_at: string;
};

export type KeywordBurst = {
  id: number;
  keyword: string;
  baseline_count: number;
  burst_count: number;
  burst_score: number;
  start_time?: string | null;
  end_time?: string | null;
  related_cluster?: number | null;
  created_at: string;
};

export type EntityMention = {
  id: number;
  entity_text: string;
  entity_type: "person" | "organisation" | "location" | "hashtag" | "domain" | "other";
  entity_type_display: string;
  count: number;
  sentiment_average: number;
  created_at: string;
};

export type ObservatoryOverview = {
  total_datasets: number;
  total_posts: number;
  total_clusters: number;
  needs_review: number;
  escalated: number;
  total_keyword_bursts: number;
  recent_datasets: DiscourseDataset[];
  recent_clusters_needing_review: NarrativeCluster[];
};

export type ProcessingJob = {
  id: number;
  organisation: Pick<Organisation, "id" | "name" | "slug"> | null;
  job_type: string;
  status: string;
  started_at?: string | null;
  finished_at?: string | null;
  error_message: string;
  progress: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export function unwrapResults<T>(response: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(response) ? response : response.results;
}
