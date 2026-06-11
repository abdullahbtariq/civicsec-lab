import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { getAssetMatches } from "./api";
import { AssetMatchTable } from "./components/AssetMatchTable";
import { ThreatBoardHeader } from "./components/ThreatBoardHeader";
import { ThreatBoardTabs } from "./components/ThreatBoardTabs";
import type { AssetVulnerabilityMatch } from "./types";
import { matchSearchText } from "./utils";

export function AssetMatchesPage() {
  const [matches, setMatches] = useState<AssetVulnerabilityMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskBand, setRiskBand] = useState("");
  const [remediationStatus, setRemediationStatus] = useState("");
  const [matchMethod, setMatchMethod] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadMatches() {
      setIsLoading(true);
      setError(null);
      try {
        setMatches(await getAssetMatches());
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Could not load asset matches.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadMatches();
  }, []);

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return matches.filter((match) => {
      return (
        (!normalizedSearch || matchSearchText(match).includes(normalizedSearch)) &&
        (!riskBand || match.risk_band === riskBand) &&
        (!remediationStatus || match.remediation_status === remediationStatus) &&
        (!matchMethod || match.match_method === matchMethod) &&
        (!status || match.status === status)
      );
    });
  }, [matchMethod, matches, remediationStatus, riskBand, search, status]);

  return (
    <div className="space-y-6">
      <ThreatBoardHeader
        subtitle="Asset-specific vulnerability matches, risk scoring, and remediation status."
        title="Asset Matches"
      />
      <ThreatBoardTabs />

      <Card>
        <CardHeader
          description="Filter organisation-scoped matches by risk, status, method, or asset context."
          title="Matched Assets"
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_11rem_13rem_13rem_11rem]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-civic-muted" />
              <Input
                className="pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search asset, CVE, vendor, product"
                value={search}
              />
            </label>
            <Select onChange={(event) => setRiskBand(event.target.value)} value={riskBand}>
              <option value="">All risk</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <Select
              onChange={(event) => setRemediationStatus(event.target.value)}
              value={remediationStatus}
            >
              <option value="">All remediation</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="affected">Affected</option>
              <option value="not_affected">Not affected</option>
              <option value="patched">Patched</option>
              <option value="mitigated">Mitigated</option>
              <option value="accepted_risk">Accepted risk</option>
            </Select>
            <Select onChange={(event) => setMatchMethod(event.target.value)} value={matchMethod}>
              <option value="">All methods</option>
              <option value="exact_vendor_product">Exact vendor/product</option>
              <option value="keyword_match">Keyword match</option>
              <option value="manual">Manual</option>
              <option value="dependency_file">Dependency file</option>
              <option value="sbom_match">SBOM match</option>
            </Select>
            <Select onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="dismissed">Dismissed</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False positive</option>
            </Select>
          </div>

          {isLoading ? <LoadingState label="Loading asset matches" /> : null}
          {error ? <ErrorState message={error} /> : null}
          {!isLoading && !error && filtered.length ? <AssetMatchTable matches={filtered} /> : null}
          {!isLoading && !error && !filtered.length ? (
            <EmptyState
              description="No asset-vulnerability matches yet. Run matching after adding assets or ingesting vulnerability metadata."
              title="No matches found"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
