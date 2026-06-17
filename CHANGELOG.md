# Changelog

All notable changes to CivicSec Lab will be documented here.

The format follows the spirit of [Keep a Changelog](https://keepachangelog.com/), and this project uses semantic versioning once public releases begin.

---

## [1.0.0] — 2026-06-14

First complete portfolio release. All eight phases shipped.

### Added — Phase 7: Civic Risk Graph

- `GET /api/graph/` endpoint returning org-scoped graph data: nodes (asset, vulnerability, risk_event, anomaly, cluster, dataset, incident) and edges derived from all FK/M2M cross-module relationships.
- `backend/apps/common/graph.py` — pure data-builder with no new models or migrations; capped per-type to keep the graph readable.
- `@xyflow/react` added to frontend dependencies.
- `frontend/src/features/risk-graph/` — React Flow graph page with column-based auto-layout, legend, minimap, zoom controls, and click-to-inspect detail panel.
- Custom `CivicGraphNode` component with per-type colour stripes and severity badges.
- `NodeDetailPanel` with humanised metadata fields and a deep-link to the originating record.

### Added — Phase 6: Misinformation Observatory

- `UploadedDataset`, `DatasetColumnSample`, `NarrativeCluster`, `KeywordBurst`, `EntityMention` models and migrations.
- NLP pipeline: CSV ingestion → TF-IDF vectorisation → MiniBatchKMeans clustering → keyword burst detection → lexicon sentiment → spaCy named entity extraction.
- `seed_observatory` management command with fictional post dataset.
- REST API: dataset CRUD, cluster list/detail with status transitions, keyword bursts, entity mentions, and observatory overview stats.
- Full Observatory frontend: overview, dataset list, dataset detail (clusters, bursts, entities), cluster list, cluster detail, and upload page.
- Cautious observable language throughout — outputs labelled as "narrative clusters" and "coordinated-looking signals", never as misinformation.
- `ClusterStatusBadge` and `SentimentBar` UI components.

### Added — Phase 5: IncidentFlow

- `Incident` and `IncidentTimelineEntry` models (in core platform).
- Incident list/create/detail API endpoints.
- Timeline entry creation and retrieval.
- IncidentFlow frontend: overview, incident list, create incident form, and incident detail with timeline.

### Added — Phase 4: DataPrivacy Doctor

- `UploadedDataset` and `DatasetColumnProfile` models and migrations.
- Secure CSV upload with file-type and size validation; original file deleted after processing.
- Column profiler: type inference, null rate, uniqueness, masked sample values.
- PII/quasi-identifier detector covering 14 field categories.
- Composite privacy risk score with five factors; risk bands: low, medium, high, severe.
- RiskEvent auto-generation for high/severe datasets.
- No seed command for DataPrivacy Doctor — data is produced by CSV upload through the UI.
- DataPrivacy Doctor frontend: overview, upload, dataset list, and dataset detail.

### Added — Phase 3: LogLens

- `LoginEvent` and `LoginAnomaly` models and migrations.
- Synthetic login CSV upload with schema validation.
- Six anomaly detectors: failed login burst, suspicious success after failures, impossible travel, new device, unusual hour, sensitive access after anomaly.
- Explainable `LoginAnomaly` objects with `evidence_snapshot`, `confidence_score`, and `risk_score`.
- Cautious MITRE ATT&CK-style tactic mappings.
- RiskEvent generation for open/escalated anomalies.
- `generate_synthetic_logs` and `run_loglens_detection` management commands.
- LogLens frontend: overview, anomaly list, anomaly detail with evidence timeline, and log upload.

### Added — Phase 2: ThreatBoard

- `Vulnerability`, `VulnerabilityScore`, `VulnerabilityIngestionRun`, and `AssetVulnerabilityMatch` models and migrations.
- KEV-style ingestion service with idempotent CVE upsert.
- EPSS-style score enrichment with decay and staleness tracking.
- Asset matching service with name/type/IP heuristics.
- Explainable risk scoring: EPSS score, KEV bonus, severity weight, internet exposure, sensitive-data flag.
- Risk band labels: low, medium, high, critical.
- RiskEvent auto-generation for high/critical asset matches.
- ThreatBoard baseline data seeded via `seed_demo`; live pipeline via `ingest_kev`, `enrich_epss`, `match_vulnerabilities`.
- ThreatBoard frontend: overview, vulnerability list, vulnerability detail, asset match list, match detail, ingestion run history.

### Added — Phase 1: Core Platform Shell

- Custom `User` model with `organisation` FK and `role` field.
- `Organisation` model.
- `Asset` model with criticality, data sensitivity, and internet-exposure fields.
- `RiskEvent` model with source module, severity, confidence, status, and evidence fields.
- `EvidenceItem`, `ActionRecommendation`, `Incident`, `IncidentTimelineEntry`, `AuditLog`, `ProcessingJob` models.
- `IsOrganisationScopedRole` DRF permission class.
- `OrganisationScopedModelViewSet` base class.
- `seed_demo` management command creating Open Civic Aid org, three users, and sample assets/risk events.
- React 18 / TypeScript / Vite / Tailwind CSS frontend shell.
- Login page, protected route wrapper, AppLayout with sidebar and topbar.
- Dashboard, assets, risk events, incidents, and processing jobs pages.
- Shared UI component library: Button, Badge, Card, Input, Select, Textarea, DataTable, LoadingState, EmptyState, ErrorState, SeverityBadge, ConfidenceBadge, RiskScoreBadge, StatusBadge.

### Added — Phase 0: Project Setup

- Monorepo scaffold with `backend/`, `frontend/`, `docs/`, `sample-data/`, `notebooks/`.
- Apache-2.0 license, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, RESPONSIBLE_USE, ROADMAP, CHANGELOG.
- Docker Compose stack: backend, frontend, PostgreSQL, Redis, Celery worker, Celery beat.
- Django split settings (base, dev, production, test).
- GitHub Actions CI workflow.
- pre-commit, Ruff, Black, pytest configuration.
- `.env.example` with all required environment variables.
- `docs/` skeleton: architecture, API, data model, security model, responsible use, module docs, portfolio case study.
- Fictional sample data CSVs: `sample_logs.csv`, `sample_posts.csv`, `sample_dataset.csv`.

---

## [0.1.0] — 2026-06-01

Initial repository commit. Project skeleton only.
