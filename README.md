# CivicSec Lab

CivicSec Lab is an open-source public-interest cyber and data intelligence platform for small organisations, NGOs, researchers, student teams, and civic technology groups.

It connects vulnerability intelligence, suspicious login detection, privacy-risk scanning, narrative monitoring, risk graphing, and incident response workflows through a shared civic risk model.

## Why This Exists

Small civic organisations often face cyber, privacy, and platform risks without the staff or tooling available to larger institutions. CivicSec Lab explores what lightweight security intelligence can look like when it is designed for public-interest teams instead of only enterprise security departments.

The platform is built around practical questions:

- Are our systems exposed to known high-risk vulnerabilities?
- Are account or login patterns becoming suspicious?
- Are datasets safe to analyse, share, or publish?
- Are public narratives around civic work changing in risky ways?
- What should be investigated, fixed, documented, or escalated first?

## Core Modules

| Module | Description |
|---|---|
| **ThreatBoard** | Vulnerability intelligence and exposure prioritisation using KEV and EPSS scoring. |
| **LogLens** | Suspicious login and anomaly detection with explainable MITRE ATT&CK-style context. |
| **DataPrivacy Doctor** | Dataset privacy-risk scanning, column profiling, and retention controls. |
| **Misinformation Observatory** | Narrative and coordinated-signal monitoring with TF-IDF clustering and sentiment analysis. |
| **Civic Risk Graph** | Cross-module relationship graph connecting assets, vulnerabilities, anomalies, incidents, and risk events. |
| **IncidentFlow** | Incident records, timeline notes, playbook templates, and structured response workflows. |

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12, Django 5.2, Django REST Framework, PostgreSQL, Celery, Redis |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router 7, React Flow |
| **Data / NLP** | pandas, scikit-learn (TF-IDF + clustering), spaCy (NER), lexicon sentiment |
| **DevOps** | Docker Compose, GitHub Actions, pre-commit, Ruff, Black, pytest |

## Current Status

**v1.0 — all core modules shipped.** Phases 0–7 are complete:

- ✅ Phase 0 — Project setup (monorepo, Docker, GitHub Actions, env config)
- ✅ Phase 1 — Core platform (users, organisations, roles, assets, risk events, incidents, seed data)
- ✅ Phase 2 — ThreatBoard (KEV/EPSS ingestion, matching, risk scoring, risk event generation)
- ✅ Phase 3 — LogLens (synthetic log ingestion, rule-based anomaly detection, MITRE mappings)
- ✅ Phase 4 — DataPrivacy Doctor (CSV upload, column profiling, PII detection, risk banding)
- ✅ Phase 5 — IncidentFlow (incident management, timeline, playbook templates)
- ✅ Phase 6 — Misinformation Observatory (NLP pipeline, clustering, keyword bursts, entity extraction)
- ✅ Phase 7 — Civic Risk Graph (cross-module graph, React Flow visualisation)

## Local Setup With Docker Compose

**Prerequisites:** Docker Desktop with Compose v2, and Node.js (for local frontend tooling only).

### 1. Clone and configure

```powershell
git clone https://github.com/your-org/civicsec-lab.git
cd civicsec-lab
Copy-Item .env.example .env
```

### 2. Start all services

```powershell
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/health/
- **Django admin**: http://localhost:8000/admin/

### 3. Seed the demo workspace

In a second terminal, run these in order:

```powershell
# Core demo org, users, assets, risk events, incidents, and ThreatBoard baseline data
docker compose exec backend python manage.py seed_demo

# Synthetic login events and anomaly detection (LogLens)
docker compose exec backend python manage.py generate_synthetic_logs
docker compose exec backend python manage.py run_loglens_detection

# Narrative clusters and coordinated signals (Observatory)
docker compose exec backend python manage.py seed_observatory

# Incident response playbook templates (IncidentFlow)
docker compose exec backend python manage.py seed_playbooks
```

All commands are idempotent — safe to re-run.

**DataPrivacy Doctor** has no seed command — upload `sample-data/open-civic-aid/volunteer_contacts.csv` through the UI after signing in.

**ThreatBoard** (optional — requires internet): the baseline vulnerabilities are included in `seed_demo`. To pull live KEV/EPSS data:

```powershell
docker compose exec backend python manage.py ingest_kev
docker compose exec backend python manage.py enrich_epss
docker compose exec backend python manage.py match_vulnerabilities
```

### 4. Sign in

Open http://localhost:5173 and sign in via the Django admin first to establish a session:

1. Go to http://localhost:8000/admin/
2. Use one of the demo accounts below.
3. Return to http://localhost:5173 — you will be authenticated.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@opencivicaid.test | CivicAdmin2025! |
| Analyst | analyst@opencivicaid.test | CivicAnalyst2025! |
| Viewer | viewer@opencivicaid.test | CivicViewer2025! |

All accounts belong to the fictional **Open Civic Aid** organisation.

## Module Walkthroughs

### ThreatBoard

1. Navigate to **ThreatBoard** in the sidebar.
2. The overview shows open vulnerabilities, exposure count, and high/critical risk events.
3. Click **Vulnerabilities** to see KEV-matched CVEs with EPSS scores and risk bands.
4. Click a vulnerability to see the explainable risk score breakdown.
5. Click **Asset Matches** to see which Open Civic Aid assets are exposed.
6. Click **Ingestion Runs** to view KEV/EPSS ingestion history (admin/analyst only).

### LogLens

1. Navigate to **LogLens**.
2. The overview shows recent login anomaly counts and detection rule summaries.
3. Click **Anomalies** to see detected suspicious login patterns.
4. Click an anomaly to see the evidence timeline, confidence score, and MITRE ATT&CK-style context.
5. To upload new synthetic logs: **Upload Logs** → choose `sample-data/open-civic-aid/login_logs.csv` → **Run Detection**.

### DataPrivacy Doctor

1. Navigate to **DataPrivacy Doctor**.
2. Click **Upload Dataset** and upload `sample-data/open-civic-aid/volunteer_contacts.csv`.
3. The backend profiles columns, detects identifiers and quasi-identifiers, and calculates a privacy risk score.
4. Click the dataset to see column-level findings, masked sample values, and risk band.

### Misinformation Observatory

1. Navigate to **Misinformation Observatory**.
2. Click **Upload Dataset** and upload `sample-data/open-civic-aid/public_posts.csv`.
3. The NLP pipeline runs TF-IDF clustering, keyword burst detection, sentiment scoring, and entity extraction.
4. View **Clusters** to see detected narrative groups. Click a cluster for sentiment, top keywords, entity mentions, and status management.

### Civic Risk Graph

1. Navigate to **Civic Risk Graph**.
2. The graph renders cross-module connections: assets link to their vulnerabilities, risk events, anomalies, and narrative clusters.
3. Drag nodes to rearrange. Use the minimap and zoom controls to navigate large graphs.
4. Click any node to open the detail panel with metadata and a link to the full record.

### IncidentFlow

1. Navigate to **IncidentFlow**.
2. Click **New Incident** to create an incident record linked to open risk events.
3. Add timeline notes, attach evidence items, and track incident status through to closure.

## Backend Without Docker

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DJANGO_SETTINGS_MODULE = "civicsec.settings.dev"
$env:DATABASE_URL = "sqlite:///db.sqlite3"
python manage.py migrate
python manage.py seed_demo
python manage.py generate_synthetic_logs
python manage.py run_loglens_detection
python manage.py seed_observatory
python manage.py seed_playbooks
python manage.py runserver
```

## Frontend Without Docker

```powershell
Set-Location frontend
npm install
$env:VITE_API_BASE_URL = "http://localhost:8000"
npm run dev
```

## Running Tests and Checks

**Backend (198 tests):**

```powershell
Set-Location backend
pytest
ruff check .
black --check .
```

**Frontend:**

```powershell
Set-Location frontend
npm run lint
npm run build
```

## Sample Data

The `sample-data/open-civic-aid/` directory contains fictional CSVs for manual upload testing:

| File | For module |
|---|---|
| `login_logs.csv` | LogLens — synthetic login event log |
| `public_posts.csv` | Misinformation Observatory — synthetic public post dataset |
| `volunteer_contacts.csv` | DataPrivacy Doctor — synthetic dataset with quasi-identifiers |

All data is fictional. Do not upload real personal data, credentials, or sensitive information to any instance of this platform.

## Project Layout

```text
civicsec-lab/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # Custom user model and auth
│   │   ├── organisations/     # Organisation and role model
│   │   ├── assets/            # Asset registry
│   │   ├── risk/              # RiskEvent, EvidenceItem, ActionRecommendation
│   │   ├── incidents/         # Incident and timeline models
│   │   ├── threatboard/       # KEV/EPSS ingestion, matching, scoring
│   │   ├── loglens/           # Login log ingestion and anomaly detection
│   │   ├── privacy_doctor/    # Dataset upload, profiling, privacy scoring
│   │   ├── misinformation/    # NLP pipeline, clustering, narrative analysis
│   │   ├── common/            # Shared models, permissions, graph builder
│   │   └── auditlog/          # Audit trail
│   ├── civicsec/              # Django project settings and URL conf
│   └── tests/                 # pytest test suite
├── frontend/
│   └── src/
│       ├── features/          # Per-module React feature folders
│       ├── components/        # Shared UI components
│       ├── lib/               # API client and utilities
│       └── routes/            # React Router configuration
├── docs/                      # Architecture, API, and module docs
├── sample-data/               # Fictional CSVs for demo seeding
├── notebooks/                 # Exploratory data analysis
└── docker-compose.yml
```

## Responsible Use

CivicSec Lab is designed for defensive, educational, and public-interest security use. It does not provide exploit code, credential harvesting, malware, offensive automation, or automated targeting functionality. Outputs are decision-support signals and require human review.

All sample data in this repository is fictional. See [RESPONSIBLE_USE.md](RESPONSIBLE_USE.md) for full policy.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues should be reported privately as described in [SECURITY.md](SECURITY.md).

## License

Apache-2.0. See [LICENSE](LICENSE).
