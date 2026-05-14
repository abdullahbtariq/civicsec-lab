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

The backend owns authentication, organisations, assets, risk events, evidence, incidents, reports, audit logs, and module APIs.

Current backend foundation:

- Split settings for base, development, production, and tests.
- PostgreSQL configuration through environment variables.
- Redis and Celery configuration.
- Django REST Framework installed.
- Custom user model with organisation and role fields.
- Organisation-scoped models and DRF viewsets for assets, risk events, evidence, recommendations, incidents, timeline entries, and processing jobs.
- CORS configuration for the local Vite frontend.
- Health endpoint at `/api/health/`.
- Current-user endpoint at `/api/auth/me/`.

## Frontend

The frontend is a Vite React TypeScript app with Tailwind CSS and React Router.

Current frontend foundation:

- Public login page that uses `/api/auth/me/` as the source of truth and points demo users to Django admin until API login is implemented.
- Auth provider and protected route wrapper.
- Authenticated app layout with sidebar, mobile navigation, topbar, role badge, and responsible-use note.
- Dashboard derived from existing backend list endpoints.
- Assets list/create/detail pages.
- Risk events list/detail pages.
- Incidents list/detail pages.
- Processing jobs page.
- Intentional placeholder pages for planned modules.
- Reusable UI components for cards, badges, inputs, tables, loading, empty, and error states.

## Background Jobs

Celery worker and beat services are wired in Docker Compose. Future jobs may handle vulnerability metadata refreshes, dataset scans, log analysis, report generation, and cleanup tasks.

## Data Boundary

The default repository data is fictional. Future uploads should be processed with data minimisation, retention controls, and clear warnings against using public demos for real sensitive data.
