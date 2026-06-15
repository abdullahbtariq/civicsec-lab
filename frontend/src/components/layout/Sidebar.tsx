import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  DatabaseZap,
  FileSearch,
  GitFork,
  HardDrive,
  Home,
  LogOut,
  type LucideIcon,
  Network,
  Radar,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { cn, formatLabel } from "../../lib/utils";
import { Badge } from "../ui/Badge";

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Module accent colour — applies to icon when inactive. Undefined for workspace items. */
  color?: string;
};

export const mainItems: NavItem[] = [
  { label: "Overview",    to: "/dashboard",       icon: Home          },
  { label: "Assets",      to: "/assets",          icon: Boxes         },
  { label: "Risk Events", to: "/risk-events",     icon: AlertTriangle },
  { label: "Incidents",   to: "/incidents",       icon: ClipboardList },
  { label: "Data Jobs",   to: "/processing-jobs", icon: HardDrive     },
];

export const moduleItems: NavItem[] = [
  { label: "ThreatBoard",                to: "/modules/threatboard",                icon: ShieldAlert, color: "#c4821a" },
  { label: "LogLens",                    to: "/modules/loglens",                    icon: Radar,       color: "#7a5a9a" },
  { label: "DataPrivacy Doctor",         to: "/modules/privacy-doctor",             icon: DatabaseZap, color: "#2a7e9a" },
  { label: "Misinformation Observatory", to: "/modules/misinformation-observatory", icon: FileSearch,  color: "#9a7a2a" },
  { label: "Civic Risk Graph",           to: "/modules/risk-graph",                 icon: GitFork,     color: "#2a9e82" },
  { label: "IncidentFlow",               to: "/modules/incidentflow",               icon: Network,     color: "#b05040" },
];

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-civic-teal/10 text-civic-teal"
            : "text-civic-muted hover:bg-[#20252b] hover:text-white",
        )
      }
      to={item.to}
    >
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
            style={!isActive && item.color ? { color: item.color } : undefined}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();

  const displayName = user?.full_name || user?.email || "";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";
  const orgName = user?.organisation?.name ?? "";

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-civic-line bg-[#111418] lg:sticky lg:top-0 lg:flex lg:flex-col">
      {/* Brand */}
      <div className="border-b border-civic-line px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-civic-teal/40 bg-civic-teal/10">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-civic-teal" />
          </div>
          <div>
            <p className="font-display text-base font-semibold tracking-tight text-white">CivicSec Lab</p>
            <p className="truncate text-xs text-civic-muted">{orgName || "Security platform"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <section>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-civic-muted/60">
            Workspace
          </p>
          <div className="space-y-0.5">
            {mainItems.map((item) => (
              <SidebarLink item={item} key={item.to} />
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-civic-muted/60">
            Modules
          </p>
          <div className="space-y-0.5">
            {moduleItems.map((item) => (
              <SidebarLink item={item} key={item.to} />
            ))}
          </div>
        </section>
      </nav>

      {/* User card */}
      <div className="border-t border-civic-line p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-civic-teal/15 ring-1 ring-civic-teal/30">
            <span className="text-xs font-semibold text-civic-teal">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{displayName || "—"}</p>
            <p className="truncate text-xs text-civic-muted">{orgName || "—"}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="teal">{formatLabel(user?.role ?? "")}</Badge>
          <button
            className="flex items-center gap-1.5 text-xs text-civic-muted transition-colors hover:text-white"
            onClick={logout}
          >
            <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-4">
        <p className="text-xs leading-relaxed text-civic-muted/50">
          For defensive and educational use. All outputs require human review.
        </p>
      </div>
    </aside>
  );
}
