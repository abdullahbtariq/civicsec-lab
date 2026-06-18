import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { LoadingState } from "../ui/LoadingState";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

import { MODULE_ACCENT_COLORS } from "../../lib/modules";

/** Maps module route prefixes to their design-system accent colour. */
const moduleColors = MODULE_ACCENT_COLORS;

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
    <div className="min-h-screen bg-paper text-ink">
      {/* Skip link — visually hidden until focused by keyboard */}
      <a
        href="#app-main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[200] focus-visible:rounded-lg focus-visible:bg-paper-card focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-ink focus-visible:shadow-panel focus-visible:ring-2 focus-visible:ring-orange"
      >
        Skip to main content
      </a>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-paper app-dot-grid">
          <MobileNav />
          <Topbar
            title={getTitle(location.pathname)}
            moduleColor={getModuleColor(location.pathname)}
          />
          <main id="app-main" className="mx-auto w-full max-w-[1640px] flex-1 px-5 py-7 lg:px-10">
            {/* Suspense catches lazy-loaded route chunks; the keyed div
                replays the fade animation on every navigation. */}
            <Suspense fallback={<LoadingState />}>
              <div key={location.pathname} className="app-page-fade">
                <Outlet />
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
