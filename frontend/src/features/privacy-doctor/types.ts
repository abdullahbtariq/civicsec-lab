export interface UploadedDataset {
  id: number;
  original_filename: string;
  file_size: number;
  row_count: number;
  column_count: number;
  processing_status: "pending" | "processing" | "complete" | "failed";
  processing_status_display: string;
  retention_policy: "delete_after_processing" | "retain_for_demo" | "manual_delete";
  original_file_deleted: boolean;
  privacy_risk_score: number;
  risk_band: "low" | "moderate" | "high" | "severe" | "";
  risk_band_display: string;
  risk_event: number | null;
  finding_count: number;
  direct_identifier_count: number;
  quasi_identifier_count: number;
  sensitive_attribute_count: number;
  uploaded_at: string;
  processed_at: string | null;
}

export interface DatasetColumnProfile {
  id: number;
  column_name: string;
  inferred_type: string;
  inferred_type_display: string;
  privacy_category:
    | "direct_identifier"
    | "quasi_identifier"
    | "sensitive_attribute"
    | "free_text_risk"
    | "low_risk"
    | "unknown";
  privacy_category_display: string;
  uniqueness_ratio: number;
  missingness_ratio: number;
  sample_values_masked: string[];
  risk_score: number;
  recommended_transformation: string;
  notes: string;
}

export interface PrivacyFinding {
  id: number;
  finding_type: string;
  finding_type_display: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  severity_display: string;
  confidence: number;
  affected_columns: string[];
  evidence: Record<string, unknown>;
  recommendation: string;
  created_at: string;
}

export interface PrivacyDoctorOverview {
  total_datasets: number;
  complete_datasets: number;
  high_risk_datasets: number;
  severe_risk_datasets: number;
  datasets_with_identifiers: number;
  datasets_with_sensitive: number;
  recent_datasets: UploadedDataset[];
}

export interface UploadResult {
  dataset_id: number;
  original_filename: string;
  row_count: number;
  column_count: number;
  privacy_risk_score: number;
  risk_band: string;
  findings_created: number;
  direct_identifier_count: number;
  quasi_identifier_count: number;
  sensitive_attribute_count: number;
  risk_event: { created: boolean; risk_event_id: number | null };
}

export interface DatasetParams {
  risk_band?: string;
  processing_status?: string;
  [key: string]: string | undefined;
}
