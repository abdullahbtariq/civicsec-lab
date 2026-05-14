import type { ReactNode } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
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
      <Card>
        <CardHeader description={riskEvent.summary || "No summary provided."} title={riskEvent.title} />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Detail label="Severity" value={<SeverityBadge severity={riskEvent.severity} />} />
          <Detail label="Confidence" value={<ConfidenceBadge confidence={riskEvent.confidence} />} />
          <Detail label="Status" value={<StatusBadge status={riskEvent.status} />} />
          <Detail label="Risk score" value={<RiskScoreBadge score={riskEvent.risk_score} />} />
          <Detail label="Source module" value={formatLabel(riskEvent.source_module)} />
          <Detail label="Event type" value={formatLabel(riskEvent.event_type)} />
          <Detail label="Affected asset" value={riskEvent.affected_asset_name || "Not set"} />
          <Detail label="Affected user" value={riskEvent.affected_user_email || "Not set"} />
          <Detail label="First seen" value={formatDateTime(riskEvent.first_seen_at)} />
          <Detail label="Last seen" value={formatDateTime(riskEvent.last_seen_at)} />
          <Detail label="Created" value={formatDateTime(riskEvent.created_at)} />
          <Detail label="Updated" value={formatDateTime(riskEvent.updated_at)} />
        </CardContent>
      </Card>

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
          <CardHeader title="Recommended Action Summary" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              {riskEvent.recommended_action_summary || "No action summary provided."}
            </p>
          </CardContent>
        </Card>
      </section>

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

      <Card>
        <CardHeader title="Recommendations" />
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
                  description="Recommended actions will appear here as risk events mature."
                  title="No recommendations"
                />
              )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Frameworks And Tags" />
        <CardContent className="space-y-4">
          <pre className="overflow-auto rounded-lg border border-civic-line bg-[#111418] p-4 text-xs text-civic-muted">
            {JSON.stringify(riskEvent.mapped_frameworks, null, 2)}
          </pre>
          <div className="flex flex-wrap gap-2">
            {riskEvent.tags.length ? riskEvent.tags.map((tag) => <Badge key={tag}>{tag}</Badge>) : <Badge>No tags</Badge>}
          </div>
          <Button disabled>Incident creation workflow will be wired in a later prompt.</Button>
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
