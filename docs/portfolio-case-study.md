# Portfolio Case Study

This file is a skeleton for the future CivicSec Lab portfolio write-up.

## 1. Problem

Describe the cyber, privacy, and platform-risk challenges faced by small civic organisations.

## 2. Why This Matters

Explain why under-resourced public-interest teams need practical, explainable risk tooling.

## 3. Product Concept

Summarise CivicSec Lab as a modular public-interest security intelligence platform.

## 4. System Architecture

Current foundation:

- Django REST Framework backend with organisation-scoped core APIs.
- ThreatBoard backend MVP with KEV/EPSS-style ingestion, matching, scoring, and generated risk events.
- React/Vite/Tailwind frontend with protected routing, platform layout, and ThreatBoard module UI.
- PostgreSQL target for local Docker development, with SQLite usable for quick local smoke testing.
- Redis and Celery wired for future background processing.
- Module pages present as placeholders only.

## 5. Data Model

Implemented core models:

- Organisation
- User
- Asset
- RiskEvent
- EvidenceItem
- ActionRecommendation
- Incident
- IncidentTimelineEntry
- AuditLog
- ProcessingJob
- ThreatBoard Vulnerability
- ThreatBoard VulnerabilityScore
- ThreatBoard AssetVulnerabilityMatch
- ThreatBoard ThreatIngestionRun

## 6. Module Breakdown

ThreatBoard now includes a backend MVP and frontend MVP. The UI provides explainable vulnerability triage, vulnerability detail views, asset match review, ingestion run history, and role-aware ingestion/matching controls with defensive-use framing.

Document LogLens, DataPrivacy Doctor, Misinformation Observatory, Civic Risk Graph, and IncidentFlow as they are implemented.

## 7. Security And Privacy Design

Describe authentication, roles, organisation-level checks, file handling, retention, audit logging, and sample-data safeguards.

## 8. Data Science Methods

Explain scoring, anomaly detection, privacy profiling, clustering, graph analysis, and limitations once implemented.

## 9. Engineering Trade-Offs

Capture why Django, React, PostgreSQL, Redis, Celery, Docker Compose, and open-source dependencies were chosen.

## 10. Screenshots

Add screenshots of the authenticated dashboard, asset list, risk event detail, incident detail, and module placeholders after the UI is reviewed.

## 11. Demo Walkthrough

Current walkthrough:

1. Seed Open Civic Aid demo data.
2. Sign in through Django admin with the demo admin account.
3. Open the React frontend.
4. Review dashboard counts, assets, risk events, incidents, and processing jobs.
5. Open ThreatBoard to review fictional vulnerabilities, asset matches, scoring explanations, and ingestion controls.
6. Open remaining planned module placeholders to show future scope without premature module logic.

## 12. Future Work

List realistic next improvements.

## 13. What I Learned

Reflect on technical, security, privacy, and product lessons.
