import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiItem, useApiList } from "../../hooks/useApiData";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type { Incident, IncidentTimelineEntry, RiskEvent } from "../../types/api";

export function IncidentDetailPage() {
  const { id } = useParams();
  const incidentId = Number(id);
  const { data: incident, isLoading, error } = useApiItem<Incident>(
    id ? `/api/incidents/${id}/` : null,
  );
  const timeline = useApiList<IncidentTimelineEntry>("/api/incident-timeline/");
  const riskEvents = useApiList<RiskEvent>("/api/risk-events/");

  if (isLoading) return <LoadingState label="Loading incident" />;
  if (error) return <ErrorState message={error} />;
  if (!incident) return <EmptyState description="The requested incident could not be found." title="Incident not found" />;

  const linkedRiskEvents = riskEvents.data.filter((event) => incident.linked_risk_events.includes(event.id));
  const timelineEntries = timeline.data.filter((entry) => entry.incident === incidentId);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader description={incident.description || "No description provided."} title={incident.title} />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Detail label="Severity" value={<SeverityBadge severity={incident.severity} />} />
          <Detail label="Status" value={<StatusBadge status={incident.status} />} />
          <Detail label="Type" value={formatLabel(incident.incident_type)} />
          <Detail label="Owner" value={incident.owner_email || "Not set"} />
          <Detail label="Opened" value={formatDateTime(incident.opened_at)} />
          <Detail label="Closed" value={formatDateTime(incident.closed_at)} />
          <Detail label="Created" value={formatDateTime(incident.created_at)} />
          <Detail label="Updated" value={formatDateTime(incident.updated_at)} />
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Linked Risk Events" />
          <CardContent className="space-y-3">
            {riskEvents.isLoading ? <LoadingState label="Loading linked risks" /> : null}
            {riskEvents.error ? <ErrorState message={riskEvents.error} /> : null}
            {linkedRiskEvents.length
              ? linkedRiskEvents.map((riskEvent) => (
                  <Link
                    className="block rounded-lg border border-civic-line bg-[#14181d] p-4 hover:border-civic-teal/60"
                    key={riskEvent.id}
                    to={`/risk-events/${riskEvent.id}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={riskEvent.severity} />
                      <StatusBadge status={riskEvent.status} />
                    </div>
                    <p className="mt-3 font-medium text-white">{riskEvent.title}</p>
                  </Link>
                ))
              : !riskEvents.isLoading && (
                  <EmptyState
                    description="Linked risk events will appear here when incidents are created from alerts."
                    title="No linked risk events"
                  />
                )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Report Placeholder" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              Incident report generation will be implemented with IncidentFlow in a later prompt.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader title="Timeline" />
        <CardContent className="space-y-3">
          {timeline.isLoading ? <LoadingState label="Loading timeline" /> : null}
          {timeline.error ? <ErrorState message={timeline.error} /> : null}
          {timelineEntries.length
            ? timelineEntries.map((entry) => (
                <div className="rounded-lg border border-civic-line bg-[#14181d] p-4" key={entry.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="blue">{formatLabel(entry.entry_type)}</Badge>
                    <span className="text-xs text-civic-muted">{formatDateTime(entry.timestamp)}</span>
                  </div>
                  <p className="mt-3 font-medium text-white">{entry.title}</p>
                  <p className="mt-2 text-sm leading-6 text-civic-muted">{entry.description}</p>
                  <p className="mt-2 text-xs text-civic-muted">{entry.actor_email || "No actor recorded"}</p>
                </div>
              ))
            : !timeline.isLoading && (
                <EmptyState
                  description="Timeline entries will track notes, status changes, evidence updates, and reports."
                  title="No timeline entries"
                />
              )}
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Timeline Summary" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              {incident.timeline_summary || "No timeline summary provided."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Lessons Learned" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              {incident.lessons_learned || "Lessons learned will be captured after response review."}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-civic-line bg-[#14181d] p-4">
      <p className="text-xs uppercase text-civic-muted">{label}</p>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
