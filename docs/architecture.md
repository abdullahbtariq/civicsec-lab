# Architecture Overview

CivicSec Lab is a modular monorepo with a Django backend, a React frontend, PostgreSQL for relational data, Redis for caching and Celery messaging, and Celery workers for future background processing.

## High-Level Shape

```text
React/Vite frontend
        |
        | HTTP JSON API
        v
Django REST Framework backend
        |
        +--> PostgreSQL
        +--> Redis
        +--> Celery worker and beat
```

## Backend

The backend owns authentication, organisations, assets, risk events, evidence, incidents, reports, audit logs, and module APIs. Domain models are intentionally not implemented in Phase 0.

Current backend foundation:

- Split settings for base, development, production, and tests.
- PostgreSQL configuration through environment variables.
- Redis and Celery configuration.
- Django REST Framework installed.
- Placeholder app packages for planned modules.
- Health endpoint at `/api/health/`.

## Frontend

The frontend is a Vite React TypeScript app with Tailwind CSS. Phase 0 provides a polished dashboard shell and placeholder module cards without routing or module logic.

## Background Jobs

Celery worker and beat services are wired in Docker Compose. Future jobs may handle vulnerability metadata refreshes, dataset scans, log analysis, report generation, and cleanup tasks.

## Data Boundary

The default repository data is fictional. Future uploads should be processed with data minimisation, retention controls, and clear warnings against using public demos for real sensitive data.
