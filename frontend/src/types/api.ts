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
