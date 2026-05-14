import { Link } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiList } from "../../hooks/useApiData";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type { ActionRecommendation, Asset, Incident, ProcessingJob, RiskEvent } from "../../types/api";

const moduleReadiness = [
  ["ThreatBoard", "planned"],
  ["LogLens", "planned"],
  ["DataPrivacy Doctor", "planned"],
  ["Misinformation Observatory", "planned"],
  ["Civic Risk Graph", "planned"],
  ["IncidentFlow", "foundation started"],
];

function CountCard({ label, value, tone = "neutral" }: { label: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-civic-muted">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        <Badge className="mt-3" variant={tone === "hot" ? "rose" : tone === "active" ? "amber" : "teal"}>
          live data
        </Badge>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const assets = useApiList<Asset>("/api/assets/");
  const riskEvents = useApiList<RiskEvent>("/api/risk-events/");
  const incidents = useApiList<Incident>("/api/incidents/");
  const jobs = useApiList<ProcessingJob>("/api/processing-jobs/");
  const recommendations = useApiList<ActionRecommendation>("/api/recommendations/");

  const isLoading = [assets, riskEvents, incidents, jobs, recommendations].some((state) => state.isLoading);
  const error = [assets, riskEvents, incidents, jobs, recommendations].find((state) => state.error)?.error;

  if (isLoading) {
    return <LoadingState label="Loading platform overview" />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const openRiskEvents = riskEvents.data.filter((event) =>
    ["new", "triaged", "investigating"].includes(event.status),
  );
  const highRiskEvents = riskEvents.data.filter((event) => ["high", "critical"].includes(event.severity));
  const activeIncidents = incidents.data.filter((incident) =>
    ["open", "investigating", "contained"].includes(incident.status),
  );
  const openRecommendations = recommendations.data.filter((recommendation) =>
    ["open", "in_progress"].includes(recommendation.status),
  );
  const latestRiskEvents = [...riskEvents.data].slice(0, 5);
  const latestIncidents = [...incidents.data].slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <CountCard label="Assets" value={assets.data.length} />
        <CountCard label="Open Risk Events" tone="active" value={openRiskEvents.length} />
        <CountCard label="High/Critical Risks" tone="hot" value={highRiskEvents.length} />
        <CountCard label="Active Incidents" tone="active" value={activeIncidents.length} />
        <CountCard label="Open Recommendations" tone="active" value={openRecommendations.length} />
        <CountCard label="Processing Jobs" value={jobs.data.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Latest Risk Events" />
          <CardContent>
            {latestRiskEvents.length ? (
              <DataTable
                columns={[
                  {
                    key: "title",
                    header: "Title",
                    cell: (event) => (
                      <Link className="font-medium text-white hover:text-civic-teal" to={`/risk-events/${event.id}`}>
                        {event.title}
                      </Link>
                    ),
                  },
                  { key: "severity", header: "Severity", cell: (event) => <SeverityBadge severity={event.severity} /> },
                  { key: "status", header: "Status", cell: (event) => <StatusBadge status={event.status} /> },
                  { key: "updated", header: "Updated", cell: (event) => formatDateTime(event.updated_at) },
                ]}
                data={latestRiskEvents}
                getRowKey={(event) => event.id}
              />
            ) : (
              <EmptyState
                description="Future modules will generate risk events from vulnerability, login, privacy, and narrative signals."
                title="No risk events yet"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Latest Incidents" />
          <CardContent>
            {latestIncidents.length ? (
              <DataTable
                columns={[
                  {
                    key: "title",
                    header: "Title",
                    cell: (incident) => (
                      <Link className="font-medium text-white hover:text-civic-teal" to={`/incidents/${incident.id}`}>
                        {incident.title}
                      </Link>
                    ),
                  },
                  { key: "type", header: "Type", cell: (incident) => formatLabel(incident.incident_type) },
                  { key: "status", header: "Status", cell: (incident) => <StatusBadge status={incident.status} /> },
                  { key: "opened", header: "Opened", cell: (incident) => formatDateTime(incident.opened_at) },
                ]}
                data={latestIncidents}
                getRowKey={(incident) => incident.id}
              />
            ) : (
              <EmptyState
                description="Incidents will collect response notes, linked risk events, and report-ready timelines."
                title="No incidents yet"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader
          description="Planned modules are visible now; module-specific logic remains intentionally deferred."
          title="Module Readiness"
        />
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {moduleReadiness.map(([name, status]) => (
            <div className="rounded-lg border border-civic-line bg-[#14181d] p-4" key={name}>
              <p className="font-semibold text-white">{name}</p>
              <Badge className="mt-3" variant={status === "planned" ? "neutral" : "teal"}>
                {status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm leading-6 text-civic-muted">
            CivicSec Lab is designed for defensive, educational, and public-interest security use.
            Outputs are decision-support signals and require human review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
