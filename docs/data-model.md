# Data Model

CivicSec Lab's data model is organised into a shared platform layer and per-module extensions. All operational objects are organisation-scoped unless explicitly noted.

---

## Platform Layer (shared across all modules)

### Organisation

Represents a workspace / tenant.

| Field | Description |
|---|---|
| `name` | Display name |
| `slug` | URL-safe unique identifier |
| `description` | Freetext |
| `sector` | Sector category |
| `country` | Two-letter country code |
| `risk_profile` | `low` / `medium` / `high` / `elevated` |

### User

Custom Django user model (`accounts.User`). Email is the unique login identity.

| Field | Description |
|---|---|
| `email` | Unique login identity |
| `full_name` | Display name |
| `organisation` | FK to Organisation |
| `role` | `admin` / `analyst` / `viewer` |

Helper properties: `is_org_admin`, `is_analyst`, `is_viewer`.

### Asset

Registered organisational system, service, repository, or tool.

| Field | Description |
|---|---|
| `name` | Asset name |
| `asset_type` | web_app / api / database / network / endpoint / cloud / repo / other |
| `criticality` | low / medium / high / critical |
| `internet_exposed` | Boolean |
| `data_sensitivity` | none / internal / confidential / sensitive |
| `vendor`, `product`, `version` | Optional software metadata |
| `tags` | JSON list |

### RiskEvent

The shared risk signal object. All modules write to this model.

| Field | Description |
|---|---|
| `source_module` | threatboard / loglens / privacy_doctor / misinformation / manual |
| `event_type` | Free-form category string |
| `title` | Short summary |
| `summary` | Detail |
| `severity` | info / low / medium / high / critical |
| `confidence` | 0.0–1.0 float |
| `status` | new / triaged / investigating / resolved / false_positive / closed |
| `affected_asset` | Optional FK to Asset |
| `risk_score` | 0–100 int |
| `evidence_summary` | Freetext / JSON |
| `framework_mappings` | JSON (MITRE ATT&CK-style hints) |
| `tags` | JSON list |
| `first_seen`, `last_seen` | Datetimes |

Computed helpers: `severity_rank`, `confidence_band`, `is_open`.

### EvidenceItem

Evidence linked to a RiskEvent.

| Field | Description |
|---|---|
| `risk_event` | FK to RiskEvent |
| `evidence_type` | log_entry / screenshot / file / url / note / other |
| `title` | Short summary |
| `source` | Where the evidence came from |
| `observed_at` | When observed |
| `confidence` | 0.0–1.0 float |
| `raw_reference` | URL or identifier |
| `metadata` | JSON |

### ActionRecommendation

Response recommendation linked to a RiskEvent.

| Field | Description |
|---|---|
| `risk_event` | FK to RiskEvent |
| `title` | Action summary |
| `priority` | low / medium / high / critical |
| `status` | pending / in_progress / done / dismissed |
| `owner` | Optional FK to User |
| `due_date` | Optional date |
| `framework_mapping` | Freetext MITRE or policy reference |

### Incident

Top-level incident response record.

| Field | Description |
|---|---|
| `title`, `description` | Incident summary |
| `severity` | info / low / medium / high / critical |
| `status` | open / investigating / contained / closed / resolved |
| `incident_type` | unauthorised_access / data_breach / phishing / ransomware / ddos / insider_threat / narrative_attack / privacy_violation / other |
| `opened_at`, `closed_at` | Datetimes |
| `owner` | Optional FK to User |
| `linked_risk_events` | M2M to RiskEvent |
| `timeline_summary` | Freetext |
| `lessons_learned` | Freetext |

### IncidentTimelineEntry

Timestamped note on an incident.

| Field | Description |
|---|---|
| `incident` | FK to Incident |
| `timestamp` | When the event occurred |
| `entry_type` | detection / containment / evidence / comms / recovery / review / note |
| `title`, `description` | Entry content |
| `actor` | Who performed or observed this |

### AuditLog

Append-only audit trail. Use `record_audit_event()` from `apps.auditlog.utils`.

| Field | Description |
|---|---|
| `actor` | FK to User |
| `action` | Action string |
| `object_type`, `object_id` | Target object reference |
| `ip_address`, `user_agent` | Request context |
| `metadata` | JSON |

### ProcessingJob

Background or long-running job tracker.

| Field | Description |
|---|---|
| `job_type` | Module-specific job type string |
| `status` | pending / running / complete / failed |
| `started_at`, `finished_at` | Datetimes |
| `error_message` | If failed |
| `progress` | 0–100 int |
| `metadata` | JSON |

---

## ThreatBoard Module

### Vulnerability

Global public vulnerability metadata. Not org-scoped.

| Field | Description |
|---|---|
| `cve_id` | Unique CVE ID (e.g. CVE-2024-12345) |
| `title`, `description` | Vulnerability summary |
| `vendor`, `product` | Affected software |
| `kev_date_added` | When added to the KEV catalog |
| `kev_due_date` | Remediation deadline |
| `ransomware_campaign_use` | Boolean |
| `required_action` | Recommended remediation |
| `source` | cisa_kev / manual / osv / other |

### VulnerabilityScore

One-to-one enrichment metadata for a Vulnerability.

| Field | Description |
|---|---|
| `epss_score` | 0.0–1.0 exploit probability estimate |
| `epss_percentile` | 0.0–1.0 |
| `cvss_score` | 0.0–10.0 |
| `cvss_severity` | none / low / medium / high / critical |
| `kev_known_exploited` | Boolean |
| `last_epss_check` | Datetime |

### AssetVulnerabilityMatch

Org-scoped relationship between an Asset and a Vulnerability.

| Field | Description |
|---|---|
| `asset`, `vulnerability` | FKs (unique together per org) |
| `match_method` | name / product / type / manual |
| `match_confidence` | 0.0–1.0 |
| `calculated_risk_score` | 0–100 |
| `risk_band` | low / medium / high / critical |
| `remediation_status` | unreviewed / in_progress / patched / mitigated / accepted / dismissed |
| `score_breakdown` | JSON — per-factor contribution |

### ThreatIngestionRun (VulnerabilityIngestionRun)

Run history for KEV/EPSS/matching/scoring jobs.

| Field | Description |
|---|---|
| `run_type` | kev_ingest / epss_enrich / asset_match / risk_score |
| `status` | pending / running / complete / failed |
| `records_processed`, `records_created`, `records_updated` | Counts |
| `error_message` | If failed |
| `metadata` | JSON |

---

## LogLens Module

### LoginEvent

Individual parsed login record from an uploaded CSV.

| Field | Description |
|---|---|
| `user_identifier` | Username or pseudonymous ID |
| `ip_address` | IPv4 or IPv6 |
| `country`, `city` | Geographic context |
| `latitude`, `longitude` | Optional coordinates |
| `login_result` | success / failure |
| `device_fingerprint` | Device identifier |
| `resource_accessed` | Optional resource name |
| `event_timestamp` | When the login occurred |

### LoginAnomaly

A detected suspicious pattern.

| Field | Description |
|---|---|
| `anomaly_type` | failed_burst / suspicious_success / impossible_travel / new_device / unusual_hour / sensitive_access_after_anomaly |
| `title` | Short description |
| `user_identifier` | Subject of the anomaly |
| `severity` | info / low / medium / high / critical |
| `status` | new / investigating / escalated / resolved / false_positive |
| `confidence_score` | 0.0–1.0 |
| `risk_score` | 0–100 |
| `mitre_tactic` | ATT&CK-style label (with "signal — requires review" suffix) |
| `evidence_snapshot` | JSON — supporting login events |
| `risk_event` | Optional FK to generated RiskEvent |

---

## DataPrivacy Doctor Module

### UploadedDataset (Privacy Doctor)

Upload record in `apps.privacy_doctor`.

| Field | Description |
|---|---|
| `original_filename` | Uploaded filename |
| `processing_status` | pending / processing / complete / failed |
| `privacy_risk_score` | 0–100 |
| `risk_band` | low / medium / high / severe |
| `row_count`, `column_count` | Dataset dimensions |
| `risk_event` | Optional FK to generated RiskEvent |

### DatasetColumnProfile

One record per column in an UploadedDataset.

| Field | Description |
|---|---|
| `column_name` | Column header |
| `inferred_type` | string / integer / float / date / boolean / mixed |
| `null_rate` | 0.0–1.0 |
| `unique_rate` | 0.0–1.0 |
| `pii_type` | Detected category or null |
| `is_identifier` | Direct identifier flag |
| `is_quasi_identifier` | Quasi-identifier flag |
| `masked_sample` | Partially masked example value |

---

## Misinformation Observatory Module

### UploadedDataset (Observatory)

Upload record in `apps.misinformation`.

| Field | Description |
|---|---|
| `original_filename` | Uploaded filename |
| `processing_status` | pending / processing / complete / failed |
| `post_count` | Number of parsed posts |

### DatasetColumnSample

Preview sample of column values for the upload.

### NarrativeCluster

A group of topically similar posts.

| Field | Description |
|---|---|
| `dataset` | FK to UploadedDataset |
| `title` | Top-5 TF-IDF terms joined |
| `cluster_index` | KMeans cluster number |
| `cluster_size` | Number of posts in cluster |
| `sentiment_score` | −1.0 to +1.0 |
| `status` | draft / needs_review / escalated / dismissed |
| `linked_risk_event` | Optional FK to generated RiskEvent |

### KeywordBurst

A keyword whose frequency spiked above baseline.

| Field | Description |
|---|---|
| `dataset` | FK to UploadedDataset |
| `keyword` | Keyword string |
| `burst_count` | Posts in current window |
| `baseline_count` | Posts in baseline window |
| `burst_ratio` | current / baseline |
| `burst_severity` | low / medium / high |
| `window_start`, `window_end` | Burst time window |

### EntityMention

A named entity extracted from the dataset.

| Field | Description |
|---|---|
| `dataset` | FK to UploadedDataset |
| `entity_text` | Entity string |
| `entity_type` | PERSON / ORG / GPE / LOC |
| `mention_count` | Frequency in dataset |
| `cluster` | Optional FK to NarrativeCluster |

---

## Common App

### ProcessingJob

(See Platform Layer above — registered in `apps.common`.)

### Graph Data (no model)

The Civic Risk Graph (`GET /api/graph/`) is a read-only data view built in `apps.common.graph.build_graph()`. It reads all the models above and returns serialised node and edge dictionaries. No new models or tables.
