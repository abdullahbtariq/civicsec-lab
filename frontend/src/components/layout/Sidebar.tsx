import {
  AlertTriangle,
  Boxes,
  BriefcaseBusiness,
  ClipboardList,
  DatabaseZap,
  FileSearch,
  GitFork,
  Home,
  LineChart,
  Network,
  Radar,
  ShieldAlert,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "../../lib/utils";

const mainItems = [
  { label: "Overview", to: "/dashboard", icon: Home },
  { label: "Assets", to: "/assets", icon: Boxes },
  { label: "Risk Events", to: "/risk-events", icon: AlertTriangle },
  { label: "Incidents", to: "/incidents", icon: ClipboardList },
  { label: "Processing Jobs", to: "/processing-jobs", icon: BriefcaseBusiness },
];

const moduleItems = [
  { label: "ThreatBoard", to: "/modules/threatboard", icon: ShieldAlert },
  { label: "LogLens", to: "/modules/loglens", icon: Radar },
  { label: "DataPrivacy Doctor", to: "/modules/privacy-doctor", icon: DatabaseZap },
  { label: "Misinformation Observatory", to: "/modules/misinformation-observatory", icon: FileSearch },
  { label: "Civic Risk Graph", to: "/modules/risk-graph", icon: GitFork },
  { label: "IncidentFlow", to: "/modules/incidentflow", icon: Network },
];

function SidebarLink({ item }: { item: (typeof mainItems)[number] }) {
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
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-civic-line bg-[#111418] lg:sticky lg:top-0 lg:flex lg:flex-col">
      <div className="border-b border-civic-line px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-civic-teal/40 bg-civic-teal/10">
            <LineChart aria-hidden="true" className="h-5 w-5 text-civic-teal" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">CivicSec Lab</p>
            <p className="text-xs text-civic-muted">Platform shell</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5" aria-label="Primary">
        <section>
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-civic-muted">Main</p>
          <div className="space-y-1">
            {mainItems.map((item) => (
              <SidebarLink item={item} key={item.to} />
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-civic-muted">Modules</p>
          <div className="space-y-1">
            {moduleItems.map((item) => (
              <SidebarLink item={item} key={item.to} />
            ))}
          </div>
        </section>
      </nav>

      <div className="border-t border-civic-line p-4">
        <p className="text-xs leading-5 text-civic-muted">
          Defensive, educational, and public-interest use. Outputs require human review.
        </p>
      </div>
    </aside>
  );
}

export { mainItems, moduleItems };
