# API Reference

CivicSec Lab uses Django REST Framework for JSON APIs. All endpoints require authentication except the health check. All requests to mutating endpoints must include the `X-CSRFToken` header.

**Base URL**: `http://localhost:8000` (local dev). Configure via `VITE_API_BASE_URL` on the frontend.

## Authentication

CivicSec Lab uses Django session authentication. Sign in via the Django admin (`/admin/`) to establish a session, then call API endpoints with `credentials: "include"`.

```text
GET /api/auth/me/
```

Returns the current user and organisation:

```json
{
  "id": 1,
  "email": "analyst@opencivicaid.test",
  "full_name": "Analyst User",
  "role": "analyst",
  "organisation": {
    "id": 1,
    "name": "Open Civic Aid",
    "slug": "open-civic-aid"
  }
}
```

## Health

```text
GET /api/health/
```

No authentication required.

```json
{ "status": "ok", "service": "civicsec-backend" }
```

---

## Access Rules

| Role | Read | Create / Update | Delete | Admin actions |
|---|---|---|---|---|
| Viewer | ✅ | ❌ | ❌ | ❌ |
| Analyst | ✅ | ✅ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| Superuser | ✅ all orgs | ✅ all orgs | ✅ all orgs | ✅ |

All non-superuser access is org-scoped: you can only see and act on your own organisation's data.

---

## Core Platform Endpoints

```text
GET    /api/organisations/
GET    /api/organisations/{id}/
PATCH  /api/organisations/{id}/

GET    /api/assets/
POST   /api/assets/
GET    /api/assets/{id}/
PATCH  /api/assets/{id}/
DELETE /api/assets/{id}/

GET    /api/risk-events/
POST   /api/risk-events/
GET    /api/risk-events/{id}/
PATCH  /api/risk-events/{id}/
DELETE /api/risk-events/{id}/

GET    /api/evidence-items/
POST   /api/evidence-items/
GET    /api/evidence-items/{id}/
PATCH  /api/evidence-items/{id}/
DELETE /api/evidence-items/{id}/

GET    /api/recommendations/
POST   /api/recommendations/
GET    /api/recommendations/{id}/
PATCH  /api/recommendations/{id}/
DELETE /api/recommendations/{id}/

GET    /api/incidents/
POST   /api/incidents/
GET    /api/incidents/{id}/
PATCH  /api/incidents/{id}/
DELETE /api/incidents/{id}/

GET    /api/incident-timeline/
POST   /api/incident-timeline/
GET    /api/incident-timeline/{id}/
PATCH  /api/incident-timeline/{id}/
DELETE /api/incident-timeline/{id}/

GET    /api/processing-jobs/
GET    /api/processing-jobs/{id}/
```

Common filters: `?organisation={id}`, `?status=open`, `?severity=high`.

---

## ThreatBoard Endpoints

Vulnerability metadata is global. Asset matches and ingestion runs are org-scoped.

```text
GET  /api/threatboard/overview/

GET  /api/threatboard/vulnerabilities/
GET  /api/threatboard/vulnerabilities/{id}/

GET  /api/threatboard/scores/
GET  /api/threatboard/scores/{id}/

GET    /api/threatboard/asset-matches/
POST   /api/threatboard/asset-matches/
GET    /api/threatboard/asset-matches/{id}/
PATCH  /api/threatboard/asset-matches/{id}/
DELETE /api/threatboard/asset-matches/{id}/

GET  /api/threatboard/ingestion-runs/
GET  /api/threatboard/ingestion-runs/{id}/

POST /api/threatboard/ingest-kev/
POST /api/threatboard/enrich-epss/
POST /api/threatboard/match-assets/
```

Filters:
- Vulnerabilities: `?cve_id=CVE-2024&vendor=Example&kev_only=true&severity=critical`
- Asset matches: `?risk_band=critical&remediation_status=unreviewed&internet_exposed=true`

Trigger endpoints (`ingest-kev`, `enrich-epss`, `match-assets`) require analyst or admin role.

**Overview response shape:**

```json
{
  "vulnerability_count": 12,
  "kev_vulnerability_count": 4,
  "asset_match_count": 8,
  "critical_match_count": 2,
  "high_match_count": 3,
  "overdue_match_count": 1,
  "latest_matches": [],
  "latest_ingestion_runs": []
}
```

---

## LogLens Endpoints

All endpoints are org-scoped.

```text
GET   /api/loglens/overview/

GET   /api/loglens/anomalies/
GET   /api/loglens/anomalies/{id}/
PATCH /api/loglens/anomalies/{id}/

POST  /api/loglens/upload-logs/           (multipart/form-data, field: file)
POST  /api/loglens/run-detection/
```

Filters for anomaly list: `?status=new&severity=high&anomaly_type=impossible_travel`

**Upload response shape:**

```json
{
  "job_id": 42,
  "message": "Log file uploaded. Run detection to process.",
  "event_count": 500
}
```

**Anomaly shape:**

```json
{
  "id": 7,
  "anomaly_type": "impossible_travel",
  "severity": "high",
  "confidence_score": 0.85,
  "risk_score": 72,
  "status": "new",
  "title": "Impossible travel detected for user alice@example.org",
  "user_identifier": "alice@example.org",
  "mitre_tactic": "T1133 External Remote Services (signal — requires review)",
  "evidence_snapshot": { ... },
  "created_at": "2026-06-01T10:00:00Z"
}
```

---

## DataPrivacy Doctor Endpoints

All endpoints are org-scoped.

```text
GET    /api/privacy-doctor/overview/

GET    /api/privacy-doctor/datasets/
POST   /api/privacy-doctor/datasets/           (multipart/form-data, field: file)
GET    /api/privacy-doctor/datasets/{id}/
DELETE /api/privacy-doctor/datasets/{id}/

GET    /api/privacy-doctor/datasets/{id}/columns/
```

**Upload response shape:**

```json
{
  "id": 3,
  "original_filename": "sample_dataset.csv",
  "processing_status": "complete",
  "privacy_risk_score": 68,
  "risk_band": "high",
  "row_count": 1200,
  "column_count": 9
}
```

**Column profile shape:**

```json
[
  {
    "column_name": "email",
    "inferred_type": "string",
    "null_rate": 0.02,
    "unique_rate": 0.99,
    "pii_type": "email",
    "is_identifier": true,
    "is_quasi_identifier": false,
    "masked_sample": "jo**@exam**.com"
  }
]
```

---

## Misinformation Observatory Endpoints

All endpoints are org-scoped.

```text
GET  /api/observatory/overview/

GET  /api/observatory/datasets/
POST /api/observatory/datasets/                       (multipart/form-data, field: file)
GET  /api/observatory/datasets/{id}/
GET  /api/observatory/datasets/{id}/clusters/
GET  /api/observatory/datasets/{id}/bursts/
GET  /api/observatory/datasets/{id}/entities/

GET   /api/observatory/clusters/
GET   /api/observatory/clusters/{id}/
PATCH /api/observatory/clusters/{id}/

GET   /api/observatory/clusters/{id}/keywords/
GET   /api/observatory/clusters/{id}/entities/
```

Filters for cluster list: `?status=needs_review&dataset={id}`

**Cluster shape:**

```json
{
  "id": 2,
  "title": "municipal_services civic_data council",
  "cluster_size": 48,
  "sentiment_score": -0.23,
  "status": "needs_review",
  "status_display": "Needs Review",
  "dataset": 1,
  "linked_risk_event": null,
  "created_at": "2026-06-05T09:00:00Z"
}
```

**Keyword burst shape:**

```json
{
  "keyword": "council",
  "burst_count": 42,
  "baseline_count": 8,
  "burst_ratio": 5.25,
  "burst_severity": "medium",
  "window_start": "2026-06-05T00:00:00Z",
  "window_end": "2026-06-05T23:59:59Z"
}
```

---

## IncidentFlow Endpoints

```text
GET  /api/incidentflow/overview/

GET    /api/incidents/
POST   /api/incidents/
GET    /api/incidents/{id}/
PATCH  /api/incidents/{id}/
DELETE /api/incidents/{id}/

GET    /api/incident-timeline/
POST   /api/incident-timeline/
GET    /api/incident-timeline/{id}/
PATCH  /api/incident-timeline/{id}/
```

Filters: `?status=open&severity=high&incident_type=data_breach`

---

## Civic Risk Graph Endpoint

```text
GET /api/graph/
```

Returns all graph nodes and edges for the authenticated user's organisation.

```json
{
  "nodes": [
    {
      "id": "asset-1",
      "type": "asset",
      "label": "Civic Portal",
      "severity": null,
      "meta": { "asset_type": "web_application", "criticality": "high", "internet_exposed": true },
      "url": "/assets/1"
    },
    {
      "id": "risk-3",
      "type": "risk_event",
      "label": "High-risk CVE match on Civic Portal",
      "severity": "high",
      "meta": { "source_module": "threatboard", "status": "new", "confidence": 0.82 },
      "url": "/risk-events/3"
    }
  ],
  "edges": [
    {
      "id": "e-asset-1--risk-3",
      "source": "asset-1",
      "target": "risk-3",
      "type": "risk_event_affects_asset",
      "label": ""
    }
  ]
}
```

Node types: `asset`, `vulnerability`, `risk_event`, `anomaly`, `cluster`, `dataset`, `incident`.

All data is org-scoped. Requires `IsOrganisationScopedRole`.

---

## Error Responses

All endpoints use standard DRF error shapes:

```json
{ "detail": "Authentication credentials were not provided." }
```

```json
{ "detail": "You do not have permission to perform this action." }
```

```json
{ "file": ["File type not supported. Upload a CSV file."] }
```

HTTP status codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthenticated), 403 (Forbidden), 404 (Not Found), 500 (Server Error).
