# Data Model

This document tracks the planned CivicSec Lab data model. Domain models are not implemented in Phase 0.

## Planned Shared Entities

- Organisation
- User
- Asset
- RiskEvent
- EvidenceItem
- ActionRecommendation
- Incident
- IncidentTask
- AuditLog
- ProcessingJob

## Design Direction

The platform will use a shared RiskEvent model so future modules can contribute comparable risk signals. Each event should include source module, severity, confidence, evidence summary, recommended action summary, status, and framework mappings.

## Phase 0 Status

Only Django project wiring exists. No domain tables have been created yet beyond Django's built-in framework tables.
