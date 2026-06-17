import { api } from "../../lib/api";
import { type PaginatedResponse, unwrapResults } from "../../types/api";
import type {
  AssetMatchParams,
  AssetVulnerabilityMatch,
  ThreatBoardOverview,
  ThreatIngestionRun,
  TriggerEpssOptions,
  TriggerKevOptions,
  TriggerMatchingOptions,
  Vulnerability,
  VulnerabilityParams,
} from "./types";

function queryString(params?: Record<string, string | number | boolean | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function getList<T>(path: string) {
  const response = await api.get<T[] | PaginatedResponse<T>>(path);
  return unwrapResults(response);
}

export function getThreatBoardOverview() {
  return api.get<ThreatBoardOverview>("/api/threatboard/overview/");
}

export function getVulnerabilities(params?: VulnerabilityParams) {
  return getList<Vulnerability>(`/api/threatboard/vulnerabilities/${queryString(params)}`);
}

/** Catalogue fetch that preserves the paginated envelope (count/next/previous). */
export function getVulnerabilitiesPage(params?: VulnerabilityParams, signal?: AbortSignal) {
  return api.get<PaginatedResponse<Vulnerability>>(
    `/api/threatboard/vulnerabilities/${queryString(params)}`,
    signal ? { signal } : undefined,
  );
}

export function getVulnerability(id: string | number) {
  return api.get<Vulnerability>(`/api/threatboard/vulnerabilities/${id}/`);
}

export function getAssetMatches(params?: AssetMatchParams) {
  return getList<AssetVulnerabilityMatch>(`/api/threatboard/asset-matches/${queryString(params)}`);
}

export function getAssetMatch(id: string | number) {
  return api.get<AssetVulnerabilityMatch>(`/api/threatboard/asset-matches/${id}/`);
}

export function getIngestionRuns() {
  return getList<ThreatIngestionRun>("/api/threatboard/ingestion-runs/");
}

export function triggerKevIngestion(options: TriggerKevOptions = {}) {
  return api.post<{ ingestion_run: ThreatIngestionRun; epss_summary?: unknown; matching_summary?: unknown }>(
    "/api/threatboard/ingest-kev/",
    options,
  );
}

export function triggerEpssEnrichment(options: TriggerEpssOptions = {}) {
  return api.post<{ ingestion_run: ThreatIngestionRun }>("/api/threatboard/enrich-epss/", options);
}

export function triggerAssetMatching(options: TriggerMatchingOptions = {}) {
  return api.post<{ ingestion_run: ThreatIngestionRun; summary: Record<string, number> }>(
    "/api/threatboard/match-assets/",
    options,
  );
}
