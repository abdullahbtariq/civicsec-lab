import { useMemo } from "react";
import { Link } from "react-router-dom";

import { ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { useApiList } from "../../hooks/useApiData";
import { formatDateTime } from "../../lib/utils";
import type { Incident } from "../../types/api";

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "rose" | "amber" | "green" | "blue";
}) {
  const toneMap = {
    neutral: "border-paper-line bg-paper-card",
    rose: "border-civic-rose/40 bg-civic-rose/10",
    amber: "border-civic-amber/30 bg-civic-amber/5",
    green: "border-civic-teal/30 bg-civic-teal/5",
    blue: "border-civic-blue/30 bg-civic-blue/5",
  };
  const valueMap = {
    neutral: "text-ink",
    rose: "text-rose-ink",
    amber: "text-gold-ink",
    green: "text-orange-ink",
    blue: "text-bluec-ink",
  };
  return (
    <div className={`rounded-lg border p-4 ${toneMap[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${valueMap[tone]}`}>{value}</p>
    </div>
  );
}

export function IncidentFlowOverviewPage() {
  const { user } = useAuth();
  const { data: incidents, isLoading, error } = useApiList<Incident>("/api/incidents/");
  const canCreate = user?.role === "admin" || user?.role === "analyst";

  const stats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status === "open").length;
    const investigating = incidents.filter((i) => i.status === "investigating").length;
    const critical = incidents.filter((i) => i.severity === "critical").length;
    const resolved = incidents.filter(
      (i) => i.status === "resolved" || i.status === "closed",
    ).length;
    return { total, open, investigating, critical, resolved };
  }, [incidents]);

  const recent = useMemo(
    () =>
      [...incidents]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 6),
    [incidents],
  );

  if (isLoading) return <LoadingState label="Loading IncidentFlow" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">IncidentFlow</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            Structured incident response — playbooks, task checklists, and report-ready timelines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/incidents" variant="secondary">
            All Incidents
          </ButtonLink>
          {canCreate && (
            <ButtonLink to="/incidents/new" variant="primary">
              + New Incident
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Responsible-use note */}
      <div className="rounded-lg border border-paper-line bg-paper-card/60 px-4 py-3 text-xs text-ink-soft">
        <span className="font-medium text-ink">Structured response tool. </span>
        IncidentFlow supports response workflows. All decisions and actions must be taken by
        qualified humans. Outputs do not constitute legal or security advice.
      </div>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Open" value={stats.open} tone={stats.open > 0 ? "rose" : "neutral"} />
        <StatCard
          label="Investigating"
          value={stats.investigating}
          tone={stats.investigating > 0 ? "amber" : "neutral"}
        />
        <StatCard
          label="Critical"
          value={stats.critical}
          tone={stats.critical > 0 ? "rose" : "neutral"}
        />
        <StatCard label="Resolved / Closed" value={stats.resolved} tone="green" />
      </section>

      {/* Recent incidents */}
      <Card>
        <CardHeader
          title="Recent Activity"
          description="Most recently updated incidents across your organisation."
        />
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState
              title="No incidents yet"
              description="Create your first incident or escalate a risk event to get started."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-paper-line text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Severity</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line">
                  {recent.map((inc) => (
                    <tr key={inc.id} className="transition-colors hover:bg-paper-raise">
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/incidents/${inc.id}`}
                          className="font-medium text-ink hover:text-orange-ink transition-colors"
                        >
                          {inc.title}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-ink-soft text-xs">
                        {inc.incident_type.replace(/_/g, " ")}
                      </td>
                      <td className="px-3 py-2.5">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-soft">
                        {formatDateTime(inc.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
