# Portfolio Case Study

CivicSec Lab — a full-stack public-interest security intelligence platform built as a portfolio project demonstrating data science, cybersecurity engineering, civic technology, and product design skills.

---

## 1. Problem

Small civic organisations — NGOs, research groups, local government teams, digital rights advocates — increasingly face cyber threats, privacy risks, and information-environment hazards that are well understood in enterprise security but poorly served by available tooling.

Enterprise security platforms assume large IT teams, expensive licensing, and infrastructure that does not match civic-sector realities. Free tools tend to be either highly technical (command-line, no workflow integration) or surface-level (tick-box compliance checklists with no analytical depth).

The specific gaps this project addresses:

- **Vulnerability exposure**: civic organisations run websites, databases, and cloud services but rarely have the staff to monitor CISA KEV advisories or calculate exposure risk in context.
- **Suspicious account activity**: small organisations often learn about compromised accounts weeks after the fact because login patterns are not being monitored.
- **Privacy risk in datasets**: civic researchers frequently work with datasets that may contain personal data. Without systematic profiling, privacy risks are invisible until something goes wrong.
- **Narrative risk signals**: organisations working on politically sensitive issues face coordinated narrative campaigns. There are few tools that help small teams notice shifts in online discourse without expensive commercial platforms.
- **Fragmented risk picture**: the above risks are typically managed in separate tools (or not at all), making it hard to see when multiple signals point to a single threat.

---

## 2. Why This Matters

Security intelligence designed for public-interest teams instead of enterprise security departments is rare but important. Civic organisations often hold sensitive data about vulnerable people, operate in adversarial information environments, and have high reputational stakes with minimal security resources.

A lightweight, explainable, self-hosted platform that surfaces actionable signals without requiring a security operations centre represents a meaningful design target — even as a portfolio-scale implementation.

---

## 3. Product Concept

CivicSec Lab is a modular intelligence platform with six modules sharing a common risk model:

1. **ThreatBoard** — ingests vulnerability intelligence, matches CVEs to registered assets, scores exposure using explainable factors, and generates risk events for high-risk findings.
2. **LogLens** — accepts login log CSVs, applies six rule-based anomaly detectors, and produces evidence-backed anomaly records with MITRE ATT&CK-style context.
3. **DataPrivacy Doctor** — profiles uploaded CSVs for PII and quasi-identifiers, calculates a composite privacy risk score, and generates risk events for high-risk datasets.
4. **Misinformation Observatory** — applies a TF-IDF + clustering NLP pipeline to user-uploaded post datasets, surfacing narrative clusters, keyword bursts, and entity mentions for human review.
5. **Civic Risk Graph** — aggregates cross-module relationships into a graph view connecting assets, vulnerabilities, anomalies, incidents, and narrative signals.
6. **IncidentFlow** — provides incident management with timeline entries, evidence linking, and playbook scaffolding.

All modules write to the shared `RiskEvent` model, making it possible to triage across module boundaries from a single dashboard.

---

## 4. System Architecture

| Layer | Technology choices |
|---|---|
| Backend | Python 3.12, Django 5.2, Django REST Framework |
| Database | PostgreSQL (Docker dev), SQLite (test suite) |
| Background | Celery + Redis (wired; async not yet used for module pipelines) |
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, React Router 7 |
| Graph | React Flow (`@xyflow/react` v12) |
| NLP | scikit-learn (TF-IDF, MiniBatchKMeans), spaCy (NER), custom lexicon sentiment |
| DevOps | Docker Compose, GitHub Actions CI, pre-commit, Ruff, Black, pytest |

Key architectural decisions:

- **Single-origin monorepo** with frontend and backend co-located, simplifying Docker Compose setup and reducing CI complexity for a portfolio project.
- **Organisation-scoped permission layer** applied at the DRF view level — not only as queryset filters — so every module inherits data isolation without per-module auth logic.
- **Shared RiskEvent model** as the cross-module integration point rather than point-to-point module coupling. Any module can read open risk events without knowing which module created them.
- **No new models for the graph** — the Civic Risk Graph reads FK/M2M relationships that already exist across modules, keeping the graph endpoint as a pure read-layer with no storage.
- **Sync-first NLP pipeline** — the Observatory NLP pipeline runs synchronously on upload for portfolio simplicity. A production system would use Celery tasks, but synchronous execution makes behaviour transparent and testable without broker setup.

---

## 5. Data Model

Core models (shared across all modules):

- `Organisation` — multi-tenant boundary
- `User` — custom user model with `organisation` FK and `role` (admin / analyst / viewer)
- `Asset` — registered IT asset with criticality, data sensitivity, and internet-exposure fields
- `RiskEvent` — shared risk currency: source module, severity, confidence, status, evidence JSON
- `EvidenceItem` — structured evidence attached to risk events
- `ActionRecommendation` — suggested next steps
- `Incident` — incident record with type, severity, status
- `IncidentTimelineEntry` — timestamped notes on an incident
- `AuditLog` — append-only action log
- `ProcessingJob` — background job status tracker

Module models:

- `Vulnerability`, `VulnerabilityScore`, `AssetVulnerabilityMatch`, `VulnerabilityIngestionRun` (ThreatBoard)
- `LoginEvent`, `LoginAnomaly` (LogLens)
- `UploadedDataset`, `DatasetColumnProfile` (DataPrivacy Doctor)
- `UploadedDataset`, `DatasetColumnSample`, `NarrativeCluster`, `KeywordBurst`, `EntityMention` (Misinformation Observatory — separate app with same base pattern)

---

## 6. Module Breakdown

### ThreatBoard

Ingests a local KEV-style JSON feed, upserts vulnerabilities idempotently by CVE ID, enriches with EPSS-style scores, matches to registered assets by name/type/IP heuristics, and calculates an explainable risk score from five factors: EPSS score, KEV status, severity, internet exposure, and data sensitivity. Generates `RiskEvent` records for high and critical asset matches. Frontend includes an overview dashboard, vulnerability table with filters, vulnerability detail page with score breakdown, asset match list and detail, and ingestion run history.

### LogLens

Accepts login event CSV uploads (timestamp, user, IP, result, device, country, resource). Validates schema, persists `LoginEvent` records, and runs six anomaly detectors: failed login burst (>5 failures in 15 minutes), suspicious success after failures, impossible travel (>900 km/h between logins), new device, unusual hour (midnight–5 am), and sensitive resource access following a recent anomaly. Each `LoginAnomaly` stores an `evidence_snapshot` (JSON), `confidence_score`, `risk_score`, and a cautiously labelled MITRE ATT&CK-style tactic. Open anomalies generate `RiskEvent` records. Frontend provides an overview, anomaly list, detail with evidence timeline, and log upload.

### DataPrivacy Doctor

Accepts CSV uploads up to 10 MB; validates file type; profiles every column (type inference, null rate, uniqueness, masked sample values); detects PII and quasi-identifiers across 14 categories; calculates a composite privacy risk score from five factors (identifier count, quasi-identifier count, unique rate, row count, sensitive category flags); assigns a risk band (low/medium/high/severe); deletes the original file after processing; and generates a `RiskEvent` for high/severe datasets. Frontend provides upload, dataset list, and a detail view with column-level findings.

### Misinformation Observatory

Accepts post CSV uploads (post\_id, text, author, timestamp, platform, url). Runs a four-stage NLP pipeline: TF-IDF vectorisation → MiniBatchKMeans clustering → keyword burst detection (post frequency spike vs. rolling baseline) → spaCy named entity recognition (PERSON, ORG, GPE, LOC). Produces `NarrativeCluster`, `KeywordBurst`, and `EntityMention` records. Clusters have a status workflow (draft → needs\_review → escalated / dismissed). All observable language avoids the words "misinformation", "bot", and "troll"; clusters are described as "narrative clusters" and "coordinated-looking signals" requiring human review. Frontend provides an overview, dataset list, cluster list, cluster detail with sentiment bar and entity mentions, and upload.

### Civic Risk Graph

A read-only graph data builder (`backend/apps/common/graph.py`) collects up to seven node types from the current organisation's data: assets, open risk events, high/critical vulnerability matches, active incidents, open/escalated login anomalies, narrative clusters needing review, and high-risk uploaded datasets. Edges are derived from existing FK/M2M relationships. The `GET /api/graph/` endpoint returns `{"nodes": [...], "edges": [...]}`. The React Flow frontend lays nodes out in type-based columns, renders custom node cards with severity badges, and opens a detail panel with metadata and a deep-link on node click.

### IncidentFlow

Incident records are linked to open risk events at creation. Timeline entries support free-text notes with staff attribution. Frontend provides incident list, create form, and detail view with timeline.

---

## 7. Security and Privacy Design

- **Authentication**: session + CSRF throughout. All endpoints require `IsAuthenticated`. Mutating frontend calls include `X-CSRFToken`.
- **Organisation isolation**: `IsOrganisationScopedRole` checks `request.user.organisation` against the accessed objects. Queryset filters add a second layer but are not the primary defence.
- **Role model**: admin (full write), analyst (module write, no admin actions), viewer (read-only). Role checks are enforced server-side; frontend role checks are UI affordances only.
- **File handling**: uploads validate MIME type and file extension; original files are deleted from disk after processing; no raw PII is stored in database fields — column samples are masked.
- **Output framing**: all module outputs are decision-support signals labelled as requiring human review. The Observatory module never uses language that asserts intent or origin.
- **Sample data**: all seed data and sample CSVs are fictional. The RESPONSIBLE\_USE policy prohibits uploading real personal data or credentials.
- **Audit trail**: the `AuditLog` model records significant user actions for accountability.

---

## 8. Data Science Methods

### ThreatBoard scoring

Risk score = (EPSS component × 40) + (KEV bonus × 15) + (severity score × 20) + (internet exposure bonus × 15) + (sensitive data bonus × 10), normalised to 0–100. Bands: low < 31, medium 31–50, high 51–70, critical > 70. The full breakdown is stored in `score_breakdown` JSON on the `AssetVulnerabilityMatch`.

### LogLens anomaly detection

Rule-based detectors operate over a sliding time window. Confidence scoring weighs multiple corroborating signals: e.g., impossible travel gets base 0.85 confidence; a new device on the same event raises it to 0.92. Risk score aggregates confidence, anomaly type severity weight, and any existing risk events for the user. Detectors are designed for low false-positive rates in a small-dataset demo context; production tuning would require labelled datasets.

### DataPrivacy Doctor privacy scoring

Composite score from five factors: identifier density (unique PII columns / total columns × 30), quasi-identifier density (quasi-ID columns / total × 25), row uniqueness risk (unique rate × 20), scale risk (log-scaled row count × 15), and sensitive category flag (health/income/ethnicity fields present × 10). Each factor is bounded 0–1; the composite is multiplied by 100.

### Misinformation Observatory NLP pipeline

TF-IDF is computed over post text after basic cleaning (lowercase, whitespace normalisation). `MiniBatchKMeans` clusters with `k = min(8, sqrt(post_count))`. Cluster labels are derived from the top-5 TF-IDF terms. Keyword bursts are detected by comparing per-keyword post counts in a 24-hour rolling window to a 7-day baseline; a burst is flagged when the current rate is more than 3× the baseline with a minimum of 5 posts. Sentiment is scored against a domain-relevant lexicon (civic, political, security terminology). Named entities use spaCy's `en_core_web_sm` model with confidence filtering.

**Limitations**: small demo datasets, English-only, no deduplication, no account behaviour modelling, no temporal sequence modelling. All outputs require expert human review.

---

## 9. Engineering Trade-Offs

| Decision | Rationale |
|---|---|
| Django + DRF | Mature, well-documented, batteries-included ORM and admin — practical for a multi-model platform without heavy infrastructure |
| React + TypeScript + Vite | Fast build, strong typing, and wide ecosystem; TypeScript catches cross-module API contract mismatches at compile time |
| PostgreSQL | Required for production data integrity; SQLite is used only in the test suite for speed |
| Celery + Redis (wired, not activated) | Included to show production-readiness intent without adding test complexity; sync pipeline is easier to verify in CI |
| Monorepo | Keeps frontend/backend changes co-located; eliminates cross-repo coordination overhead for a solo portfolio project |
| Sync NLP pipeline | Transparent for demo purposes; all output is visible immediately; the clear next production step is to move to a Celery task |
| React Flow for graph | Purpose-built for interactive node/edge diagrams; lighter-weight than D3 for this use case; good TypeScript support |
| scikit-learn for NLP | No external API dependency; deterministic; easy to test; appropriate for document-level clustering at portfolio scale |

---

## 10. Demo Walkthrough

1. Clone the repo and copy `.env.example` to `.env`.
2. Run `docker compose up --build`.
3. Seed: `seed_demo` → `generate_synthetic_logs` → `run_loglens_detection` → `seed_observatory` → `seed_playbooks`.
4. Sign in at `localhost:8000/admin/` with `admin@opencivicaid.test`.
5. Return to `localhost:5173`. The dashboard shows cross-module risk counts.
6. **ThreatBoard**: review fictional CVEs with EPSS-style scores and asset exposure prioritisation (seeded by `seed_demo`).
7. **LogLens**: review detected login anomalies with evidence timelines and MITRE-style context. Upload `sample-data/open-civic-aid/login_logs.csv` to run fresh detection.
8. **DataPrivacy Doctor**: upload `sample-data/open-civic-aid/volunteer_contacts.csv` to see column profiling, PII detection, and risk scoring.
9. **Misinformation Observatory**: the NLP pipeline runs automatically on `seed_observatory`. Upload `sample-data/open-civic-aid/public_posts.csv` for a fresh run.
10. **Civic Risk Graph**: navigate to the graph to see assets, vulnerabilities, anomalies, and clusters connected visually.
11. **IncidentFlow**: create an incident linked to an open risk event and add a timeline note.

---

## 11. Future Work

- Async NLP and ingestion pipelines via Celery tasks.
- Production deployment guide (fly.io or Railway).
- API-based login endpoint (replace admin-login-first flow).
- Force-directed and hierarchical graph layout options.
- Scheduled KEV/EPSS ingestion with configurable intervals.
- Playbook task checklists and PDF report export in IncidentFlow.
- Dependency / SBOM scanning in ThreatBoard.
- Contributor issue templates and onboarding guide.

---

## 12. What I Learned

- **Permission layering matters**: enforcing organisation isolation at the permission class level rather than relying solely on queryset filters prevents bugs where filter logic is accidentally omitted in a new view.
- **RiskEvent as shared currency**: having a single cross-module risk record model dramatically simplifies the dashboard and graph — modules don't need to know about each other, they just write risk events.
- **Observable language design**: designing the Observatory to never use the word "misinformation" forced a clearer product framing — outputs are signals for human analysts, not verdicts. This constraint improved the overall output design across all modules.
- **Sync-first NLP for portfolio clarity**: running the NLP pipeline synchronously made it far easier to write tests, debug edge cases, and demonstrate outputs to reviewers without needing a running Celery worker.
- **TypeScript API contract discipline**: typing all API responses in `api.ts` files before building the UI pages prevented a class of runtime errors and made refactoring across the frontend much safer.
- **Graph without new models**: deriving the graph from existing FK/M2M relationships rather than adding a graph storage model kept the backend clean and the graph always in sync with live data.
