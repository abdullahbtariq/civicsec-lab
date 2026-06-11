import { API_BASE_URL, api } from "../../lib/api";
import type { Incident, IncidentTask, PlaybookTemplate } from "../../types/api";

// Incidents (existing ViewSet at /api/incidents/)
export function createIncident(data: {
  title: string;
  description?: string;
  severity: string;
  incident_type: string;
}) {
  return api.post<Incident>("/api/incidents/", data);
}

export function updateIncident(
  id: number,
  data: Partial<{ title: string; description: string; severity: string; lessons_learned: string; timeline_summary: string }>,
) {
  return api.patch<Incident>(`/api/incidents/${id}/`, data);
}

// IncidentFlow-specific endpoints
export function getPlaybooks() {
  return api.get<PlaybookTemplate[]>("/api/incidentflow/playbooks/");
}

export function applyPlaybook(incidentId: number, templateId: number) {
  return api.post<{ tasks_created: number; template_name: string }>(
    `/api/incidentflow/incidents/${incidentId}/apply-playbook/`,
    { template_id: templateId },
  );
}

export function getTasks(incidentId: number) {
  return api.get<IncidentTask[]>(`/api/incidentflow/incidents/${incidentId}/tasks/`);
}

export function createTask(incidentId: number, data: { title: string; description?: string }) {
  return api.post<IncidentTask>(`/api/incidentflow/incidents/${incidentId}/tasks/`, data);
}

export function updateTask(taskId: number, data: Partial<IncidentTask>) {
  return api.patch<IncidentTask>(`/api/incidentflow/tasks/${taskId}/`, data);
}

export function deleteTask(taskId: number) {
  return api.delete<void>(`/api/incidentflow/tasks/${taskId}/`);
}

export function addTimelineNote(
  incidentId: number,
  data: { title: string; description?: string },
) {
  return api.post<{ id: number; title: string; timestamp: string }>(
    `/api/incidentflow/incidents/${incidentId}/add-note/`,
    data,
  );
}

export function updateIncidentStatus(incidentId: number, newStatus: string, note?: string) {
  return api.patch<{ status: string; incident_id: number }>(
    `/api/incidentflow/incidents/${incidentId}/status/`,
    { status: newStatus, note: note ?? "" },
  );
}

export function getReport(incidentId: number) {
  return api.get<{ report_markdown: string; incident_id: number }>(
    `/api/incidentflow/incidents/${incidentId}/report/`,
  );
}

export function downloadReport(incidentId: number, filename: string) {
  const url = `${API_BASE_URL}/api/incidentflow/incidents/${incidentId}/report/?format=markdown`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
