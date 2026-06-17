import { Bell, FileSearch, HelpCircle, LogOut, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";

import { useApiList } from "../../hooks/useApiData";
import { useAuth } from "../../hooks/useAuth";
import type { Asset, Incident, RiskEvent } from "../../types/api";
import { SeverityBadge } from "../ui/SeverityBadge";

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type SearchHit = { type: "Risk" | "Incident" | "Asset"; label: string; to: string; sev?: string };

const METRIC_DEFS: { term: string; def: string }[] = [
  { term: "Open Risks", def: "Risk events with status new, triaged, or investigating — not yet resolved." },
  { term: "Critical", def: "Risk events at high or critical severity, regardless of status." },
  { term: "Active Incidents", def: "Incidents that are open, investigating, or contained." },
  { term: "Pending Actions", def: "Recommended actions still open or in progress." },
  { term: "Triage Coverage", def: "Share of risks moved beyond intake — handled ÷ total. Target ≥ 80%." },
  { term: "Risk Distribution", def: "Count and share of risk events by severity band." },
  { term: "Active Alerts Over Time", def: "Risk events bucketed by creation date across the selected window." },
];

export function Topbar({ title }: { title: string; moduleColor?: string }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const risks = useApiList<RiskEvent>("/api/risk-events/");
  const incidents = useApiList<Incident>("/api/incidents/");
  const assets = useApiList<Asset>("/api/assets/");

  const [open, setOpen] = useState<"search" | "notif" | "help" | null>(null);
  const [q, setQ] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);

  // Notifications: critical + needs-review risks (live data)
  const alerts = useMemo(
    () =>
      risks.data
        .filter((r) => ["high", "critical"].includes(r.severity) || ["new", "triaged"].includes(r.status))
        .slice(0, 8),
    [risks.data],
  );
  const alertCount = alerts.length;

  // Search across risks / incidents / assets
  const hits = useMemo<SearchHit[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 1) return [];
    const out: SearchHit[] = [];
    for (const r of risks.data) if (r.title.toLowerCase().includes(term)) out.push({ type: "Risk", label: r.title, to: `/risk-events/${r.id}`, sev: r.severity });
    for (const i of incidents.data) if (i.title.toLowerCase().includes(term)) out.push({ type: "Incident", label: i.title, to: `/incidents/${i.id}`, sev: i.severity });
    for (const a of assets.data) if (a.name.toLowerCase().includes(term)) out.push({ type: "Asset", label: a.name, to: `/assets/${a.id}` });
    return out.slice(0, 7);
  }, [q, risks.data, incidents.data, assets.data]);

  // `/` focuses search; Esc closes everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen("search");
        searchInput.current?.focus();
      } else if (e.key === "Escape") {
        setOpen(null);
        searchInput.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(to: string) {
    setOpen(null);
    setQ("");
    navigate(to);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-paper-line bg-paper/85 px-5 py-3 backdrop-blur lg:px-10">
      <div className="flex items-center justify-between gap-4">
        <p className="font-display text-base font-semibold text-ink lg:hidden">{title}</p>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              ref={searchInput}
              type="search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpen("search"); }}
              onFocus={() => setOpen("search")}
              onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) go(hits[0].to); }}
              placeholder="Search assets, risks, incidents…"
              aria-label="Search"
              className="h-10 w-72 rounded-lg border border-paper-line bg-paper-card pl-9 pr-9 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-orange/50 focus:ring-2 focus:ring-orange/15 xl:w-80"
            />
            {q ? (
              <button aria-label="Clear search" onClick={() => { setQ(""); searchInput.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-paper-line bg-paper px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">/</kbd>
            )}

            {open === "search" && q.trim().length >= 1 ? (
              <div className="absolute right-0 top-12 z-40 w-[26rem] max-w-[90vw] overflow-hidden rounded-xl border border-paper-line bg-paper-card shadow-card">
                {hits.length ? (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {hits.map((h) => (
                      <li key={`${h.type}-${h.to}`}>
                        <button onClick={() => go(h.to)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-paper-raise">
                          <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{h.type}</span>
                          <span className="min-w-0 flex-1 truncate text-sm text-ink">{h.label}</span>
                          {h.sev ? <SeverityBadge severity={h.sev} /> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-4 text-sm text-ink-soft">No matches for “{q.trim()}”.</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              aria-label={`Notifications (${alertCount})`}
              onClick={() => setOpen(open === "notif" ? null : "notif")}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-paper-line bg-paper-card text-ink-soft transition-colors hover:bg-paper-raise hover:text-ink"
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              {alertCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white ring-2 ring-paper-card">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              ) : null}
            </button>
            {open === "notif" ? (
              <div className="absolute right-0 top-12 z-40 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-paper-line bg-paper-card shadow-card">
                <div className="flex items-center justify-between border-b border-paper-line px-3 py-2.5">
                  <span className="text-sm font-semibold text-ink">Alerts</span>
                  <span className="text-xs text-ink-faint">{alertCount} needing attention</span>
                </div>
                {alerts.length ? (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {alerts.map((a) => (
                      <li key={a.id}>
                        <button onClick={() => go(`/risk-events/${a.id}`)} className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-paper-raise">
                          <SeverityBadge severity={a.severity} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ink">{a.title}</span>
                            <span className="block text-xs text-ink-faint">{a.status.replace(/_/g, " ")} · {timeAgo(a.created_at)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-5 text-center text-sm text-ink-soft">You’re all caught up.</p>
                )}
                <Link to="/risk-events" onClick={() => setOpen(null)} className="block border-t border-paper-line px-3 py-2.5 text-center text-xs font-semibold text-orange-ink hover:bg-paper-raise">
                  View all risk events →
                </Link>
              </div>
            ) : null}
          </div>

          {/* Help */}
          <button
            aria-label="Help"
            onClick={() => setOpen("help")}
            className="hidden h-10 w-10 items-center justify-center rounded-lg border border-paper-line bg-paper-card text-ink-soft transition-colors hover:bg-paper-raise hover:text-ink sm:flex"
          >
            <HelpCircle aria-hidden="true" className="h-5 w-5" />
          </button>

          {/* Mobile sign-out */}
          <button aria-label="Sign out" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-paper-raise hover:text-ink lg:hidden" onClick={logout}>
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Click-away backdrop for the dropdowns — portalled so `fixed` escapes the blurred header */}
      {(open === "search" || open === "notif")
        ? createPortal(
            <button aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(null)} />,
            document.body,
          )
        : null}

      {/* Help dialog — portalled to body (the header's backdrop-blur would otherwise trap `fixed`) */}
      {open === "help"
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-[12vh]" onClick={() => setOpen(null)} role="presentation">
          <div role="dialog" aria-modal="true" aria-label="Metric definitions" className="w-full max-w-lg rounded-xl border border-paper-line bg-paper-card shadow-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5">
              <div className="flex items-center gap-2">
                <FileSearch aria-hidden="true" className="h-4 w-4 text-orange" />
                <h2 className="font-display text-base font-semibold text-ink">What the metrics mean</h2>
              </div>
              <button aria-label="Close" onClick={() => setOpen(null)} className="rounded-md p-1 text-ink-soft hover:bg-paper-raise hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="max-h-[60vh] divide-y divide-paper-line overflow-y-auto px-5">
              {METRIC_DEFS.map((m) => (
                <div key={m.term} className="py-3">
                  <dt className="text-sm font-semibold text-ink">{m.term}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-ink-soft">{m.def}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-paper-line px-5 py-3 text-xs text-ink-faint">
              All figures are decision-support signals and require human review.
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </header>
  );
}
