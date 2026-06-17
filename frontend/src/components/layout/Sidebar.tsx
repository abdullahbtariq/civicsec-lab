import { AlertTriangle, Boxes, ChevronRight, ClipboardList, HardDrive, Home } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { NavLink } from "react-router-dom";

import { Logo } from "../brand/Logo";
import {
  IncidentFlowIcon,
  LogLensIcon,
  ObservatoryIcon,
  PrivacyDoctorIcon,
  RiskGraphIcon,
  ThreatBoardIcon,
} from "../brand/icons/ModuleIcons";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  label: string;
  to: string;
  icon: IconType;
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
  { label: "ThreatBoard",                to: "/modules/threatboard",                icon: ThreatBoardIcon,   color: "#d99a3c" },
  { label: "LogLens",                    to: "/modules/loglens",                    icon: LogLensIcon,       color: "#8fa7b0" },
  { label: "DataPrivacy Doctor",         to: "/modules/privacy-doctor",             icon: PrivacyDoctorIcon, color: "#71a7ff" },
  { label: "Misinformation Observatory", to: "/modules/misinformation-observatory", icon: ObservatoryIcon,   color: "#e2703f" },
  { label: "Civic Risk Graph",           to: "/modules/risk-graph",                 icon: RiskGraphIcon,     color: "#5f8c6e" },
  { label: "IncidentFlow",               to: "/modules/incidentflow",               icon: IncidentFlowIcon,  color: "#ee6c7a" },
];

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
          isActive
            ? "bg-civic-panel font-semibold text-civic-text shadow-[inset_0_1px_0_rgba(243,234,220,0.05)]"
            : "font-medium text-civic-muted hover:bg-civic-panel/60 hover:text-civic-text",
        )
      }
      to={item.to}
    >
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
            style={{ color: isActive ? "#d65a29" : item.color }}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

/** Faint orbital/radar brand pattern behind the lower sidebar. */
function SidebarWatermark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -bottom-6 -left-10 h-64 w-64 text-civic-text"
      fill="none"
    >
      <circle cx="70" cy="130" r="80" stroke="currentColor" strokeOpacity="0.06" />
      <circle cx="70" cy="130" r="55" stroke="currentColor" strokeOpacity="0.07" />
      <circle cx="70" cy="130" r="30" stroke="currentColor" strokeOpacity="0.08" />
      <circle cx="70" cy="130" r="4" fill="#d65a29" fillOpacity="0.7" />
      <circle cx="120" cy="92" r="2" fill="#d65a29" fillOpacity="0.5" />
      <circle cx="38" cy="86" r="1.6" fill="#f3eadc" fillOpacity="0.4" />
      <circle cx="150" cy="150" r="1.6" fill="#f3eadc" fillOpacity="0.35" />
    </svg>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();

  const displayName = user?.full_name || user?.email || "";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  const role = user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : "";

  return (
    <aside className="relative hidden min-h-screen w-[264px] shrink-0 overflow-hidden border-r border-civic-line bg-civic-surface lg:sticky lg:top-0 lg:flex lg:flex-col">
      <SidebarWatermark />

      {/* Brand */}
      <div className="relative z-10 px-5 py-5">
        <Logo markSize={40} subtitle={user?.organisation?.name || "Open Civic Aid"} />
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="relative z-10 flex-1 space-y-6 overflow-y-auto px-3.5 py-2">
        <section>
          <p className="mb-2 px-3 text-label font-semibold uppercase text-civic-muted/60">Workspace</p>
          <div className="space-y-0.5">
            {mainItems.map((item) => (
              <SidebarLink item={item} key={item.to} />
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 px-3 text-label font-semibold uppercase text-civic-muted/60">Modules</p>
          <div className="space-y-0.5">
            {moduleItems.map((item) => (
              <SidebarLink item={item} key={item.to} />
            ))}
          </div>
        </section>
      </nav>

      {/* User card */}
      <div className="relative z-10 border-t border-civic-line p-3">
        <button
          onClick={logout}
          title="Sign out"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-civic-panel"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-civic-teal text-sm font-bold text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-civic-text">{displayName || "—"}</span>
            <span className="block truncate text-xs text-civic-muted">{role || "Member"}</span>
          </span>
          <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-civic-muted" />
        </button>
      </div>
    </aside>
  );
}
