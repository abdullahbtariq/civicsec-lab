import type { Organisation, PaginatedResponse } from "../../types/api";

export type ThreatBoardAssetSummary = {
  id: number;
  name: string;
  asset_type: string;
  criticality: "low" | "medium" | "high" | "critical";
  internet_exposed: boolean;
  data_sensitivity: "public" | "internal" | "confidential" | "sensitive" | "highly_sensitive";
  vendor: string;
  product: string;
};

export type VulnerabilityScore = {
  id: number;
  vulnerability?: number;
  cve_id?: string;
  epss_score?: number | null;
  epss_percentile?: number | null;
  cvss_score?: string | number | null;
  cvss_severity?: "none" | "low" | "medium" | "high" | "critical" | "unknown";
  kev_known_exploited: boolean;
  last_epss_checked_at?: string | null;
  last_scored_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Vulnerability = {
  id: number;
  cve_id: string;
  title: string;
  description: string;
  vendor: string;
  product: string;
  date_added_to_kev?: string | null;
  due_date?: string | null;
  known_ransomware_campaign_use: boolean;
  required_action: string;
  notes: string;
  cwe?: string;
  source: "cisa_kev" | "manual" | "osv" | "other";
  source_url?: string;
  score?: VulnerabilityScore | null;
  created_at: string;
  updated_at: string;
};

export type AssetVulnerabilityMatch = {
  id: number;
  organisation?: Pick<Organisation, "id" | "name" | "slug">;
  asset: ThreatBoardAssetSummary;
  vulnerability: Vulnerability;
  match_method: string;
  match_confidence: number;
  exposure_score: number;
  calculated_risk_score: number;
  risk_band: "low" | "medium" | "high" | "critical";
  status: "active" | "dismissed" | "resolved" | "false_positive";
  remediation_status:
    | "unreviewed"
    | "affected"
    | "not_affected"
    | "patched"
    | "mitigated"
    | "accepted_risk";
  explanation: string;
  notes?: string;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ThreatIngestionRun = {
  id: number;
  organisation?: Pick<Organisation, "id" | "name" | "slug"> | null;
  run_type: "kev_ingestion" | "epss_enrichment" | "asset_matching" | "risk_scoring";
  status: "queued" | "running" | "completed" | "failed" | "completed_with_errors";
  source: "cisa_kev" | "first_epss" | "internal" | "manual";
  started_at: string;
  finished_at?: string | null;
  records_seen: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ThreatBoardOverview = {
  vulnerability_count: number;
  kev_vulnerability_count: number;
  asset_match_count: number;
  critical_match_count: number;
  high_match_count: number;
  overdue_match_count: number;
  latest_matches: AssetVulnerabilityMatch[];
  latest_ingestion_runs: ThreatIngestionRun[];
};

export type ThreatBoardListResponse<T> = T[] | PaginatedResponse<T>;

export type VulnerabilityParams = {
  search?: string;
  cve_id?: string;
  vendor?: string;
  product?: string;
  source?: string;
  cvss_severity?: string;
  kev_only?: boolean;
  page?: number;
  page_size?: number;
};

export type AssetMatchParams = {
  risk_band?: string;
  remediation_status?: string;
  asset?: string;
  internet_exposed?: boolean;
};

export type TriggerKevOptions = {
  match_assets?: boolean;
  enrich_epss?: boolean;
};

export type TriggerEpssOptions = {
  limit?: number;
  cve?: string;
  cve_ids?: string[];
};

export type TriggerMatchingOptions = {
  create_risk_events?: boolean;
  organisation_slug?: string;
};
