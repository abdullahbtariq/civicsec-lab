import { ClipboardList, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiList } from "../../hooks/useApiData";
import { cn, formatDateTime, formatLabel } from "../../lib/utils";
import type { ActionRecommendation, Asset, Incident, ProcessingJob, RiskEvent } from "../../types/api";

// ─── Stat card ────────────────────────────────────────────────────────────────
// Number colour is semantic: rose when critical alerts exist, amber when there
// are open warnings. Zero always shows muted — don't celebrate empty data.
// Pass `to` to make the card a navigable link to the relevant list page.
function StatCard({
  label,
  value,
  tone = "neutral",
  to,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "active" | "hot";
  to?: string;
}) {
  const numClass =
    value === 0       ? "text-civic-muted"  :
    tone === "hot"    ? "text-civic-rose"   :
    tone === "active" ? "text-civic-amber"  :
    /* neutral > 0 */   "text-white";

  const content = (
    <Card className={cn(to && "h-full transition-colors group-hover:border-civic-teal/30")}>
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-wide text-civic-muted">{label}</p>
        <p className={cn("mt-3 font-display text-4xl font-bold tabular-nums", numClass)}>{value}</p>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-teal/70 focus-visible:ring-offset-1 focus-visible:ring-offset-civic-surface"
      >
        {content}
      </Link>
    );
  }

  return content;
}

// ─── Attention rail ───────────────────────────────────────────────────────────
// Shown when the workspace has data and there are security events that need
// attention. Surfaces the single highest-priority situation with a direct CTA.
// Not shown on empty workspaces — the get-started guide handles that state.
function AttentionRail({
  criticalCount,
  activeIncCount,
}: {
  criticalCount: number;
  activeIncCount: number;
}) {
  if (criticalCount > 0) {
    return (
      <div className="rounded-lg border border-civic-rose/25 bg-civic-rose/5 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3 sm:items-center">
            <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-civic-rose sm:mt-0" />
            <p className="text-sm text-white">
              <span className="font-semibold text-civic-rose">
                {criticalCount} critical {criticalCount === 1 ? "risk" : "risks"} detected.
              </span>{" "}
              <span className="text-civic-muted">
                Review and assess {criticalCount === 1 ? "it" : "each one"} before{" "}
                {criticalCount === 1 ? "it escalates" : "they escalate"}.
              </span>
            </p>
          </div>
          <Link
            to="/risk-events"
            className="shrink-0 text-sm font-semibold text-civic-rose transition-colors hover:text-[#f5838e]"
          >
            Review now →
          </Link>
        </div>
      </div>
    );
  }

  if (activeIncCount > 0) {
    return (
      <div className="rounded-lg border border-civic-amber/25 bg-civic-amber/5 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3 sm:items-center">
            <ClipboardList aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-civic-amber sm:mt-0" />
            <p className="text-sm text-white">
              <span className="font-semibold text-civic-amber">
                {activeIncCount} active {activeIncCount === 1 ? "incident" : "incidents"} in progress.
              </span>{" "}
              <span className="text-civic-muted">
                Track the response and update the status as you work through{" "}
                {activeIncCount === 1 ? "it" : "each one"}.
              </span>
            </p>
          </div>
          <Link
            to="/incidents"
            className="shrink-0 text-sm font-semibold text-civic-amber transition-colors hover:text-[#f8c978]"
          >
            Track progress →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const assets          = useApiList<Asset>("/api/assets/");
  const riskEvents      = useApiList<RiskEvent>("/api/risk-events/");
  const incidents       = useApiList<Incident>("/api/incidents/");
  const jobs            = useApiList<ProcessingJob>("/api/processing-jobs/");
  const recommendations = useApiList<ActionRecommendation>("/api/recommendations/");

  const isLoading = [assets, riskEvents, incidents, jobs, recommendations].some((s) => s.isLoading);
  const error     = [assets, riskEvents, incidents, jobs, recommendations].find((s) => s.error)?.error;

  if (isLoading) return <LoadingState label="Loading overview" />;
  if (error)     return <ErrorState message={error} />;

  // Derived counts
  const openRisks      = riskEvents.data.filter((e) => ["new", "triaged", "investigating"].includes(e.status));
  const criticalRisks  = riskEvents.data.filter((e) => ["high", "critical"].includes(e.severity));
  const activeInc      = incidents.data.filter((i) => ["open", "investigating", "contained"].includes(i.status));
  const pendingActions = recommendations.data.filter((r) => ["open", "in_progress"].includes(r.status));

  const recentRiskEvents = riskEvents.data.slice(0, 5);
  const recentIncidents  = incidents.data.slice(0, 5);

  // Empty workspace: show onboarding steps instead of empty tables
  const isEmpty = assets.data.length === 0 && riskEvents.data.length === 0;

  return (
    <div className="space-y-6">
      {/* ── Stat summary ─────────────────────────────────────────────────── */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Assets"           value={assets.data.length}    to="/assets"          />
        <StatCard label="Open Risks"       value={openRisks.length}      to="/risk-events"     tone="active" />
        <StatCard label="Critical"         value={criticalRisks.length}  to="/risk-events"     tone="hot"    />
        <StatCard label="Active Incidents" value={activeInc.length}      to="/incidents"       tone="active" />
        <StatCard label="Pending Actions"  value={pendingActions.length}                       tone="active" />
        <StatCard label="Data Jobs"        value={jobs.data.length}      to="/processing-jobs" />
      </section>

      {/* ── Get started (empty workspace only) ───────────────────────────── */}
      {isEmpty && (
        <Card>
          <CardHeader
            title="Get started"
            description="Set up your workspace to begin monitoring security risks across your organisation."
          />
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  step: "Step 1",
                  label: "Add an asset",
                  desc: "Register a system, domain, or service you want to monitor for threats.",
                  to: "/assets/new",
                },
                {
                  step: "Step 2",
                  label: "Check for known threats",
                  desc: "ThreatBoard scans your assets against current vulnerability and threat databases.",
                  to: "/modules/threatboard",
                },
                {
                  step: "Step 3",
                  label: "Analyse your logs",
                  desc: "Upload authentication or access logs to LogLens to surface unusual activity.",
                  to: "/modules/loglens",
                },
              ] as const
            ).map((action) => (
              <Link key={action.label} to={action.to}>
                <div className="group rounded-lg border border-civic-line bg-[#14181d] p-4 transition-colors hover:border-civic-teal/40 hover:bg-civic-teal/5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-civic-teal">
                    {action.step}
                  </span>
                  <p className="mt-1.5 text-sm font-medium text-white transition-colors group-hover:text-civic-teal">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-civic-muted">{action.desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Attention rail (active workspace with urgent items) ───────────── */}
      {!isEmpty && (criticalRisks.length > 0 || activeInc.length > 0) && (
        <AttentionRail criticalCount={criticalRisks.length} activeIncCount={activeInc.length} />
      )}

      {/* ── Recent data tables ───────────────────────────────────────────── */}
      <section aria-label="Recent activity" className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent Risk Events"
            action={
              <Link
                to="/risk-events"
                className="shrink-0 text-xs font-medium text-civic-muted transition-colors hover:text-civic-teal"
              >
                View all →
              </Link>
            }
          />
          <CardContent>
            {recentRiskEvents.length ? (
              <DataTable
                columns={[
                  {
                    key: "title",
                    header: "Event",
                    cell: (event) => (
                      <Link
                        className="font-medium text-white hover:text-civic-teal"
                        to={`/risk-events/${event.id}`}
                      >
                        {event.title}
                      </Link>
                    ),
                  },
                  {
                    key: "severity",
                    header: "Severity",
                    cell: (event) => <SeverityBadge severity={event.severity} />,
                  },
                  {
                    key: "status",
                    header: "Status",
                    cell: (event) => <StatusBadge status={event.status} />,
                  },
                  {
                    key: "updated",
                    header: "Updated",
                    cell: (event) => formatDateTime(event.updated_at),
                    className: "whitespace-nowrap",
                  },
                ]}
                data={recentRiskEvents}
                getRowKey={(event) => event.id}
              />
            ) : (
              <EmptyState
                title="No risk events yet"
                description="Risk events are created automatically when modules detect a threat, vulnerability, or anomaly across your assets."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Recent Incidents"
            action={
              <Link
                to="/incidents"
                className="shrink-0 text-xs font-medium text-civic-muted transition-colors hover:text-civic-teal"
              >
                View all →
              </Link>
            }
          />
          <CardContent>
            {recentIncidents.length ? (
              <DataTable
                columns={[
                  {
                    key: "title",
                    header: "Incident",
                    cell: (incident) => (
                      <Link
                        className="font-medium text-white hover:text-civic-teal"
                        to={`/incidents/${incident.id}`}
                      >
                        {incident.title}
                      </Link>
                    ),
                  },
                  {
                    key: "type",
                    header: "Type",
                    cell: (incident) => formatLabel(incident.incident_type),
                  },
                  {
                    key: "status",
                    header: "Status",
                    cell: (incident) => <StatusBadge status={incident.status} />,
                  },
                  {
                    key: "opened",
                    header: "Opened",
                    cell: (incident) => formatDateTime(incident.opened_at),
                    className: "whitespace-nowrap",
                  },
                ]}
                data={recentIncidents}
                getRowKey={(incident) => incident.id}
              />
            ) : (
              <EmptyState
                title="No incidents yet"
                description="When you investigate a risk event or identify a security issue, create an incident to track the full response timeline."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
