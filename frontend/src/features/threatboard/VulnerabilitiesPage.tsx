import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { getVulnerabilitiesPage } from "./api";
import { ThreatBoardHeader } from "./components/ThreatBoardHeader";
import { ThreatBoardTabs } from "./components/ThreatBoardTabs";
import { VulnerabilityTable } from "./components/VulnerabilityTable";
import type { Vulnerability } from "./types";

const PAGE_SIZE = 25;

export function VulnerabilitiesPage() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kevOnly, setKevOnly] = useState(false);
  const [source, setSource] = useState("");
  const [cvssSeverity, setCvssSeverity] = useState("");

  // Debounce free-text search so we fetch once the user pauses, not per keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  // Any filter change resets to the first page (handled in the change handlers);
  // this effect fetches the current page whenever filters or page change.
  useEffect(() => {
    const controller = new AbortController();

    async function loadVulnerabilities() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getVulnerabilitiesPage(
          {
            search: debouncedSearch || undefined,
            kev_only: kevOnly || undefined,
            source: source || undefined,
            cvss_severity: cvssSeverity || undefined,
            page,
            page_size: PAGE_SIZE,
          },
          controller.signal,
        );
        setVulnerabilities(data.results);
        setCount(data.count);
      } catch (caughtError) {
        if (controller.signal.aborted) return;
        setError(caughtError instanceof Error ? caughtError.message : "Could not load vulnerabilities.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadVulnerabilities();
    return () => controller.abort();
  }, [debouncedSearch, kevOnly, source, cvssSeverity, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const rangeStart = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, count);

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
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-soft" />
              <Input
                className="pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search CVE, vendor, product, title"
                value={search}
              />
            </label>
            <label className="flex min-h-10 items-center gap-3 rounded-lg border border-paper-line bg-paper px-3 text-sm text-ink-soft">
              <input
                checked={kevOnly}
                className="h-4 w-4 accent-[#d65a29]"
                onChange={(event) => {
                  setKevOnly(event.target.checked);
                  setPage(1);
                }}
                type="checkbox"
              />
              KEV only
            </label>
            <Select
              onChange={(event) => {
                setSource(event.target.value);
                setPage(1);
              }}
              value={source}
            >
              <option value="">All sources</option>
              <option value="cisa_kev">CISA KEV</option>
              <option value="manual">Manual</option>
              <option value="osv">OSV</option>
              <option value="other">Other</option>
            </Select>
            <Select
              onChange={(event) => {
                setCvssSeverity(event.target.value);
                setPage(1);
              }}
              value={cvssSeverity}
            >
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
          {!isLoading && !error && vulnerabilities.length ? (
            <>
              <VulnerabilityTable vulnerabilities={vulnerabilities} />
              <div className="flex flex-col items-center justify-between gap-3 border-t border-paper-line pt-4 sm:flex-row">
                <p className="text-sm text-ink-soft">
                  Showing{" "}
                  <span className="font-semibold text-ink">
                    {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
                  </span>{" "}
                  of <span className="font-semibold text-ink">{count.toLocaleString()}</span> vulnerabilities
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-sm text-ink-soft">
                    Page <span className="font-semibold text-ink">{page.toLocaleString()}</span> of{" "}
                    {totalPages.toLocaleString()}
                  </span>
                  <Button
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : null}
          {!isLoading && !error && !vulnerabilities.length ? (
            <EmptyState
              description="No vulnerabilities match your filters. Analysts can ingest CISA KEV metadata from the ThreatBoard overview action panel."
              title="No vulnerabilities found"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
