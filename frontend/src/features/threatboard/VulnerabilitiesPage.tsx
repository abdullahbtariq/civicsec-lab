import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { getVulnerabilities } from "./api";
import { ThreatBoardHeader } from "./components/ThreatBoardHeader";
import { ThreatBoardTabs } from "./components/ThreatBoardTabs";
import { VulnerabilityTable } from "./components/VulnerabilityTable";
import type { Vulnerability } from "./types";
import { isKnownExploited, vulnerabilitySearchText } from "./utils";

export function VulnerabilitiesPage() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kevOnly, setKevOnly] = useState(false);
  const [source, setSource] = useState("");
  const [cvssSeverity, setCvssSeverity] = useState("");

  useEffect(() => {
    async function loadVulnerabilities() {
      setIsLoading(true);
      setError(null);
      try {
        setVulnerabilities(await getVulnerabilities());
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Could not load vulnerabilities.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadVulnerabilities();
  }, []);

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return vulnerabilities
      .filter((vulnerability) => {
        return (
          (!normalizedSearch || vulnerabilitySearchText(vulnerability).includes(normalizedSearch)) &&
          (!kevOnly || isKnownExploited(vulnerability)) &&
          (!source || vulnerability.source === source) &&
          (!cvssSeverity || vulnerability.score?.cvss_severity === cvssSeverity)
        );
      })
      .sort((left, right) => left.cve_id.localeCompare(right.cve_id));
  }, [cvssSeverity, kevOnly, search, source, vulnerabilities]);

  return (
    <div className="space-y-6">
      <ThreatBoardHeader
        subtitle="Review public vulnerability metadata and prioritisation signals without exploit content."
        title="Vulnerabilities"
      />
      <ThreatBoardTabs />

      <Card>
        <CardHeader
          description="Search and filter global vulnerability metadata. Asset relevance appears under matches."
          title="Vulnerability Catalog"
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_11rem_13rem_13rem]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-civic-muted" />
              <Input
                className="pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search CVE, vendor, product, title"
                value={search}
              />
            </label>
            <label className="flex min-h-10 items-center gap-3 rounded-lg border border-civic-line bg-[#111418] px-3 text-sm text-civic-muted">
              <input
                checked={kevOnly}
                className="h-4 w-4 accent-civic-teal"
                onChange={(event) => setKevOnly(event.target.checked)}
                type="checkbox"
              />
              KEV only
            </label>
            <Select onChange={(event) => setSource(event.target.value)} value={source}>
              <option value="">All sources</option>
              <option value="cisa_kev">CISA KEV</option>
              <option value="manual">Manual</option>
              <option value="osv">OSV</option>
              <option value="other">Other</option>
            </Select>
            <Select onChange={(event) => setCvssSeverity(event.target.value)} value={cvssSeverity}>
              <option value="">All CVSS severity</option>
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="unknown">Unknown</option>
            </Select>
          </div>

          {isLoading ? <LoadingState label="Loading vulnerabilities" /> : null}
          {error ? <ErrorState message={error} /> : null}
          {!isLoading && !error && filtered.length ? <VulnerabilityTable vulnerabilities={filtered} /> : null}
          {!isLoading && !error && !filtered.length ? (
            <EmptyState
              description="No vulnerabilities found yet. Analysts can ingest CISA KEV metadata from the ThreatBoard overview action panel."
              title="No vulnerabilities found"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
