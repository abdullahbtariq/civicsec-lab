# API

CivicSec Lab uses Django REST Framework for JSON APIs. Phase 1 backend foundation endpoints require authentication except for health checks.

## Health

```text
GET /api/health/
```

Response:

```json
{
  "status": "ok",
  "service": "civicsec-backend"
}
```

## Authentication Context

```text
GET /api/auth/me/
```

Returns the authenticated user and organisation summary:

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

## Core Endpoints

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
POST   /api/processing-jobs/
GET    /api/processing-jobs/{id}/
PATCH  /api/processing-jobs/{id}/
DELETE /api/processing-jobs/{id}/
```

Organisation creation and deletion are restricted to superusers. Organisation admins can update their own organisation.

## ThreatBoard Endpoints

ThreatBoard endpoints require authentication. Vulnerability metadata is global public metadata, while asset matches and overview counts are organisation-scoped.

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

Simple filters:

- `/api/threatboard/vulnerabilities/?cve_id=CVE-2024&vendor=Example&product=Portal&kev_only=true`
- `/api/threatboard/scores/?cve_id=CVE-2024`
- `/api/threatboard/asset-matches/?risk_band=critical&remediation_status=unreviewed&internet_exposed=true`

Trigger endpoints are POST-only. Viewer users cannot trigger ingestion or matching. Analyst and admin users can trigger defensive ingestion, EPSS enrichment, and asset matching.

Example overview response:

```json
{
  "vulnerability_count": 3,
  "kev_vulnerability_count": 1,
  "asset_match_count": 3,
  "critical_match_count": 1,
  "high_match_count": 0,
  "overdue_match_count": 1,
  "latest_matches": [],
  "latest_ingestion_runs": []
}
```

## Access Rules

- Superusers can see all records.
- Regular users can only list and retrieve records belonging to their organisation.
- Users without an organisation see empty lists.
- Viewer users are read-only.
- Analyst and admin users can create/update operational records.
- Delete access for operational records is limited to admin users.
- Organisation creation and deletion are superuser-only.

Organisation creation and user management are intentionally minimal at this stage.
