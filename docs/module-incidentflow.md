# IncidentFlow

IncidentFlow is CivicSec Lab's incident response workflow module. It provides a lightweight structure for documenting, tracking, and reviewing security incidents from initial detection through to closure and lessons learned.

IncidentFlow supports calm, structured documentation and review. It does not encourage offensive response actions or automated countermeasures.

## Purpose

IncidentFlow answers:

- What incidents is the organisation currently managing?
- Which risk events are associated with each incident?
- What actions have been taken, and by whom, and when?
- What is the current status and severity of each open incident?
- What lessons should be recorded for future reference?

## Models

- `Incident` — the top-level incident record, linked to an organisation and optionally to one or more `RiskEvent` records.
- `IncidentTimelineEntry` — a single timestamped note or event on an incident's timeline.

## Incident Fields

| Field | Description |
|---|---|
| `title` | Short incident name |
| `description` | Detailed description |
| `severity` | info / low / medium / high / critical |
| `status` | open / investigating / contained / closed / resolved |
| `incident_type` | unauthorised_access / data_breach / phishing / ransomware / ddos / insider_threat / narrative_attack / privacy_violation / other |
| `opened_at` | When the incident was opened |
| `closed_at` | When the incident was closed (nullable) |
| `owner` | Assigned analyst or admin (FK to User) |
| `linked_risk_events` | M2M to RiskEvent — related risk signals |
| `timeline_summary` | Freetext summary of key events |
| `lessons_learned` | Freetext post-incident review notes |

## Timeline Entry Fields

| Field | Description |
|---|---|
| `incident` | Parent incident |
| `timestamp` | When this event occurred |
| `entry_type` | detection / containment / evidence / comms / recovery / review / note |
| `title` | Short summary |
| `description` | Freetext detail |
| `actor` | Who performed or observed this action |

## Status Workflow

```text
open → investigating → contained → resolved / closed
```

Status transitions are manual. There is no automated state machine; analysts update status through the API or frontend.

## API Endpoints

```text
GET    /api/incidents/
POST   /api/incidents/
GET    /api/incidents/{id}/
PATCH  /api/incidents/{id}/
DELETE /api/incidents/{id}/

GET    /api/incident-timeline/
POST   /api/incident-timeline/
GET    /api/incident-timeline/{id}/
PATCH  /api/incident-timeline/{id}/

GET    /api/incidentflow/overview/
```

Incidents and timeline entries are organisation-scoped. Viewer users can read; analyst and admin users can create and update.

## Frontend

Pages at `/modules/incidentflow/`:

- **Overview**: open incident count by severity, recent incidents, and status breakdown.
- **Incident List**: sortable/filterable table of all incidents with severity and status badges.
- **Create Incident**: form with title, severity, type, description, and linked risk event selector.
- **Incident Detail**: full incident metadata, linked risk events, timeline entries (newest first), and controls to add notes or update status.

## Playbook Templates

Playbook template scaffolding exists for common incident types. In v1.0 these are predefined response step suggestions surfaced in the incident detail view. Interactive task checklists with completion tracking are future work.

## Safety Boundaries

- IncidentFlow supports documentation, communication, and recovery planning.
- It does not include automated countermeasures, offensive response tools, or attribution functionality.
- The module must not be used to plan or document offensive cyber actions.

## Current Limitations

- No automated status transitions or escalation rules.
- No PDF or Markdown report export (future work).
- No email/notification integration.
- Playbook task checklists are not interactive in v1.0.
- No evidence file attachments (evidence is linked via `EvidenceItem` records on associated `RiskEvent` objects).
