# Security Model

CivicSec Lab is defensive, educational, and public-interest software. The backend foundation now includes organisation scoping and simple role-based access controls for shared platform objects.

## Organisation Scoping

All operational records belong to an organisation:

- assets
- risk events
- evidence items
- recommendations
- incidents
- incident timeline entries
- processing jobs
- audit logs where applicable

DRF list and detail endpoints filter by `request.user.organisation` unless the user is a superuser. Users without an organisation receive empty lists.

## Roles

User roles:

- admin
- analyst
- viewer

Current API assumptions:

- Viewer users can read organisation-scoped records.
- Analyst users can create and update operational records.
- Admin users can create, update, and delete operational records.
- Organisation admins can update their own organisation record but cannot create additional organisations.
- Organisation creation and deletion are reserved for superusers.
- Superusers bypass organisation scoping for administrative use.

## Custom User Model

The backend uses `accounts.User` as `AUTH_USER_MODEL`. Email is unique and central to authentication identity.

Because this changed the auth model early in the project, existing local databases that already ran default Django auth migrations may need to be reset.

## Audit Logging

The `AuditLog` model and `record_audit_event()` helper exist. Automatic audit middleware is not implemented yet.

## ThreatBoard Security Model

ThreatBoard vulnerability metadata is global public metadata. It does not contain exploit code or private organisation data.

Organisation-scoped ThreatBoard records:

- asset vulnerability matches
- generated risk events
- evidence items
- action recommendations
- organisation-specific ingestion runs

Access rules:

- Viewer users can read ThreatBoard data available to their organisation.
- Viewer users cannot trigger ingestion, enrichment, or matching.
- Analyst and admin users can trigger KEV ingestion, EPSS enrichment, and asset matching.
- Asset match list and detail endpoints filter by the requesting user's organisation.
- Superusers can see all organisations' asset matches and ingestion runs.

Live ingestion endpoints call public data sources and should be treated as operational actions. They are POST-only and require authentication.

## Current Limitations

- No login/logout API is implemented yet.
- No user-management API is implemented yet.
- No object-level permission matrix beyond organisation scoping and role checks is implemented yet.
- No file upload handling is implemented yet.
- No Celery tasks are implemented yet.
- ThreatBoard ingestion is synchronous in the MVP and is not yet protected by rate limiting.
- The demo seed users use a development password and must not be used in production.

## Data Safety

Do not upload real secrets, credentials, private logs, real personal data, or sensitive organisational records to public demo instances. Repository sample data is fictional.
