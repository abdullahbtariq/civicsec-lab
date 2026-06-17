import { RefreshCcw, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useAuth } from "../../../hooks/useAuth";
import { canCreateOperationalRecords } from "../../../lib/auth";
import { triggerAssetMatching, triggerEpssEnrichment, triggerKevIngestion } from "../api";

type ActionState = {
  isRunning: boolean;
  error: string | null;
  success: string | null;
};

export function ThreatBoardActionPanel({ onActionComplete }: { onActionComplete: () => void }) {
  const { user } = useAuth();
  const [matchAfterKev, setMatchAfterKev] = useState(true);
  const [enrichAfterKev, setEnrichAfterKev] = useState(false);
  const [createRiskEvents, setCreateRiskEvents] = useState(true);
  const [state, setState] = useState<ActionState>({ isRunning: false, error: null, success: null });
  const canTrigger = canCreateOperationalRecords(user);

  async function runAction(label: string, action: () => Promise<unknown>) {
    if (!window.confirm(`${label}? This calls the backend and may take a moment.`)) {
      return;
    }
    setState({ isRunning: true, error: null, success: null });
    try {
      await action();
      setState({ isRunning: false, error: null, success: `${label} completed.` });
      onActionComplete();
    } catch (error) {
      setState({
        isRunning: false,
        error: error instanceof Error ? error.message : "ThreatBoard action failed.",
        success: null,
      });
    }
  }

  return (
    <Card>
      <CardHeader
        description="Trigger defensive ingestion and matching through the backend. Live ingestion uses public external sources and may take a moment."
        title="Actions"
      />
      <CardContent className="space-y-4">
        {!canTrigger ? (
          <div className="rounded-lg border border-paper-line bg-paper-card p-4">
            <p className="text-sm leading-6 text-ink-soft">
              Viewer accounts can inspect ThreatBoard findings but cannot trigger ingestion or
              matching.
            </p>
          </div>
        ) : null}

        {state.error ? <ErrorState message={state.error} /> : null}
        {state.success ? (
          <div className="rounded-lg border border-civic-teal/40 bg-civic-teal/10 p-4 text-sm text-orange-ink">
            {state.success}
          </div>
        ) : null}

        <div className="grid gap-3">
          <label className="flex items-center gap-3 text-sm text-ink-soft">
            <input
              checked={matchAfterKev}
              className="h-4 w-4 accent-civic-teal"
              disabled={!canTrigger || state.isRunning}
              onChange={(event) => setMatchAfterKev(event.target.checked)}
              type="checkbox"
            />
            Match assets after KEV ingestion
          </label>
          <label className="flex items-center gap-3 text-sm text-ink-soft">
            <input
              checked={enrichAfterKev}
              className="h-4 w-4 accent-civic-teal"
              disabled={!canTrigger || state.isRunning}
              onChange={(event) => setEnrichAfterKev(event.target.checked)}
              type="checkbox"
            />
            Enrich EPSS after KEV ingestion
          </label>
          <label className="flex items-center gap-3 text-sm text-ink-soft">
            <input
              checked={createRiskEvents}
              className="h-4 w-4 accent-civic-teal"
              disabled={!canTrigger || state.isRunning}
              onChange={(event) => setCreateRiskEvents(event.target.checked)}
              type="checkbox"
            />
            Create RiskEvents after matching
          </label>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <Button
            disabled={!canTrigger || state.isRunning}
            onClick={() =>
              void runAction("Ingest CISA KEV", () =>
                triggerKevIngestion({ match_assets: matchAfterKev, enrich_epss: enrichAfterKev }),
              )
            }
            variant="primary"
          >
            <ShieldAlert aria-hidden="true" className="h-4 w-4" />
            Ingest CISA KEV
          </Button>
          <Button
            disabled={!canTrigger || state.isRunning}
            onClick={() => void runAction("Enrich EPSS", () => triggerEpssEnrichment({ limit: 20 }))}
          >
            <RefreshCcw aria-hidden="true" className="h-4 w-4" />
            Enrich EPSS
          </Button>
          <Button
            disabled={!canTrigger || state.isRunning}
            onClick={() =>
              void runAction("Match vulnerabilities to assets", () =>
                triggerAssetMatching({ create_risk_events: createRiskEvents }),
              )
            }
          >
            <Search aria-hidden="true" className="h-4 w-4" />
            Match Assets
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
