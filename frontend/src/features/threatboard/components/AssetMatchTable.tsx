import { Link } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { ConfidenceBadge } from "../../../components/ui/ConfidenceBadge";
import { DataTable } from "../../../components/ui/DataTable";
import { RiskScoreBadge } from "../../../components/ui/RiskScoreBadge";
import { SeverityBadge } from "../../../components/ui/SeverityBadge";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDateTime, formatLabel } from "../../../lib/utils";
import type { AssetVulnerabilityMatch } from "../types";

export function AssetMatchTable({ matches }: { matches: AssetVulnerabilityMatch[] }) {
  return (
    <DataTable
      columns={[
        {
          key: "asset",
          header: "Asset",
          cell: (match) => (
            <Link
              className="font-semibold text-white hover:text-civic-teal"
              to={`/modules/threatboard/matches/${match.id}`}
            >
              {match.asset.name}
            </Link>
          ),
        },
        {
          key: "vulnerability",
          header: "Vulnerability",
          cell: (match) => (
            <Link
              className="font-medium text-white hover:text-civic-teal"
              to={`/modules/threatboard/vulnerabilities/${match.vulnerability.id}`}
            >
              {match.vulnerability.cve_id}
            </Link>
          ),
        },
        { key: "method", header: "Match method", cell: (match) => formatLabel(match.match_method) },
        {
          key: "confidence",
          header: "Confidence",
          cell: (match) => <ConfidenceBadge confidence={match.match_confidence} />,
        },
        {
          key: "score",
          header: "Risk score",
          cell: (match) => <RiskScoreBadge score={match.calculated_risk_score} />,
        },
        { key: "band", header: "Risk band", cell: (match) => <SeverityBadge severity={match.risk_band} /> },
        {
          key: "remediation",
          header: "Remediation",
          cell: (match) => <Badge variant="amber">{formatLabel(match.remediation_status)}</Badge>,
        },
        { key: "status", header: "Status", cell: (match) => <StatusBadge status={match.status} /> },
        { key: "last", header: "Last seen", cell: (match) => formatDateTime(match.last_seen_at) },
      ]}
      data={matches}
      getRowKey={(match) => match.id}
    />
  );
}
