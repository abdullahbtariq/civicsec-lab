# ThreatBoard

ThreatBoard is CivicSec Lab's defensive vulnerability intelligence module. It helps small civic organisations decide which vulnerability records matter to their own assets, why a finding is prioritised, and what should be reviewed next.

ThreatBoard does not include exploit code, offensive instructions, or scanning of third-party targets.

## Purpose

ThreatBoard answers:

- Which vulnerabilities may affect our assets?
- Are any known exploited vulnerabilities relevant to our inventory?
- Which assets should be reviewed or patched first?
- What evidence supports the priority?
- What should be done next?

## Data Sources

Current MVP:

- CISA Known Exploited Vulnerabilities catalog.
- FIRST EPSS public API.
- Internal CivicSec Lab asset inventory.
- Manual fictional demo records.

Prepared for later:

- OSV-style dependency intelligence.
- SBOM and dependency-file matching.

## Models

- `Vulnerability`: global public vulnerability metadata keyed by CVE ID.
- `VulnerabilityScore`: EPSS, CVSS placeholder fields, and known-exploited flags.
- `AssetVulnerabilityMatch`: organisation-scoped relationship between an asset and vulnerability.
- `ThreatIngestionRun`: ingestion, enrichment, matching, and scoring run history.

ThreatBoard also generates shared platform records:

- `RiskEvent`
- `EvidenceItem`
- `ActionRecommendation`

## Ingestion Flow

1. `ingest_kev` fetches the public CISA KEV JSON feed.
2. KEV records are parsed and upserted by CVE ID.
3. Each KEV vulnerability gets or updates a `VulnerabilityScore` with `kev_known_exploited = true`.
4. `enrich_epss` can add FIRST EPSS score and percentile values.
5. `match_vulnerabilities` compares vulnerability vendor/product metadata to organisation assets.
6. High or critical matches can create explainable risk events.

Live KEV and EPSS commands require external network access.

## Scoring Formula

ThreatBoard Risk Score is a 0-100 decision-support score:

- 30 points for known exploited KEV-style metadata.
- Up to 20 points from EPSS percentile, or EPSS score if percentile is unavailable.
- Up to 15 points from asset criticality.
- 15 points for internet-exposed assets.
- Up to 10 points from data sensitivity.
- 5 points if remediation is overdue.
- Up to 5 points from asset-match confidence.

Risk bands:

- 0-20: low
- 21-45: medium
- 46-70: high
- 71-100: critical

Scores are explainable signals, not certainty. Analysts must verify whether an asset is actually affected.

## Risk Event Generation

ThreatBoard creates or updates a `RiskEvent` when a match is high priority, including:

- known exploited vulnerability match
- high exploit-probability vulnerability
- vulnerable internet-facing asset
- overdue vulnerability remediation

Generated records include:

- evidence summary
- mapped framework hints
- CVE and module tags
- linked evidence item
- remediation recommendations

Recommendations use defensive language such as confirm affected status, review vendor guidance, apply patch or mitigation, review logs, and update inventory.

## API Endpoints

```text
GET  /api/threatboard/overview/
GET  /api/threatboard/vulnerabilities/
GET  /api/threatboard/vulnerabilities/{id}/
GET  /api/threatboard/scores/
GET  /api/threatboard/asset-matches/
GET  /api/threatboard/asset-matches/{id}/
GET  /api/threatboard/ingestion-runs/
POST /api/threatboard/ingest-kev/
POST /api/threatboard/enrich-epss/
POST /api/threatboard/match-assets/
```

Viewer users can read. Analyst and admin users can trigger ingestion, enrichment, and matching. Asset matches are organisation-scoped. Vulnerability metadata is global public metadata.

## Safety Boundaries

ThreatBoard is limited to defensive prioritisation:

- no exploit code
- no offensive instructions
- no weaponised payloads
- no arbitrary target scanning
- no exploit database links
- no claim that EPSS means exploitation is certain

## Current Limitations

- Matching is conservative and based on vendor/product metadata.
- EPSS enrichment is synchronous in the management command/API endpoint.
- OSV, SBOM, dependency manifests, and scheduler automation are future work.
- The frontend ThreatBoard dashboard is intentionally deferred to Prompt 5.
