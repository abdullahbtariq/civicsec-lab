import { Outlet, useLocation } from "react-router-dom";

import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Maps module route prefixes to their design-system accent colour. */
const moduleColors: [prefix: string, color: string][] = [
  ["/modules/threatboard",                "#c4821a"],
  ["/modules/loglens",                    "#7a5a9a"],
  ["/modules/privacy-doctor",             "#2a7e9a"],
  ["/modules/misinformation-observatory", "#9a7a2a"],
  ["/modules/risk-graph",                 "#2a9e82"],
  ["/modules/incidentflow",               "#b05040"],
];

function getModuleColor(pathname: string): string | undefined {
  return moduleColors.find(([prefix]) => pathname.startsWith(prefix))?.[1];
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/assets": "Assets",
  "/assets/new": "New Asset",
  "/risk-events": "Risk Events",
  "/incidents": "Incidents",
  "/incidents/new": "New Incident",
  "/processing-jobs": "Data Jobs",
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
  // Workspace
  if (pathname.startsWith("/assets/")) return "Asset Detail";
  if (pathname.startsWith("/risk-events/")) return "Risk Event Detail";
  if (pathname.startsWith("/incidents/")) return "Incident Detail";
  // ThreatBoard sub-pages (most-specific first)
  if (pathname.startsWith("/modules/threatboard/vulnerabilities/")) return "Vulnerability Detail";
  if (pathname.startsWith("/modules/threatboard/vulnerabilities")) return "Vulnerabilities";
  if (pathname.startsWith("/modules/threatboard/matches/")) return "Asset Match Detail";
  if (pathname.startsWith("/modules/threatboard/matches")) return "Asset Matches";
  if (pathname.startsWith("/modules/threatboard/ingestion-runs")) return "Ingestion Runs";
  // LogLens sub-pages
  if (pathname.startsWith("/modules/loglens/anomalies/")) return "Anomaly Detail";
  if (pathname.startsWith("/modules/loglens/anomalies")) return "Anomalies";
  if (pathname.startsWith("/modules/loglens/upload")) return "Upload Logs";
  if (pathname.startsWith("/modules/loglens/")) return "LogLens";
  // DataPrivacy Doctor sub-pages
  if (pathname.startsWith("/modules/privacy-doctor/datasets/")) return "Dataset Detail";
  if (pathname.startsWith("/modules/privacy-doctor/datasets")) return "Datasets";
  if (pathname.startsWith("/modules/privacy-doctor/upload")) return "Upload Dataset";
  if (pathname.startsWith("/modules/privacy-doctor/")) return "DataPrivacy Doctor";
  // Misinformation Observatory sub-pages
  if (pathname.startsWith("/modules/misinformation-observatory/datasets/")) return "Dataset Detail";
  if (pathname.startsWith("/modules/misinformation-observatory/datasets")) return "Datasets";
  if (pathname.startsWith("/modules/misinformation-observatory/clusters/")) return "Cluster Detail";
  if (pathname.startsWith("/modules/misinformation-observatory/clusters")) return "Clusters";
  if (pathname.startsWith("/modules/misinformation-observatory/upload")) return "Upload Dataset";
  if (pathname.startsWith("/modules/misinformation-observatory/")) return "Observatory";
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
          <Topbar
            title={getTitle(location.pathname)}
            moduleColor={getModuleColor(location.pathname)}
          />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
