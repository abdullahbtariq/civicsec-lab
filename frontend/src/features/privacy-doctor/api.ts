import { api } from "../../lib/api";
import type {
  DatasetColumnProfile,
  DatasetParams,
  PrivacyDoctorOverview,
  PrivacyFinding,
  UploadedDataset,
  UploadResult,
} from "./types";

function queryString(params?: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? "";
  return "";
}

export function getPrivacyDoctorOverview() {
  return api.get<PrivacyDoctorOverview>("/api/privacy-doctor/overview/");
}

export function getDatasets(params?: DatasetParams) {
  return api.get<UploadedDataset[]>(`/api/privacy-doctor/datasets/${queryString(params)}`);
}

export function getDataset(id: string | number) {
  return api.get<UploadedDataset>(`/api/privacy-doctor/datasets/${id}/`);
}

export function getColumnProfiles(datasetId: string | number) {
  return api.get<DatasetColumnProfile[]>(
    `/api/privacy-doctor/datasets/${datasetId}/column-profiles/`,
  );
}

export function getFindings(datasetId: string | number) {
  return api.get<PrivacyFinding[]>(`/api/privacy-doctor/datasets/${datasetId}/findings/`);
}

export function getReport(datasetId: string | number) {
  return api.get<{ report_markdown: string; dataset_id: number }>(
    `/api/privacy-doctor/datasets/${datasetId}/report/`,
  );
}

export function deleteOriginalFile(datasetId: string | number) {
  return api.post<{ message: string; dataset_id: number }>(
    `/api/privacy-doctor/datasets/${datasetId}/delete-original/`,
    {},
  );
}

export function generateSyntheticDataset(numRows = 60) {
  return api.post<UploadResult>("/api/privacy-doctor/generate-synthetic/", {
    num_rows: numRows,
  });
}

export function uploadDataset(file: File, retentionPolicy: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("retention_policy", retentionPolicy);

  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
    /\/api\/?$/,
    "",
  );

  return fetch(`${rawBaseUrl}/api/privacy-doctor/upload-dataset/`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  }).then(async (r) => {
    const json = (await r.json()) as UploadResult & { error?: string };
    if (!r.ok) throw new Error((json as { error?: string }).error ?? "Upload failed.");
    return json;
  });
}

/** Download the markdown report as a file. Opens via browser download. */
export function downloadReport(datasetId: string | number, filename: string) {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
    /\/api\/?$/,
    "",
  );
  const url = `${rawBaseUrl}/api/privacy-doctor/datasets/${datasetId}/report/?format=markdown`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
