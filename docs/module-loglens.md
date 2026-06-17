# LogLens

LogLens is CivicSec Lab's suspicious login and anomaly detection module. It analyses authorised or synthetic login event logs for behavioural patterns that may indicate account compromise, credential stuffing, or unusual access, and surfaces evidence-backed anomaly records for human review.

LogLens does not collect credentials, bypass authentication, or monitor systems it is not authorised to observe.

## Purpose

LogLens answers:

- Are any user accounts showing suspicious login patterns?
- Has a login succeeded after repeated failures in a short window?
- Could two logins from different countries in a short period indicate credential sharing or compromise?
- Are accounts logging in at highly unusual hours?
- Has a new device or location appeared on a sensitive-access account?
- What evidence supports each signal, and how confident is the detection?

## Input Format

LogLens accepts CSV files with the following columns:

| Column | Description |
|---|---|
| `timestamp` | ISO 8601 datetime |
| `user_identifier` | Username or email (pseudonymous) |
| `ip_address` | IPv4 or IPv6 address |
| `country` | Two-letter country code |
| `city` | City name (optional) |
| `latitude` | Decimal latitude (optional) |
| `longitude` | Decimal longitude (optional) |
| `login_result` | `success` or `failure` |
| `device_fingerprint` | Device identifier string |
| `resource_accessed` | Resource or service name (optional) |

Columns are validated on upload. Files with missing required columns are rejected with a 400 response.

## Models

- `LoginEvent` — individual parsed login record, linked to the organisation's `UploadedDataset` (the log file upload).
- `LoginAnomaly` — detected suspicious pattern, with evidence snapshot, confidence score, risk score, and MITRE ATT&CK-style tactic mapping.

LoginAnomaly also generates shared platform records:
- `RiskEvent` (for open and escalated anomalies)

## Detection Rules

All six detectors operate over a sliding time window per user:

### 1. Failed Login Burst
More than 5 failed logins within a 15-minute window. Signals brute-force or credential-stuffing attempts.
- Base confidence: 0.75
- Confidence raised to 0.88 if burst count exceeds 10.

### 2. Suspicious Success After Failures
A successful login following 3 or more recent failures (within 30 minutes). May indicate a successful brute-force or a compromised credential.
- Base confidence: 0.80
- Confidence raised to 0.90 if failures occurred within 10 minutes.

### 3. Impossible Travel
Two logins from locations more than 900 km apart within a window too short for physical travel (speed > 900 km/h). Indicates concurrent sessions or a VPN/proxy.
- Base confidence: 0.85
- Confidence raised to 0.92 if a new device is also involved.

### 4. New Device
A successful login from a device fingerprint not seen in previous events for that user.
- Base confidence: 0.65
- Confidence raised to 0.80 if the new device also appears in an unusual hour window.

### 5. Unusual Hour
A login between midnight and 05:00 local time, where local time is approximated from country.
- Base confidence: 0.60
- Confidence raised to 0.72 if the login is also from a new device.

### 6. Sensitive Access After Anomaly
Access to a sensitive resource within 2 hours of a recent anomaly for the same user. Signals possible lateral movement after initial access.
- Base confidence: 0.78

## Risk Scoring

Each `LoginAnomaly` carries:
- `confidence_score` (0–1): weighted signal strength.
- `risk_score` (0–100): composite score from anomaly type severity weight, confidence, existing risk events for the user, and sensitive-resource flag.
- `severity`: info / low / medium / high / critical, derived from risk score bands.

## MITRE ATT&CK-style Mappings

Anomaly types carry cautious tactic labels:
- Failed Login Burst → `T1110 Brute Force (signal — requires review)`
- Suspicious Success → `T1078 Valid Accounts (signal — requires review)`
- Impossible Travel → `T1133 External Remote Services (signal — requires review)`
- New Device → `T1078 Valid Accounts (signal — requires review)`
- Unusual Hour → `T1078 Valid Accounts (signal — requires review)`
- Sensitive Access After Anomaly → `T1078.004 Cloud Accounts (signal — requires review)`

Labels include "signal — requires review" to make clear they are decision-support indicators, not confirmed technique detections.

## RiskEvent Generation

Open and escalated `LoginAnomaly` records generate `RiskEvent` objects with:
- `source_module = "loglens"`
- `event_type = "login_anomaly"`
- Severity and confidence from the anomaly record
- Evidence summary referencing the specific detection rule and supporting events

## API Endpoints

```text
GET  /api/loglens/overview/
GET  /api/loglens/anomalies/
GET  /api/loglens/anomalies/{id}/
PATCH /api/loglens/anomalies/{id}/

POST /api/loglens/upload-logs/
POST /api/loglens/run-detection/
```

Filters for anomaly list:
- `?status=new&severity=high&anomaly_type=impossible_travel`

## Frontend

Pages at `/modules/loglens/`:

- **Overview**: anomaly counts by severity, detection rule summary, recent anomaly feed.
- **Anomalies**: paginated/filterable list with severity badges and status.
- **Anomaly detail**: full evidence timeline, confidence score, risk score, MITRE mapping, and status management.
- **Upload Logs**: CSV upload form with column validation feedback.

## Safety Boundaries

- LogLens only processes CSV files explicitly uploaded by an authorised user.
- No real-time system monitoring, log collection, or agent deployment.
- No credential collection or storage.
- No automated blocking, account lockout, or access revocation.
- All outputs are decision-support signals requiring analyst review before action.

## Current Limitations

- Detection rules are heuristic and tuned for demo-scale datasets; production tuning would require labelled datasets.
- Latitude/longitude-based travel detection falls back to country-centroid if coordinates are missing.
- No deduplication of overlapping anomaly windows.
- No user-behaviour baseline modelling beyond within-upload history.
- Detection is synchronous on the `run-detection` trigger; async Celery task is future work.
