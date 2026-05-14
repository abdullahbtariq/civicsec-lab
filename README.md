# CivicSec Lab

CivicSec Lab is an open-source public-interest cyber and data intelligence platform for small organisations, NGOs, researchers, student teams, and civic technology groups.

It will connect vulnerability intelligence, suspicious login detection, privacy-risk scanning, narrative monitoring, risk graphing, and incident response workflows through a shared civic risk model.

## Why This Exists

Small civic organisations often face cyber, privacy, and platform risks without the staff or tooling available to larger institutions. CivicSec Lab explores what lightweight security intelligence can look like when it is designed for public-interest teams instead of only enterprise security departments.

The platform is built around practical questions:

- Are our systems exposed to known high-risk vulnerabilities?
- Are account or login patterns becoming suspicious?
- Are datasets safe to analyse, share, or publish?
- Are public narratives around civic work changing in risky ways?
- What should be investigated, fixed, documented, or escalated first?

## Core Modules

- **ThreatBoard**: vulnerability intelligence and exposure prioritisation.
- **LogLens**: suspicious login and anomaly detection.
- **DataPrivacy Doctor**: dataset privacy-risk scanning.
- **Misinformation Observatory**: narrative and online harm signal monitoring.
- **Civic Risk Graph**: cross-module relationship and correlation layer.
- **IncidentFlow**: incident response workflows and report generation.

## Tech Stack

- **Backend**: Python, Django, Django REST Framework, PostgreSQL, Celery, Redis, pytest, Ruff, Black.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS.
- **DevOps**: Docker Compose, GitHub Actions, pre-commit.
- **Data later**: pandas, scikit-learn, NetworkX, spaCy, and other free and open-source tools where appropriate.

## Responsible Use

CivicSec Lab is designed for defensive, educational, and public-interest security use. It does not provide exploit code, credential harvesting, malware, offensive automation, or automated targeting functionality. Outputs are decision-support signals and require human review.

All sample data in this repository is fictional.

## Current Status

Early development. This repository currently contains the Phase 0 project foundation: monorepo structure, documentation skeletons, Docker Compose, a minimal Django backend, a Vite React frontend shell, CI placeholders, and fictional sample data.

## Local Setup With Docker Compose

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Then open:

- Frontend: http://localhost:5173
- Backend health check: http://localhost:8000/api/health/

The health endpoint should return:

```json
{
  "status": "ok",
  "service": "civicsec-backend"
}
```

## Backend Setup Without Docker

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
$env:DJANGO_SETTINGS_MODULE = "civicsec.settings.dev"
python manage.py migrate
python manage.py runserver
```

## Frontend Setup Without Docker

```powershell
Set-Location frontend
npm install
npm run dev
```

## Development Checks

Backend:

```powershell
Set-Location backend
pytest
ruff check .
black --check .
```

Frontend:

```powershell
Set-Location frontend
npm run lint
npm run build
```

## License

Apache-2.0. See [LICENSE](LICENSE).
