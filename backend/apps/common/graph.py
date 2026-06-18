"""
Civic Risk Graph — data builder.

Collects nodes and edges from all modules for the current organisation
and returns a serialisable dict suitable for the frontend graph renderer.

Design principles:
- Org-scoped: only data belonging to the caller's organisation is included.
- Bounded: reasonable limits per node type so the graph stays readable.
- Non-intrusive: reads existing FK/M2M relationships; no new models or
  migrations required.
"""

from __future__ import annotations

from typing import Any

# --------------------------------------------------------------------------- #
# Node / edge helpers                                                           #
# --------------------------------------------------------------------------- #

def _node(
    node_id: str,
    node_type: str,
    label: str,
    severity: str | None = None,
    meta: dict | None = None,
    url: str = "",
) -> dict[str, Any]:
    return {
        "id": node_id,
        "type": node_type,
        "label": label,
        "severity": severity,
        "meta": meta or {},
        "url": url,
    }


def _edge(
    source: str,
    target: str,
    edge_type: str,
    label: str = "",
) -> dict[str, Any]:
    return {
        "id": f"e-{source}--{target}",
        "source": source,
        "target": target,
        "type": edge_type,
        "label": label,
    }


# --------------------------------------------------------------------------- #
# Main builder                                                                  #
# --------------------------------------------------------------------------- #

def build_graph(organisation) -> dict[str, list[dict]]:
    """
    Return ``{"nodes": [...], "edges": [...]}`` for *organisation*.

    Imports are done inline to avoid circular-import issues when this module
    is loaded at Django startup.
    """
    from apps.assets.models import Asset
    from apps.incidents.models import Incident
    from apps.loglens.models import LoginAnomaly
    from apps.misinformation.models import NarrativeCluster
    from apps.privacy_doctor.models import UploadedDataset
    from apps.risk.models import RiskEvent
    from apps.threatboard.models import AssetVulnerabilityMatch

    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    seen: set[str] = set()

    def add_node(n: dict) -> None:
        if n["id"] not in seen:
            seen.add(n["id"])
            nodes.append(n)

    def maybe_edge(source: str, target: str, edge_type: str, label: str = "") -> None:
        """Only add an edge when both endpoint nodes are present in the graph."""
        if source in seen and target in seen:
            edges.append(_edge(source, target, edge_type, label))

    # ------------------------------------------------------------------ #
    # 1. Assets (all, capped at 30)                                        #
    # ------------------------------------------------------------------ #
    for asset in Asset.objects.filter(organisation=organisation).order_by("name")[:30]:
        add_node(_node(
            node_id=f"asset-{asset.id}",
            node_type="asset",
            label=asset.name,
            meta={
                "asset_type": asset.asset_type,
                "criticality": asset.criticality,
                "data_sensitivity": getattr(asset, "data_sensitivity", ""),
                "internet_exposed": getattr(asset, "internet_exposed", False),
            },
            url=f"/assets/{asset.id}",
        ))

    # ------------------------------------------------------------------ #
    # 2. Open risk events (cap at 40 most recent)                          #
    # ------------------------------------------------------------------ #
    open_events = (
        RiskEvent.objects
        .filter(organisation=organisation, status__in=["new", "triaged", "investigating"])
        .order_by("-created_at")[:40]
    )
    for event in open_events:
        nid = f"risk-{event.id}"
        add_node(_node(
            node_id=nid,
            node_type="risk_event",
            label=event.title[:70],
            severity=event.severity,
            meta={
                "source_module": event.source_module,
                "event_type": event.event_type,
                "status": event.status,
                "confidence": round(event.confidence, 2),
                "summary": (event.summary or "")[:250],
            },
            url=f"/risk-events/{event.id}",
        ))
        if event.affected_asset_id:
            maybe_edge(f"asset-{event.affected_asset_id}", nid, "risk_event_affects_asset", "")

    # ------------------------------------------------------------------ #
    # 3. High/critical vulnerability–asset matches                         #
    # ------------------------------------------------------------------ #
    matches = (
        AssetVulnerabilityMatch.objects
        .filter(asset__organisation=organisation, calculated_risk_score__gte=46)
        .select_related("vulnerability", "asset")
        .order_by("-calculated_risk_score")[:20]
    )
    for match in matches:
        vnid = f"vuln-{match.vulnerability_id}"
        sev = "critical" if match.calculated_risk_score >= 71 else "high"
        add_node(_node(
            node_id=vnid,
            node_type="vulnerability",
            label=match.vulnerability.cve_id,
            severity=sev,
            meta={
                "cve_id": match.vulnerability.cve_id,
                "vendor": match.vulnerability.vendor or "",
                "product": match.vulnerability.product or "",
                "risk_score": match.calculated_risk_score,
                "risk_band": getattr(match, "risk_band", ""),
            },
            url=f"/modules/threatboard/vulnerabilities/{match.vulnerability_id}",
        ))
        maybe_edge(f"asset-{match.asset_id}", vnid, "asset_has_vulnerability", "")

    # ------------------------------------------------------------------ #
    # 4. Active incidents                                                  #
    # ------------------------------------------------------------------ #
    incidents = (
        Incident.objects
        .filter(organisation=organisation)
        .exclude(status__in=["closed", "resolved"])
        .prefetch_related("linked_risk_events")
        .order_by("-created_at")[:10]
    )
    for incident in incidents:
        inid = f"incident-{incident.id}"
        add_node(_node(
            node_id=inid,
            node_type="incident",
            label=incident.title[:70],
            severity=incident.severity,
            meta={
                "status": incident.status,
                "incident_type": incident.incident_type,
                "severity": incident.severity,
            },
            url=f"/incidents/{incident.id}",
        ))
        for re in incident.linked_risk_events.all():
            maybe_edge(inid, f"risk-{re.id}", "incident_contains_risk_event", "")

    # ------------------------------------------------------------------ #
    # 5. Open / escalated login anomalies                                 #
    # ------------------------------------------------------------------ #
    anomalies = (
        LoginAnomaly.objects
        .filter(organisation=organisation, status__in=["new", "escalated", "reviewed"])
        .select_related("risk_event")
        .order_by("-risk_score")[:30]
    )
    for anomaly in anomalies:
        anid = f"anomaly-{anomaly.id}"
        add_node(_node(
            node_id=anid,
            node_type="anomaly",
            label=anomaly.title[:70],
            severity=anomaly.severity,
            meta={
                "anomaly_type": anomaly.anomaly_type,
                "user_identifier": anomaly.user_identifier,
                "status": anomaly.status,
                "risk_score": anomaly.risk_score,
                "mitre_tactic": anomaly.mitre_tactic or "",
            },
            url=f"/modules/loglens/anomalies/{anomaly.id}",
        ))
        re = anomaly.risk_event
        if re is not None:
            rid = f"risk-{re.id}"
            if rid not in seen:
                add_node(_node(
                    node_id=rid, node_type="risk_event", label=re.title[:70],
                    severity=re.severity,
                    meta={
                        "source_module": re.source_module,
                        "event_type": re.event_type,
                        "status": re.status,
                    },
                    url=f"/risk-events/{re.id}",
                ))
            maybe_edge(anid, rid, "anomaly_generates_risk_event", "")

    # ------------------------------------------------------------------ #
    # 6. Narrative clusters needing review / escalated                    #
    # ------------------------------------------------------------------ #
    clusters = (
        NarrativeCluster.objects
        .filter(
            dataset__organisation=organisation,
            status__in=["needs_review", "escalated", "reviewed_concerning"],
        )
        .select_related("linked_risk_event")
        .order_by("-cluster_size")[:40]
    )
    for cluster in clusters:
        cnid = f"cluster-{cluster.id}"
        sev = "high" if cluster.status == "escalated" else "medium"
        add_node(_node(
            node_id=cnid,
            node_type="cluster",
            label=cluster.title[:70],
            severity=sev,
            meta={
                "cluster_size": cluster.cluster_size,
                "sentiment_score": round(cluster.sentiment_score, 3),
                "status": cluster.status,
                "status_display": cluster.get_status_display(),
            },
            url=f"/modules/misinformation-observatory/clusters/{cluster.id}",
        ))
        # Connect the cluster to the risk event it generated. The risk event may
        # fall outside the "recent open" cap above, so add the node if missing.
        re = cluster.linked_risk_event
        if re is not None:
            rid = f"risk-{re.id}"
            if rid not in seen:
                add_node(_node(
                    node_id=rid,
                    node_type="risk_event",
                    label=re.title[:70],
                    severity=re.severity,
                    meta={
                        "source_module": re.source_module,
                        "event_type": re.event_type,
                        "status": re.status,
                        "summary": (re.summary or "")[:250],
                    },
                    url=f"/risk-events/{re.id}",
                ))
            maybe_edge(cnid, rid, "cluster_generates_risk_event", "")

    # ------------------------------------------------------------------ #
    # 7. High-risk uploaded datasets                                      #
    # ------------------------------------------------------------------ #
    datasets = (
        UploadedDataset.objects
        .filter(
            organisation=organisation,
            processing_status="complete",
            risk_band__in=["high", "severe"],
        )
        .select_related("risk_event")
        .order_by("-privacy_risk_score")[:15]
    )
    for ds in datasets:
        dnid = f"dataset-{ds.id}"
        sev = "critical" if ds.risk_band == "severe" else "high"
        add_node(_node(
            node_id=dnid,
            node_type="dataset",
            label=ds.original_filename[:60],
            severity=sev,
            meta={
                "risk_band": ds.risk_band,
                "privacy_risk_score": ds.privacy_risk_score,
                "row_count": ds.row_count,
            },
            url=f"/modules/privacy-doctor/datasets/{ds.id}",
        ))
        re = ds.risk_event
        if re is not None:
            rid = f"risk-{re.id}"
            if rid not in seen:
                add_node(_node(
                    node_id=rid, node_type="risk_event", label=re.title[:70],
                    severity=re.severity,
                    meta={
                        "source_module": re.source_module,
                        "event_type": re.event_type,
                        "status": re.status,
                    },
                    url=f"/risk-events/{re.id}",
                ))
            maybe_edge(dnid, rid, "dataset_has_privacy_risk", "")

    return {"nodes": nodes, "edges": edges}
