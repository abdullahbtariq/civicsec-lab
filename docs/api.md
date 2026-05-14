# API

This document will describe CivicSec Lab API conventions and endpoints.

## Current Endpoint

```text
GET /api/health/
```

Response:

```json
{
  "status": "ok",
  "service": "civicsec-backend"
}
```

## Future Conventions

- JSON request and response bodies.
- Organisation-scoped access control.
- Human-readable error messages for user-facing validation issues.
- Evidence and confidence fields for risk-related outputs.
- OpenAPI documentation once the API surface grows.
