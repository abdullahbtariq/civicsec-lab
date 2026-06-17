import { api, API_BASE_URL } from "../../lib/api";
import type {
  DiscourseDataset,
  EntityMention,
  KeywordBurst,
  NarrativeCluster,
  ObservatoryOverview,
  PostsPage,
} from "../../types/api";

const BASE = "/api/observatory";

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? "";
  return "";
}

export function getOverview() {
  return api.get<ObservatoryOverview>(`${BASE}/overview/`);
}

export function getDatasets(params?: { processing_status?: string }) {
  const qs = params?.processing_status ? `?processing_status=${params.processing_status}` : "";
  return api.get<DiscourseDataset[]>(`${BASE}/datasets/${qs}`);
}

export function getDataset(id: number) {
  return api.get<DiscourseDataset>(`${BASE}/datasets/${id}/`);
}

export async function uploadDataset(
  file: File,
  description: string,
  retentionPolicy: string,
): Promise<DiscourseDataset> {
  const csrfToken = getCookie("csrftoken");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", description);
  formData.append("retention_policy", retentionPolicy);

  const resp = await fetch(`${API_BASE_URL}/api/observatory/datasets/`, {
    method: "POST",
    headers: csrfToken ? { "X-CSRFToken": csrfToken } : {},
    credentials: "include",
    body: formData,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Upload failed (${resp.status})`);
  }
  return resp.json() as Promise<DiscourseDataset>;
}

export function deleteDataset(id: number) {
  return api.delete<void>(`${BASE}/datasets/${id}/`);
}

export function processDataset(id: number) {
  return api.post<DiscourseDataset>(`${BASE}/datasets/${id}/process/`, {});
}

export function getClusters(params?: { dataset?: number; status?: string }) {
  const parts: string[] = [];
  if (params?.dataset) parts.push(`dataset=${params.dataset}`);
  if (params?.status) parts.push(`status=${params.status}`);
  const qs = parts.length ? `?${parts.join("&")}` : "";
  return api.get<NarrativeCluster[]>(`${BASE}/clusters/${qs}`);
}

export function getCluster(id: number) {
  return api.get<NarrativeCluster>(`${BASE}/clusters/${id}/`);
}

export function reviewCluster(id: number, data: { status: string; review_notes?: string }) {
  return api.patch<NarrativeCluster>(`${BASE}/clusters/${id}/review/`, data);
}

export function getKeywordBursts(datasetId: number) {
  return api.get<KeywordBurst[]>(`${BASE}/datasets/${datasetId}/keyword-bursts/`);
}

export function getEntityMentions(datasetId: number, entityType?: string) {
  const qs = entityType ? `?entity_type=${entityType}` : "";
  return api.get<EntityMention[]>(`${BASE}/datasets/${datasetId}/entities/${qs}`);
}

export function getPosts(
  datasetId: number,
  params?: { limit?: number; offset?: number; search?: string; platform?: string; cluster?: number },
) {
  const parts: string[] = [];
  if (params?.limit !== undefined) parts.push(`limit=${params.limit}`);
  if (params?.offset !== undefined) parts.push(`offset=${params.offset}`);
  if (params?.search) parts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.platform) parts.push(`platform=${encodeURIComponent(params.platform)}`);
  if (params?.cluster !== undefined) parts.push(`cluster=${params.cluster}`);
  const qs = parts.length ? `?${parts.join("&")}` : "";
  return api.get<PostsPage>(`${BASE}/datasets/${datasetId}/posts/${qs}`);
}
