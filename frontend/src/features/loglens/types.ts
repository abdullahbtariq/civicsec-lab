export interface LoginAnomaly {
  id: number;
  organisation: number;
  user_identifier: string;
  anomaly_type: string;
  anomaly_type_display: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  severity_display: string;
  confidence: number;
  confidence_band: "low" | "medium" | "high" | "very_high";
  risk_score: number;
  start_time: string;
  end_time: string;
  mitre_tactic: string;
  mitre_technique: string;
  evidence_detail: Record<string, unknown>;
  status: "new" | "reviewed" | "escalated" | "dismissed" | "false_positive";
  status_display: string;
  risk_event: number | null;
  linked_event_count: number;
  created_at: string;
  updated_at: string;
}

export interface LoginEvent {
  id: number;
  organisation: number;
  user_identifier: string;
  timestamp: string;
  ip_address: string | null;
  country: string;
  city: string;
  device_id: string;
  user_agent: string;
  event_type: string;
  success: boolean;
  resource_accessed: string;
  upload_batch: string;
  created_at: string;
}

export interface TopUser {
  user_identifier: string;
  anomaly_count: number;
  max_risk: number;
}

export interface AnomalyByType {
  anomaly_type: string;
  count: number;
}

export interface LogLensOverview {
  total_events: number;
  total_anomalies: number;
  open_anomalies: number;
  high_risk_count: number;
  impossible_travel_count: number;
  failed_burst_count: number;
  sensitive_access_count: number;
  anomalies_by_type: AnomalyByType[];
  top_affected_users: TopUser[];
  latest_anomalies: LoginAnomaly[];
}

export interface AnomalyParams {
  anomaly_type?: string;
  severity?: string;
  status?: string;
  user_identifier?: string;
  [key: string]: string | undefined;
}
