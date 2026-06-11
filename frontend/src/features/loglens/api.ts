import { api } from "../../lib/api";
import { type PaginatedResponse, unwrapResults } from "../../types/api";
import type { AnomalyParams, LoginAnomaly, LoginEvent, LogLensOverview } from "./types";

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

async function getList<T>(path: string) {
  const response = await api.get<T[] | PaginatedResponse<T>>(path);
  return unwrapResults(response);
}

export function getLogLensOverview() {
  return api.get<LogLensOverview>("/api/loglens/overview/");
}

export function getAnomalies(params?: AnomalyParams) {
  return getList<LoginAnomaly>(`/api/loglens/anomalies/${queryString(params)}`);
}

export function getAnomaly(id: string | number) {
  return api.get<LoginAnomaly>(`/api/loglens/anomalies/${id}/`);
}

export function updateAnomalyStatus(id: string | number, status: string) {
  return api.patch<LoginAnomaly>(`/api/loglens/anomalies/${id}/`, { status });
}

export function getLoginEvents(params?: Record<string, string | undefined>) {
  return getList<LoginEvent>(`/api/loglens/events/${queryString(params)}`);
}

export function generateSyntheticLogs(daysBack = 7, clearExisting = false) {
  return api.post<{ batch_id: string; total_created: number }>("/api/loglens/generate-synthetic-logs/", {
    days_back: daysBack,
    clear_existing: clearExisting,
  });
}

export function uploadLoginLogs(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
    /\/api\/?$/,
    "",
  );

  // Use raw fetch for multipart — the api lib sends JSON content-type
  return fetch(`${rawBaseUrl}/api/loglens/upload-logs/`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  }).then((r) => r.json() as Promise<{ batch_id: string; events_created: number }>);
}

export function runDetection() {
  return api.post<{
    detection: { anomalies_created: number; events_analysed: number };
    risk_events: { risk_events_created: number };
  }>("/api/loglens/run-detection/", {});
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? "";
  return "";
}
