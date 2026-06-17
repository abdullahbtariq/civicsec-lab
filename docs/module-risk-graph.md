# Civic Risk Graph

The Civic Risk Graph provides a cross-module connected view of an organisation's risk landscape. It reads existing data relationships from all modules and presents them as an interactive node-and-edge graph, making it easier to see connections between assets, vulnerabilities, anomalies, incidents, and narrative signals that would otherwise be visible only by navigating between modules separately.

The graph is read-only and derives its structure entirely from FK/M2M relationships already captured by other modules. It adds no new models or migrations.

## Purpose

The Civic Risk Graph answers:

- Which assets have the most active risk connections?
- Is a vulnerability match linked to an incident via a risk event?
- Are login anomalies and narrative clusters both pointing at the same asset or user group?
- What is the overall shape of the risk picture — a few isolated signals, or a cluster of connected activity?

## Node Types

| Type | Source | Colour |
|---|---|---|
| `asset` | Asset model (all, capped 30) | Teal |
| `vulnerability` | AssetVulnerabilityMatch with score ≥ 46 (capped 20) | Orange |
| `risk_event` | RiskEvent with status new/triaged/investigating (capped 40) | Red |
| `anomaly` | LoginAnomaly with status new/escalated (capped 10) | Purple |
| `cluster` | NarrativeCluster with status needs_review/escalated (capped 10) | Amber |
| `dataset` | UploadedDataset (Privacy Doctor) with risk_band high/severe (capped 5) | Blue |
| `incident` | Incident not closed/resolved (capped 10) | Pink |

Caps keep the graph readable for demo-scale data. Higher-priority items within each type are preferred (e.g. highest risk score for vulnerabilities, most recent for risk events).

## Edge Types

Edges are derived from existing FK/M2M fields — no new relationships are stored:

| Edge type | Source relationship |
|---|---|
| `asset_has_vulnerability` | `AssetVulnerabilityMatch.asset` → `AssetVulnerabilityMatch.vulnerability` |
| `risk_event_affects_asset` | `RiskEvent.affected_asset` → Asset |
| `incident_contains_risk_event` | `Incident.linked_risk_events` (M2M) → RiskEvent |
| `anomaly_generates_risk_event` | `LoginAnomaly.risk_event` → RiskEvent |
| `cluster_generates_risk_event` | `NarrativeCluster.linked_risk_event` → RiskEvent |
| `dataset_has_privacy_risk` | `UploadedDataset.risk_event` → RiskEvent (Privacy Doctor) |

Edges are only added when both endpoint nodes are present in the graph (i.e. both pass the type cap and filter criteria).

## API Endpoint

```text
GET /api/graph/
```

Returns:

```json
{
  "nodes": [
    {
      "id": "asset-1",
      "type": "asset",
      "label": "Civic Portal",
      "severity": null,
      "meta": {
        "asset_type": "web_application",
        "criticality": "high",
        "internet_exposed": true
      },
      "url": "/assets/1"
    }
  ],
  "edges": [
    {
      "id": "e-asset-1--risk-3",
      "source": "asset-1",
      "target": "risk-3",
      "type": "risk_event_affects_asset",
      "label": ""
    }
  ]
}
```

All data is organisation-scoped. Requires authentication with `IsOrganisationScopedRole`.

## Frontend

At `/modules/risk-graph`:

- **Graph canvas**: React Flow canvas with pan, zoom, and minimap. Nodes are arranged in type-based columns.
- **Legend**: colour-coded dot legend for all seven node types.
- **Node card**: each node shows its type badge, label (truncated), and severity dot if applicable.
- **Node detail panel**: clicking a node opens a side panel with all `meta` fields (humanised labels), the severity indicator, and a "Open full record" deep-link to the source module page.
- **Empty state**: when the graph has no data (e.g. before seeding), a message explains that the graph populates as modules produce findings.

## Implementation Notes

- The graph builder is in `backend/apps/common/graph.py`.
- Inline model imports avoid circular-import issues at Django startup.
- Node IDs are prefixed by type (`asset-{id}`, `risk-{id}`, etc.) to avoid collisions across models.
- Layout is computed client-side in `RiskGraphPage.tsx` using a simple column-per-type algorithm. No server-side layout calculation.

## Current Limitations

- Column layout is suitable for small-to-medium graphs. Force-directed or hierarchical layout is future work.
- Node caps are fixed constants; user-configurable caps are future work.
- No edge label rendering in the default style (labels are stored but not shown by default to reduce visual noise).
- No graph persistence — layout positions reset on page reload.
- No filtering controls on the frontend graph view.
