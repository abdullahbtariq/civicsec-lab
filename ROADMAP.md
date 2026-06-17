# Roadmap

## Phase 0: Project Setup ✅

- Monorepo structure.
- Apache-2.0 license and community files.
- Docker Compose local development stack.
- Minimal Django backend and React frontend.
- PostgreSQL, Redis, and Celery wiring.
- Documentation skeleton and fictional sample data.

## Phase 1: Core Platform Shell ✅

- Custom user model and organisation model.
- Role foundations (admin, analyst, viewer).
- Shared asset, risk event, evidence, recommendation, incident, audit, and processing job models.
- Seeded Open Civic Aid demo workspace.
- Authenticated frontend platform shell with sidebar, dashboard, assets, risk events, and incidents.
- Global navigation, protected routes, and role-aware affordances.

## Phase 2: ThreatBoard ✅

- Public vulnerability metadata ingestion (KEV-style feed).
- EPSS-style enrichment and score decay.
- Exposure and asset matching.
- Explainable defensive risk scoring with five contributing factors.
- RiskEvent creation for high and critical findings.
- ThreatBoard frontend with overview, vulnerability list/detail, match list/detail, ingestion run history, and role-aware action controls.

## Phase 3: LogLens ✅

- Synthetic login log CSV upload with schema validation.
- Six rule-based anomaly detectors: failed login burst, suspicious success after failures, impossible travel, new device, unusual hour, and sensitive access after anomaly.
- Explainable LoginAnomaly objects with evidence timelines and confidence scores.
- RiskEvent creation for reviewable login signals.
- MITRE ATT&CK-style tactic mappings (cautiously labelled).
- LogLens frontend with overview, anomaly list, detail view, and log upload.

## Phase 4: DataPrivacy Doctor ✅

- Secure CSV upload with file-type and size validation.
- Column profiling: type inference, null rates, uniqueness, and sample values.
- PII and quasi-identifier detection (names, emails, IDs, postcodes, dates of birth, income, ethnicity, health fields).
- Composite privacy risk score with five contributing factors and transparent band labels (low/medium/high/severe).
- Masked sample values — no raw PII stored.
- RiskEvent generation for high and severe datasets.
- DataPrivacy Doctor frontend with upload, dataset list, and detail view.

## Phase 5: IncidentFlow ✅

- Incident records with severity, type, status, and linked risk events.
- Timeline entries with free-text notes and staff attribution.
- Playbook template scaffolding.
- IncidentFlow frontend with incident list, create, and detail pages.

## Phase 6: Misinformation Observatory ✅

- User-supplied public post CSV datasets with column validation.
- TF-IDF vectorisation and MiniBatchKMeans clustering pipeline.
- Keyword burst detection and lexicon sentiment scoring.
- Named entity extraction (spaCy) for persons, organisations, and locations.
- NarrativeCluster records with status workflow (draft → needs\_review → escalated / dismissed).
- Cautious observable language — never labels outputs as misinformation; outputs require human review.
- Observatory frontend with overview, dataset list, dataset detail, cluster list, cluster detail, and upload.

## Phase 7: Civic Risk Graph ✅

- Cross-module graph data builder reading FK/M2M relationships without new models.
- Seven node types: asset, vulnerability, risk\_event, anomaly, cluster, dataset, incident.
- Edges derived from all inter-module foreign key and many-to-many relationships.
- Organisation-scoped, bounded per node type.
- `GET /api/graph/` endpoint.
- React Flow frontend with column-based auto-layout, minimap, zoom controls, legend, click-to-inspect detail panel, and empty state.

## Phase 8: Polish and Portfolio Release ✅

- Full README with setup, seeding, module walkthroughs, and sample data.
- Updated ROADMAP and CHANGELOG.
- 198 passing pytest tests covering all modules.
- Responsible-use, security policy, contributing, and code-of-conduct files.
- Portfolio case study skeleton.
- Architecture, API, and module documentation in `docs/`.

---

## Future Work (post-v1.0)

These items are out of scope for the v1.0 portfolio release but represent natural next steps:

- Production deployment guide (fly.io, Railway, or self-hosted).
- API authentication endpoint replacing the admin-login flow.
- Celery-scheduled background ingestion for ThreatBoard.
- Richer graph layout options (force-directed, hierarchical).
- Playbook task checklists and PDF report export in IncidentFlow.
- Dependency and SBOM (Software Bill of Materials) workflows in ThreatBoard.
- Contributor onboarding guide and issue templates.
