import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { ConfidenceBadge } from "../../components/ui/ConfidenceBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { RiskScoreBadge } from "../../components/ui/RiskScoreBadge";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiItem, useApiList } from "../../hooks/useApiData";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type { ActionRecommendation, EvidenceItem, RiskEvent } from "../../types/api";

export function RiskEventDetailPage() {
  const { id } = useParams();
  const riskEventId = Number(id);
  const { data: riskEvent, isLoading, error } = useApiItem<RiskEvent>(
    id ? `/api/risk-events/${id}/` : null,
  );
  const evidence = useApiList<EvidenceItem>("/api/evidence-items/");
  const recommendations = useApiList<ActionRecommendation>("/api/recommendations/");

  if (isLoading) return <LoadingState label="Loading risk event" />;
  if (error) return <ErrorState message={error} />;
  if (!riskEvent) {
    return <EmptyState description="The requested risk event could not be found." title="Risk event not found" />;
  }

  const relatedEvidence = evidence.data.filter((item) => item.risk_event === riskEventId);
  const relatedRecommendations = recommendations.data.filter((item) => item.risk_event === riskEventId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-civic-muted">
            <Link to="/risk-events" className="transition-colors hover:text-white">
              Risk Events
            </Link>{" "}
            / {riskEvent.title}
          </nav>
          <h1 className="font-display text-xl font-semibold text-white">{riskEvent.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={riskEvent.severity} />
            <StatusBadge status={riskEvent.status} />
            <ConfidenceBadge confidence={riskEvent.confidence} />
            <RiskScoreBadge score={riskEvent.risk_score} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink to="/incidents/new" variant="primary">
            Create Incident
          </ButtonLink>
        </div>
      </div>

      {/* Overview metadata */}
      <Card>
        <CardHeader
          description={riskEvent.summary || "No summary provided."}
          title="Overview"
        />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Detail label="Source module"    value={formatLabel(riskEvent.source_module)} />
          <Detail label="Event type"       value={formatLabel(riskEvent.event_type)} />
          <Detail label="Affected asset"   value={riskEvent.affected_asset_name || "Not set"} />
          <Detail label="Affected user"    value={riskEvent.affected_user_email || "Not set"} />
          <Detail label="First seen"       value={formatDateTime(riskEvent.first_seen_at)} />
          <Detail label="Last seen"        value={formatDateTime(riskEvent.last_seen_at)} />
          <Detail label="Created"          value={formatDateTime(riskEvent.created_at)} />
          <Detail label="Updated"          value={formatDateTime(riskEvent.updated_at)} />
        </CardContent>
      </Card>

      {/* Summaries */}
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Evidence Summary" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              {riskEvent.evidence_summary || "No evidence summary provided."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Recommended Action" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              {riskEvent.recommended_action_summary || "No action summary provided."}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Evidence items */}
      <Card>
        <CardHeader title="Evidence Items" />
        <CardContent className="space-y-3">
          {evidence.isLoading ? <LoadingState label="Loading evidence" /> : null}
          {evidence.error ? <ErrorState message={evidence.error} /> : null}
          {relatedEvidence.length
            ? relatedEvidence.map((item) => (
                <div className="rounded-lg border border-civic-line bg-[#14181d] p-4" key={item.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="blue">{formatLabel(item.evidence_type)}</Badge>
                    <ConfidenceBadge confidence={item.confidence} />
                  </div>
                  <p className="mt-3 font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-civic-muted">{item.description}</p>
                  <p className="mt-2 text-xs text-civic-muted">{item.source || "No source reference"}</p>
                </div>
              ))
            : !evidence.isLoading && (
                <EmptyState
                  description="Evidence items will appear here when modules or analysts attach supporting context."
                  title="No linked evidence"
                />
              )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader title="Action Recommendations" />
        <CardContent className="space-y-3">
          {recommendations.isLoading ? <LoadingState label="Loading recommendations" /> : null}
          {recommendations.error ? <ErrorState message={recommendations.error} /> : null}
          {relatedRecommendations.length
            ? relatedRecommendations.map((item) => (
                <div className="rounded-lg border border-civic-line bg-[#14181d] p-4" key={item.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.priority === "urgent" ? "rose" : "amber"}>
                      {formatLabel(item.priority)}
                    </Badge>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-civic-muted">{item.description}</p>
                </div>
              ))
            : !recommendations.isLoading && (
                <EmptyState
                  description="Recommended actions will appear here as the risk event matures."
                  title="No recommendations"
                />
              )}
        </CardContent>
      </Card>

      {/* Frameworks & Tags */}
      <Card>
        <CardHeader title="Frameworks & Tags" />
        <CardContent className="space-y-4">
          {riskEvent.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {riskEvent.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>
          )}
          <pre className="overflow-auto rounded-lg border border-civic-line bg-[#111418] p-4 text-xs text-civic-muted">
            {JSON.stringify(riskEvent.mapped_frameworks, null, 2)}
          </pre>
        </CardContent>
      </Card>
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
