import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { getIngestionRuns } from "./api";
import { IngestionRunTable } from "./components/IngestionRunTable";
import { ThreatBoardHeader } from "./components/ThreatBoardHeader";
import { ThreatBoardTabs } from "./components/ThreatBoardTabs";
import type { ThreatIngestionRun } from "./types";

export function IngestionRunsPage() {
  const [runs, setRuns] = useState<ThreatIngestionRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runType, setRunType] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    async function loadRuns() {
      setIsLoading(true);
      setError(null);
      try {
        setRuns(await getIngestionRuns());
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Could not load ingestion runs.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRuns();
  }, []);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      return (
        (!runType || run.run_type === runType) &&
        (!status || run.status === status) &&
        (!source || run.source === source)
      );
    });
  }, [runType, runs, source, status]);

  return (
    <div className="space-y-6">
      <ThreatBoardHeader
        subtitle="Track KEV ingestion, EPSS enrichment, asset matching, and scoring runs."
        title="Ingestion Runs"
      />
      <ThreatBoardTabs />

      <Card>
        <CardHeader
          description="Operational history for backend ThreatBoard jobs."
          title="Run History"
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select onChange={(event) => setRunType(event.target.value)} value={runType}>
              <option value="">All run types</option>
              <option value="kev_ingestion">KEV ingestion</option>
              <option value="epss_enrichment">EPSS enrichment</option>
              <option value="asset_matching">Asset matching</option>
              <option value="risk_scoring">Risk scoring</option>
            </Select>
            <Select onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="">All status</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="completed_with_errors">Completed with errors</option>
            </Select>
            <Select onChange={(event) => setSource(event.target.value)} value={source}>
              <option value="">All sources</option>
              <option value="cisa_kev">CISA KEV</option>
              <option value="first_epss">FIRST EPSS</option>
              <option value="internal">Internal</option>
              <option value="manual">Manual</option>
            </Select>
          </div>

          {isLoading ? <LoadingState label="Loading ingestion runs" /> : null}
          {error ? <ErrorState message={error} /> : null}
          {!isLoading && !error && filteredRuns.length ? <IngestionRunTable runs={filteredRuns} /> : null}
          {!isLoading && !error && !filteredRuns.length ? (
            <EmptyState
              description="Ingestion runs will appear after an analyst triggers KEV ingestion, EPSS enrichment, or asset matching."
              title="No ingestion runs found"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
