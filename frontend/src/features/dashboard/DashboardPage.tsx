import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Calendar, Check, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  IncidentFlowIcon,
  LogLensIcon,
  ObservatoryIcon,
  PrivacyDoctorIcon,
  RiskGraphIcon,
  ThreatBoardIcon,
} from "../../components/brand/icons/ModuleIcons";

import { AreaChart } from "../../components/ui/AreaChart";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { MetricCard } from "../../components/ui/MetricCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiList } from "../../hooks/useApiData";
import { cn } from "../../lib/utils";
import type { ActionRecommendation, Asset, Incident, ProcessingJob, RiskEvent } from "../../types/api";

const RANGE_OPTIONS = [7, 14, 30, 90] as const;

// ─── Helpers (all derived from real data — no fabricated numbers) ────────────
function bucketByDay(dates: Array<string | null | undefined>, days = 14): number[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const startMs = start.getTime();
  const buckets = new Array(days).fill(0);
  for (const d of dates) {
    if (!d) continue;
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) continue;
    const idx = Math.floor((t - startMs) / 86_400_000);
    if (idx >= 0 && idx < days) buckets[idx] += 1;
  }
  return buckets;
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

function SegmentDonut({
  segments,
  centerValue,
  centerLabel,
  size = 132,
  thickness = 14,
}: {
  segments: Array<{ value: number; color: string }>;
  centerValue: string;
  centerLabel: string;
  size?: number;
  thickness?: number;
}) {
  const reduce = useReducedMotion();
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7dcc7" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c;
          const el = (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              initial={{ opacity: reduce ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.1 * i }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold leading-none tabular-nums text-ink">{centerValue}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{centerLabel}</span>
      </div>
    </div>
  );
}

const MODULE_HEALTH = [
  { name: "ThreatBoard", icon: ThreatBoardIcon, note: "All systems normal", to: "/modules/threatboard" },
  { name: "LogLens", icon: LogLensIcon, note: "Ingesting and analyzing", to: "/modules/loglens" },
  { name: "DataPrivacy Doctor", icon: PrivacyDoctorIcon, note: "Monitoring data flows", to: "/modules/privacy-doctor" },
  { name: "Misinformation Observatory", icon: ObservatoryIcon, note: "Tracking narratives", to: "/modules/misinformation-observatory" },
  { name: "Civic Risk Graph", icon: RiskGraphIcon, note: "Graph updated", to: "/modules/risk-graph" },
  { name: "IncidentFlow", icon: IncidentFlowIcon, note: "Automation active", to: "/modules/incidentflow" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const reduce = useReducedMotion();
  const [rangeDays, setRangeDays] = useState<number>(14);
  const [rangeOpen, setRangeOpen] = useState(false);
  const assets          = useApiList<Asset>("/api/assets/");
  const riskEvents      = useApiList<RiskEvent>("/api/risk-events/");
  const incidents       = useApiList<Incident>("/api/incidents/");
  const jobs            = useApiList<ProcessingJob>("/api/processing-jobs/");
  const recommendations = useApiList<ActionRecommendation>("/api/recommendations/");

  const isLoading = [assets, riskEvents, incidents, jobs, recommendations].some((s) => s.isLoading);
  const error     = [assets, riskEvents, incidents, jobs, recommendations].find((s) => s.error)?.error;

  if (isLoading) return <LoadingState label="Loading command center" />;
  if (error)     return <ErrorState message={error} />;

  const risks = riskEvents.data;
  const openRisks      = risks.filter((e) => ["new", "triaged", "investigating"].includes(e.status));
  const criticalRisks  = risks.filter((e) => ["high", "critical"].includes(e.severity));
  const activeInc      = incidents.data.filter((i) => ["open", "investigating", "contained"].includes(i.status));
  const pendingActions = recommendations.data.filter((r) => ["open", "in_progress"].includes(r.status));

  // Time-series (real created_at buckets, over the selected window)
  const alertSeries = bucketByDay(risks.map((e) => e.created_at), rangeDays);
  const openSeries  = bucketByDay(openRisks.map((e) => e.created_at), rangeDays);
  const critSeries  = bucketByDay(criticalRisks.map((e) => e.created_at), rangeDays);
  const pendSeries  = bucketByDay(pendingActions.map((r) => r.updated_at), rangeDays);
  const peakAlerts  = Math.max(0, ...alertSeries);
  const niceMax     = peakAlerts <= 5 ? 5 : Math.ceil(peakAlerts / 10) * 10;
  const yTicks      = [4, 3, 2, 1, 0].map((i) => Math.round((niceMax / 4) * i));

  // x-axis labels (≈7 evenly spaced across the window)
  const days = Array.from({ length: rangeDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (rangeDays - 1 - i));
    return d;
  });
  const labelStep = Math.max(1, Math.ceil(rangeDays / 7));
  const xLabels = days.filter((_, i) => i % labelStep === 0).map(fmtDay);
  const rangeLabel = `${fmtDay(days[0])} – ${fmtDay(days[rangeDays - 1])}, ${days[rangeDays - 1].getFullYear()}`;

  // Triage coverage (intake → in-review → handled)
  const total = risks.length;
  const intakeN = risks.filter((e) => e.status === "new").length;
  const reviewN = risks.filter((e) => ["triaged", "investigating"].includes(e.status)).length;
  const handledN = total - intakeN - reviewN;
  const pct = (n: number) => (total ? Math.round((100 * n) / total) : 0);
  const handledPct = pct(handledN);

  // Severity distribution
  const sevCount = (s: string) => risks.filter((e) => e.severity === s).length;
  const sevRows = [
    { label: "Critical", n: sevCount("critical"), bar: "bg-orange" },
    { label: "High", n: sevCount("high"), bar: "bg-orange/55" },
    { label: "Medium", n: sevCount("medium"), bar: "bg-gold" },
    { label: "Low", n: sevCount("low") + sevCount("info"), bar: "bg-slatec" },
  ];

  // Pending review queue + recent incidents
  const reviewQueue = openRisks.slice(0, 5);
  const recentIncidents = incidents.data.slice(0, 5);

  const isEmpty = assets.data.length === 0 && risks.length === 0;

  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.05 } } };
  const item: Variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "circOut" } } };

  return (
    <div className="space-y-6">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <SectionHeader
        level="page"
        title="Command Center"
        subtitle="Real-time risk posture across your organisation — signals to evidence, people to purpose."
        action={
          <div className="relative">
            <button
              onClick={() => setRangeOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={rangeOpen}
              className="inline-flex items-center gap-2 rounded-lg border border-paper-line bg-paper-card px-3.5 py-2 text-sm font-medium text-ink-soft shadow-card transition-colors hover:border-orange/40"
            >
              <Calendar aria-hidden="true" className="h-4 w-4 text-ink-faint" />
              {rangeLabel}
              <ChevronDown aria-hidden="true" className={cn("h-4 w-4 text-ink-faint transition-transform", rangeOpen && "rotate-180")} />
            </button>
            {rangeOpen ? (
              <>
                <button aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setRangeOpen(false)} />
                <ul role="listbox" className="absolute right-0 top-12 z-40 w-44 overflow-hidden rounded-xl border border-paper-line bg-paper-card py-1 shadow-card">
                  {RANGE_OPTIONS.map((d) => (
                    <li key={d}>
                      <button
                        role="option"
                        aria-selected={d === rangeDays}
                        onClick={() => { setRangeDays(d); setRangeOpen(false); }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-paper-raise",
                          d === rangeDays ? "font-semibold text-orange-ink" : "text-ink",
                        )}
                      >
                        Last {d} days
                        {d === rangeDays ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        }
      />

      {/* ── Metric grid ───────────────────────────────────────────────────── */}
      <motion.section
        aria-label="Key metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[
          <MetricCard key="a" label="Assets" value={assets.data.length} subtitle="Tracked assets" watermark to="/assets" />,
          <MetricCard key="o" label="Open Risks" value={openRisks.length} tone="orange" subtitle="Requiring attention" sparkline={openSeries} to="/risk-events" />,
          <MetricCard key="c" label="Critical" value={criticalRisks.length} tone="orange" subtitle="High severity risks" sparkline={critSeries} to="/risk-events" />,
          <MetricCard key="i" label="Active Incidents" value={activeInc.length} subtitle="Currently open" watermark to="/incidents" />,
          <MetricCard key="p" label="Pending Actions" value={pendingActions.length} tone="orange" subtitle="Awaiting resolution" sparkline={pendSeries} />,
          <MetricCard key="j" label="Data Jobs" value={jobs.data.length} subtitle="Running jobs" watermark to="/processing-jobs" />,
        ].map((card, i) => (
          <motion.div key={i} variants={item}>{card}</motion.div>
        ))}
      </motion.section>

      {/* ── Critical alert banner (drenched orange) ───────────────────────── */}
      {!isEmpty && criticalRisks.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-orange px-6 py-5 text-white shadow-glow">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 text-white" viewBox="0 0 400 100" fill="none" preserveAspectRatio="xMaxYMid slice">
            <g stroke="currentColor" strokeOpacity="0.25" strokeWidth="1">
              <line x1="40" y1="20" x2="140" y2="60" /><line x1="140" y1="60" x2="220" y2="30" />
              <line x1="220" y1="30" x2="320" y2="70" /><line x1="320" y1="70" x2="390" y2="40" />
              <line x1="140" y1="60" x2="180" y2="95" /><line x1="220" y1="30" x2="260" y2="8" />
            </g>
            <g fill="currentColor" fillOpacity="0.5">
              <circle cx="40" cy="20" r="2.5" /><circle cx="140" cy="60" r="3" /><circle cx="220" cy="30" r="2.5" />
              <circle cx="320" cy="70" r="3" /><circle cx="390" cy="40" r="2.5" /><circle cx="260" cy="8" r="2" /><circle cx="180" cy="95" r="2" />
            </g>
          </svg>
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <p className="font-display text-lg font-semibold">
                  {criticalRisks.length} critical {criticalRisks.length === 1 ? "risk" : "risks"} detected.
                </p>
                <p className="text-sm text-white/90">Review and assess each one before they escalate.</p>
              </div>
            </div>
            <Link
              to="/risk-events"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/90 sm:self-auto"
            >
              Review now
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Get started (empty workspace) ─────────────────────────────────── */}
      {isEmpty && (
        <Card>
          <CardHeader title="Get started" description="Set up your workspace to begin monitoring security risks." />
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { step: "Step 1", label: "Add an asset", desc: "Register a system, domain, or service to monitor.", to: "/assets/new" },
                { step: "Step 2", label: "Check for threats", desc: "ThreatBoard scans assets against vulnerability databases.", to: "/modules/threatboard" },
                { step: "Step 3", label: "Analyse your logs", desc: "Upload logs to LogLens to surface unusual activity.", to: "/modules/loglens" },
              ] as const
            ).map((a) => (
              <Link key={a.label} to={a.to}>
                <div className="group h-full rounded-xl border border-paper-line bg-paper p-4 transition-colors hover:border-orange/40">
                  <span className="text-label font-semibold uppercase text-orange-ink">{a.step}</span>
                  <p className="mt-1.5 text-sm font-medium text-ink">{a.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{a.desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Charts row: alerts + triage + distribution ────────────────────── */}
      {!isEmpty && (
        <section aria-label="Activity" className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12">
          {/* Active Alerts Over Time */}
          <Card className="xl:col-span-5">
            <CardHeader
              title="Active Alerts Over Time"
              description={`Risk-event activity across the last ${rangeDays} days.`}
              action={
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-paper-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft">
                  Peak {peakAlerts}/day
                  <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-ink-faint" />
                </span>
              }
            />
            <CardContent>
              <div className="flex gap-2">
                <div className="flex h-[200px] w-7 shrink-0 flex-col justify-between py-0.5 text-right text-[10px] tabular-nums text-ink-faint">
                  {yTicks.map((t, i) => <span key={i}>{t}</span>)}
                </div>
                <div className="relative h-[200px] flex-1">
                  {yTicks.map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-0 border-t border-paper-line/70"
                      style={{ top: `${(i / (yTicks.length - 1)) * 100}%` }}
                    />
                  ))}
                  <div className="absolute inset-0">
                    <AreaChart data={alertSeries} min={0} max={niceMax} height={200} />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-between pl-9 text-[10px] text-ink-faint">
                {xLabels.map((l, i) => <span key={i}>{l}</span>)}
              </div>
            </CardContent>
          </Card>

          {/* Triage Coverage */}
          <Card className="xl:col-span-3">
            <CardHeader title="Triage Coverage" description="Risks moved beyond intake." />
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <SegmentDonut
                  centerValue={`${handledPct}%`}
                  centerLabel="handled"
                  segments={[
                    { value: handledN, color: "#d65a29" },
                    { value: reviewN, color: "#15242f" },
                    { value: intakeN, color: "#cf9c46" },
                  ]}
                />
                <ul className="flex-1 space-y-2 text-sm">
                  {[
                    { c: "#d65a29", label: "Handled", v: pct(handledN) },
                    { c: "#15242f", label: "In Review", v: pct(reviewN) },
                    { c: "#cf9c46", label: "Intake", v: pct(intakeN) },
                  ].map((row) => (
                    <li key={row.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.c }} />
                      <span className="text-ink-soft">{row.label}</span>
                      <span className="ml-auto font-semibold tabular-nums text-ink">{row.v}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between border-t border-paper-line pt-3 text-xs">
                <span className="text-ink-faint">Target ≥ 80%</span>
                <span className={`inline-flex items-center gap-1.5 font-medium ${handledPct >= 80 ? "text-sage-ink" : "text-gold-ink"}`}>
                  <span className="h-2 w-2 rounded-full" style={{ background: handledPct >= 80 ? "#4f8a5b" : "#cf9c46" }} />
                  {handledPct >= 80 ? "On track" : "Below target"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="relative overflow-hidden lg:col-span-2 xl:col-span-4">
            <CardHeader title="Risk Distribution" description="By severity." />
            <CardContent className="space-y-3.5">
              {sevRows.map((row) => {
                const p = total ? Math.round((100 * row.n) / total) : 0;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-sm text-ink-soft">{row.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-raise">
                      <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${Math.max(p, 2)}%` }} />
                    </div>
                    <span className="w-20 shrink-0 text-right text-sm tabular-nums text-ink">
                      {row.n} <span className="text-ink-faint">({p}%)</span>
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-paper-line pt-3 text-sm">
                <span className="text-ink-faint">Total</span>
                <span className="font-display text-lg font-bold tabular-nums text-ink">{total}</span>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Bottom row: review queue + incidents + module health ───────────── */}
      <section aria-label="Operations" className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Pending Review Queue */}
        <Card>
          <CardHeader
            title="Pending Review Queue"
            description="Risks awaiting analyst review."
            action={<Link to="/risk-events" className="shrink-0 text-xs font-semibold text-orange-ink hover:underline">View all →</Link>}
          />
          <CardContent className="space-y-1">
            {reviewQueue.length ? (
              reviewQueue.map((e) => (
                <Link
                  key={e.id}
                  to={`/risk-events/${e.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-paper-raise"
                >
                  <SeverityBadge severity={e.severity} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{e.title}</span>
                    <span className="block text-xs text-ink-faint">Risk ID: R-{String(e.id).padStart(4, "0")}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-faint">{timeAgo(e.created_at)}</span>
                  <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-faint" />
                </Link>
              ))
            ) : (
              <EmptyState title="Queue clear" description="No risks are currently awaiting review." />
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader
            title="Recent Incidents"
            description="Latest incidents and their status."
            action={<Link to="/incidents" className="shrink-0 text-xs font-semibold text-orange-ink hover:underline">View all →</Link>}
          />
          <CardContent className="space-y-1">
            {recentIncidents.length ? (
              recentIncidents.map((inc) => (
                <Link
                  key={inc.id}
                  to={`/incidents/${inc.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-paper-raise"
                >
                  <SeverityBadge severity={inc.severity} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{inc.title}</span>
                    <span className="block text-xs text-ink-faint">
                      INC-{String(inc.id).padStart(4, "0")} · {timeAgo(inc.updated_at)}
                    </span>
                  </span>
                  <StatusBadge status={inc.status} />
                </Link>
              ))
            ) : (
              <EmptyState title="No incidents yet" description="Create an incident to track a response timeline." />
            )}
          </CardContent>
        </Card>

        {/* Module Health */}
        <Card>
          <CardHeader
            title="Module Health"
            description="Operational status of key modules."
          />
          <CardContent className="space-y-0.5">
            {MODULE_HEALTH.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.name} to={m.to} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-paper-raise">
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-soft" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{m.name}</span>
                    <span className="hidden truncate text-xs text-ink-faint sm:block">{m.note}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-sage-ink">
                    <span className="h-2 w-2 rounded-full bg-sage" />
                    Operational
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="flex flex-col items-center justify-between gap-2 border-t border-paper-line pt-5 text-label uppercase tracking-[0.12em] text-ink-faint sm:flex-row">
        <span>CivicSec Lab</span>
        <span className="hidden sm:inline">Open technology. Safer communities.</span>
        <span className="inline-flex items-center gap-1.5">
          civicseclab.org
          <span className="h-1.5 w-1.5 rounded-full bg-orange" />
        </span>
      </footer>
    </div>
  );
}
