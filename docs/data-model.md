# Data Model

CivicSec Lab now has the core backend foundation models that future modules will build on. All operational objects are organisation-scoped unless explicitly noted.

## Organisation

Represents a workspace.

Fields include name, slug, description, sector, country, risk profile, created timestamp, and updated timestamp.

Risk profiles:

- low
- medium
- high
- elevated

## User

Custom Django user model in `accounts.User`.

Email is the login identity and is unique. Users may belong to one organisation and have one of three roles:

- admin: organisation-level management and operational write access.
- analyst: operational write access for assets, risk events, evidence, recommendations, and incidents.
- viewer: read-only access.

Helper properties:

- `is_org_admin`
- `is_analyst`
- `is_viewer`

## Asset

Represents an organisational system, service, repository, dataset, or tool.

Fields include organisation, name, asset type, description, owner name, criticality, internet exposure, data sensitivity, vendor, product, version, tags, creator, and timestamps.

## RiskEvent

The shared risk signal object used by future modules.

Fields include organisation, source module, event type, title, summary, severity, confidence, status, affected asset, affected user, risk score, evidence summary, recommended action summary, framework mappings, tags, first seen, last seen, and timestamps.

Validation:

- confidence must be between 0 and 1.
- risk score must be between 0 and 100.

Computed helpers:

- `severity_rank`
- `confidence_band`
- `is_open`

## EvidenceItem

Stores evidence linked to a RiskEvent.

Fields include organisation, risk event, evidence type, title, description, source, raw reference, observed timestamp, confidence, metadata, and created timestamp.

## ActionRecommendation

Stores response recommendations linked to a RiskEvent.

Fields include organisation, risk event, title, description, priority, status, owner, due date, framework mapping, and timestamps.

## Incident

Represents a response workflow record.

Fields include organisation, title, description, severity, status, incident type, opened timestamp, closed timestamp, owner, linked risk events, timeline summary, lessons learned, and timestamps.

## IncidentTimelineEntry

Stores incident timeline events.

Fields include organisation, incident, timestamp, entry type, title, description, actor, metadata, and created timestamp.

## AuditLog

Stores explicit audit events. Middleware is not implemented yet.

Fields include organisation, actor, action, object type, object ID, IP address, user agent, metadata, and created timestamp.

Use `record_audit_event()` from `apps.auditlog.utils` for explicit audit writes.

## ProcessingJob

Tracks background or long-running jobs.

Fields include organisation, job type, status, started timestamp, finished timestamp, error message, progress, metadata, and timestamps.

Validation:

- progress must be between 0 and 100.

## ThreatBoard Models

ThreatBoard adds the first module-specific backend models.

### Vulnerability

Global public vulnerability metadata keyed by `cve_id`.

Fields include CVE ID, title, description, vendor, product, KEV date, due date, ransomware-campaign-use flag, required action, notes, CWE, source, source URL, and timestamps.

Validation:

- CVE IDs are stripped and uppercased.
- CVE IDs must roughly match `CVE-YYYY-NNNN`.

Sources:

- cisa_kev
- manual
- osv
- other

### VulnerabilityScore

One-to-one scoring metadata for a vulnerability.

Fields include EPSS score, EPSS percentile, CVSS score, CVSS severity, KEV known-exploited flag, last EPSS check timestamp, last scored timestamp, and timestamps.

Validation:

- EPSS score and percentile must be between 0 and 1.
- CVSS score must be between 0 and 10.

### AssetVulnerabilityMatch

Organisation-scoped match between an asset and a vulnerability.

Fields include organisation, asset, vulnerability, match method, match confidence, exposure score, calculated risk score, risk band, status, remediation status, explanation, notes, first seen, last seen, and timestamps.

Constraints:

- one match per organisation, asset, and vulnerability.

Validation:

- match confidence must be between 0 and 1.
- exposure score must be between 0 and 100.
- calculated risk score must be between 0 and 100.

### ThreatIngestionRun

Tracks KEV ingestion, EPSS enrichment, asset matching, and risk scoring runs.

Fields include optional organisation, run type, status, source, timestamps, record counts, error message, metadata, and timestamps.

### Generated Platform Records

High-priority ThreatBoard matches can create or update:

- `RiskEvent`
- `EvidenceItem`
- `ActionRecommendation`

These generated records remain organisation-scoped and use the shared CivicSec Lab permission model.
