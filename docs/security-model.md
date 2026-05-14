# Security Model

CivicSec Lab should be secure by default and careful with data.

## Principles

- Environment-based secrets.
- No committed credentials.
- Organisation-level access control once multi-user features exist.
- Minimal data retention for uploads.
- Defensive-only workflows.
- Audit logging for sensitive actions.
- Clear distinction between signals and verified incidents.

## Phase 0 Controls

- `.env.example` documents local configuration without real secrets.
- Docker Compose uses PostgreSQL and Redis services for local development.
- SECURITY.md and RESPONSIBLE_USE.md define reporting and safety expectations.
- No authentication, domain models, or file upload functionality exists yet.

## Future Controls

- Custom user model and roles.
- Object-level organisation checks.
- Secure file upload validation.
- CSRF and secure cookie production settings.
- Data deletion and retention controls.
- Audit log events for uploads, incident updates, report exports, and settings changes.
