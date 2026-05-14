import { Outlet, useLocation } from "react-router-dom";

import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/assets": "Assets",
  "/assets/new": "New Asset",
  "/risk-events": "Risk Events",
  "/incidents": "Incidents",
  "/processing-jobs": "Processing Jobs",
  "/modules/threatboard": "ThreatBoard",
  "/modules/loglens": "LogLens",
  "/modules/privacy-doctor": "DataPrivacy Doctor",
  "/modules/misinformation-observatory": "Misinformation Observatory",
  "/modules/risk-graph": "Civic Risk Graph",
  "/modules/incidentflow": "IncidentFlow",
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }
  if (pathname.startsWith("/assets/")) {
    return "Asset Detail";
  }
  if (pathname.startsWith("/risk-events/")) {
    return "Risk Event Detail";
  }
  if (pathname.startsWith("/incidents/")) {
    return "Incident Detail";
  }
  return "Overview";
}

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-civic-surface text-civic-text">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <MobileNav />
          <Topbar title={getTitle(location.pathname)} />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
