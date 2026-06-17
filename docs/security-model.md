# Security Model

CivicSec Lab is defensive, educational, and public-interest software. The security model is designed to be transparent, explainable, and conservative.

## Organisation Scoping

Every operational model has an `organisation` FK. All records are isolated at the organisation boundary.

Organisation-scoped models:
- `Asset`
- `RiskEvent`, `EvidenceItem`, `ActionRecommendation`
- `Incident`, `IncidentTimelineEntry`
- `ProcessingJob`, `AuditLog`
- `AssetVulnerabilityMatch`, `ThreatIngestionRun`
- `LoginEvent`, `LoginAnomaly`
- `UploadedDataset` (both Privacy Doctor and Observatory), `DatasetColumnProfile`, `NarrativeCluster`, `KeywordBurst`, `EntityMention`

**Defence-in-depth**: organisation isolation is enforced at the permission class (`IsOrganisationScopedRole`) before the view even runs, and again as a queryset filter inside the view. Both layers must agree.

## Roles

| Role | Capabilities |
|---|---|
| `admin` | Full read/write/delete within org; can trigger module actions |
| `analyst` | Read/write within org; can trigger module actions; cannot delete |
| `viewer` | Read-only; cannot trigger actions |
| Superuser | Bypasses org scoping; for platform administration only |

Role checks are enforced server-side. Frontend role affordances (hiding buttons, greying out controls) are user-experience hints only and cannot be relied upon for security.

## Authentication

- Session-based authentication via Django's session framework.
- Email is unique and is the login identity.
- `X-CSRFToken` header is required on all mutating requests.
- CSRF cookie is set with `SameSite=Lax`.
- Session cookie is `HttpOnly` and `SameSite=Lax`.
- Demo accounts use strong-format passwords (`CivicAdmin2025!` etc.); these are for development only and must not be used in production.

**Known limitation**: there is no API login endpoint in v1.0. Authentication is established via Django admin (`/admin/`). An API-based login/logout endpoint is planned for post-v1.0.

## File Upload Security

All CSV upload endpoints (LogLens, DataPrivacy Doctor, Observatory) enforce:
- MIME type validation (must be `text/csv` or `application/vnd.ms-excel`)
- File extension validation (`.csv` only)
- Maximum file size (10 MB)
- Column schema validation (required columns checked before processing)

After processing:
- Original uploaded files are deleted from disk.
- No raw personal data is stored in database fields — column samples are masked before storage.
- Parsed records (LoginEvent, DatasetColumnProfile, etc.) contain only derived or anonymised fields.

## Output Safety

All module outputs are designed to be decision-support signals, not automated verdicts:

| Module | Safety framing |
|---|---|
| ThreatBoard | Risk scores are labelled as decision-support signals; "verify affected status" is always the first recommendation |
| LogLens | Anomaly types include "signal — requires review" in all MITRE labels; no automated account actions |
| DataPrivacy Doctor | Scores are not legal compliance certifications; no data is shared externally |
| Observatory | Never uses "misinformation", "bot", or "troll"; clusters are "narrative clusters" and "coordinated-looking signals" |
| Civic Risk Graph | Read-only view; no write actions on graph endpoint |
| IncidentFlow | Supports documentation only; no offensive response features |

## Data Safety

- No external API calls except ThreatBoard's optional KEV/EPSS ingestion (triggered manually by analyst/admin).
- No telemetry, analytics, or data exfiltration built into the platform.
- All processing is local to the deployment.
- Sample data in the repository is entirely fictional.
- Production deployments must use `SECRET_KEY` from environment, not the development default.
- `DEBUG = False` must be set in production.
- `ALLOWED_HOSTS` must be explicitly configured in production.

## Audit Logging

The `AuditLog` model and `record_audit_event()` helper are available for explicit audit writes. Automatic audit middleware is not yet implemented; modules call `record_audit_event()` at key action points.

## ThreatBoard-Specific Security Notes

- Vulnerability metadata (CVE, KEV, EPSS) is global public data, not org-scoped.
- Asset matches, ingestion runs, and generated risk events are org-scoped.
- Ingestion endpoints call public CISA and FIRST APIs; these require outbound network access and should be treated as operational actions.
- No exploit code, weaponised payloads, or offensive instructions are stored or displayed.

## LogLens-Specific Security Notes

- LogLens only processes files explicitly uploaded by an authenticated user; it does not monitor systems directly.
- No credentials are collected or stored.
- No automated blocking, lockout, or access revocation.

## DataPrivacy Doctor-Specific Security Notes

- Uploaded files are deleted immediately after processing.
- Column samples use a masking heuristic: characters beyond the first two are replaced with `*`.
- The tool does not guarantee anonymisation; it surfaces risk indicators for human review.

## Observatory-Specific Security Notes

- No live platform scraping; all data is user-supplied.
- No private messages or non-public content should be uploaded.
- The module must not be used to generate harassment lists or target individuals.

## Current Limitations

- No API-based login/logout endpoint.
- No user management API.
- No object-level permission beyond org scoping and role checks.
- No rate limiting on trigger endpoints.
- No audit middleware (explicit `record_audit_event()` calls only).
- No IP allowlisting or multi-factor authentication support.
- NLP pipeline runs synchronously (no job queue isolation).

All of the above are known and documented trade-offs for a portfolio-scale v1.0 release. Production deployments should address rate limiting, MFA, and audit middleware before handling real sensitive data.
