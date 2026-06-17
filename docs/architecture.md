# Architecture Overview

CivicSec Lab is a modular monorepo with a Django backend, a React frontend, PostgreSQL for relational data, Redis for caching and Celery messaging, and Celery workers for background processing.

## High-Level Shape

```text
React/Vite/TypeScript frontend  (port 5173)
            |
            | HTTP JSON API  (credentialed + CSRF)
            v
Django REST Framework backend   (port 8000)
            |
            +--> PostgreSQL     (primary data store)
            +--> Redis          (cache, Celery broker)
            +--> Celery worker  (background jobs — reserved for future scheduling)
            +--> Celery beat    (periodic scheduler — reserved for future scheduling)
```

## Backend

The backend is a Django 5.2 project with DRF, organised as a collection of bounded-context apps under `backend/apps/`.

### Apps

| App | Responsibility |
|---|---|
| `accounts` | Custom User model with organisation FK and role field |
| `organisations` | Organisation model and viewset |
| `assets` | Asset registry with criticality, sensitivity, and exposure fields |
| `risk` | RiskEvent, EvidenceItem, ActionRecommendation — the shared risk layer |
| `incidents` | Incident records, timeline entries, and playbook scaffolding |
| `threatboard` | KEV/EPSS ingestion, EPSS scoring, asset matching, risk scoring |
| `loglens` | Login log ingestion, rule-based anomaly detection, RiskEvent generation |
| `privacy_doctor` | Dataset upload, column profiling, PII detection, privacy risk scoring |
| `misinformation` | NLP pipeline — TF-IDF clustering, keyword bursts, sentiment, NER |
| `common` | Shared models (ProcessingJob), permissions, viewsets, graph data builder |
| `auditlog` | Append-only audit trail |

### Key conventions

- **Organisation scoping**: every model with user data has an `organisation` FK. The `IsOrganisationScopedRole` permission class plus an `OrganisationScopedModelViewSet` base class enforce org isolation and role checks on every endpoint.
- **RiskEvent** is the shared currency between modules. Each module generates `RiskEvent` records when it detects a significant finding; the dashboard and graph consume these.
- **Split settings**: `civicsec.settings.base` → `dev`, `production`, or `test`. Test settings use SQLite in-memory and disable migrations for speed.
- **Migration policy**: every model change must have a migration committed alongside it. The Docker Compose startup command runs `python manage.py migrate --noinput` before `runserver`.

### URL structure

```text
/api/health/                          — liveness check
/api/auth/me/                         — current user
/api/                                 — DRF DefaultRouter (assets, risk-events, incidents, …)
/api/threatboard/                     — ThreatBoard sub-router
/api/loglens/                         — LogLens sub-router
/api/privacy-doctor/                  — DataPrivacy Doctor sub-router
/api/observatory/                     — Misinformation Observatory sub-router
/api/incidentflow/                    — IncidentFlow sub-router
/api/graph/                           — Civic Risk Graph endpoint
```

## Frontend

The frontend is a Vite 5 / React 18 / TypeScript app with Tailwind CSS and React Router 7.

### Feature structure

Each module has its own feature folder under `frontend/src/features/`:

```text
features/
  auth/              — Login page and auth context
  dashboard/         — Cross-module summary dashboard
  assets/            — Asset list, create, detail
  risk-events/       — Risk event list and detail
  incidents/         — Incident list, create, detail
  threatboard/       — ThreatBoard module UI
  loglens/           — LogLens module UI
  privacy-doctor/    — DataPrivacy Doctor module UI
  misinformation/    — Misinformation Observatory UI
  risk-graph/        — Civic Risk Graph (React Flow)
  processing-jobs/   — Background job status
```

### API client

`frontend/src/lib/api.ts` exports a typed `api` object and `API_BASE_URL`. All API calls go to `http://localhost:8000` (configurable via `VITE_API_BASE_URL`). File uploads use raw `fetch()` with the same base URL rather than the typed client, since `FormData` bodies don't need JSON serialisation.

The backend sets `SESSION_COOKIE_SAMESITE = "Lax"` and `CSRF_COOKIE_SAMESITE = "Lax"`, so cross-origin credentialed requests work for the local dev setup (frontend on 5173, backend on 8000). All mutating requests include `X-CSRFToken`.

### Graph visualisation

The Civic Risk Graph page uses `@xyflow/react` v12. Nodes are auto-laid-out in type-based columns. Node types have distinct colours; severity is indicated by a dot badge inside the node card.

## Background Jobs

Redis and Celery are wired but not used for scheduled tasks in v1.0. The `ProcessingJob` model tracks the status of long-running operations (NLP pipeline, KEV ingestion) that are currently triggered synchronously on upload. Moving these to async Celery tasks is the primary post-v1.0 improvement.

## Testing

The test suite lives in `backend/tests/`. All tests use `pytest` with `pytest-django`.

| File | Coverage area |
|---|---|
| `test_health.py` | Health endpoint |
| `test_core_models.py` | Organisation scoping, user model |
| `test_core_api.py` | Asset, risk event, incident APIs |
| `test_seed_demo.py` | Seed command idempotency |
| `test_threatboard_models_services.py` | KEV/EPSS scoring and matching logic |
| `test_threatboard_api_seed.py` | ThreatBoard API with seeded data |
| `test_loglens.py` | Anomaly detection rules and LogLens API |
| `test_privacy_doctor.py` | Column profiling, PII detection, risk scoring |
| `test_observatory.py` | NLP pipeline, clustering, Observatory API |
| `test_incidentflow.py` | Incident and timeline APIs |

Run with: `pytest` (from `backend/` with the virtualenv active, or `docker compose exec backend pytest`).

## Security Model

See `docs/security-model.md` for the full model. Key points:

- All endpoints require authentication (`IsAuthenticated` at minimum).
- Organisation isolation is enforced in the permission layer, not only in queryset filters.
- File uploads are validated for type and size; the original file is deleted after processing.
- No user-supplied data is executed or rendered as HTML.
- Outputs are decision-support signals; all anomaly and risk outputs are labelled as requiring human review.
