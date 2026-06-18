import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
// Public pages — kept as direct imports so the first visible route
// never waits on a dynamic chunk.
import { LoginPage } from "../features/auth/LoginPage";
import { AboutPage } from "../features/landing/AboutPage";
import { LandingPage } from "../features/landing/LandingPage";
import { ProtectedRoute } from "./ProtectedRoute";

// ─── Route-level code splitting ──────────────────────────────────────────────
// All authenticated app pages are lazily loaded; each becomes its own JS chunk.
// Suspense + skeleton fallback lives in AppLayout — the sidebar and topbar stay
// stable while individual page chunks load.

// Workspace
const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then(m => ({ default: m.DashboardPage }))
);
const AssetsPage = lazy(() =>
  import("../features/assets/AssetsPage").then(m => ({ default: m.AssetsPage }))
);
const AssetCreatePage = lazy(() =>
  import("../features/assets/AssetCreatePage").then(m => ({ default: m.AssetCreatePage }))
);
const AssetDetailPage = lazy(() =>
  import("../features/assets/AssetDetailPage").then(m => ({ default: m.AssetDetailPage }))
);
const RiskEventsPage = lazy(() =>
  import("../features/risk-events/RiskEventsPage").then(m => ({ default: m.RiskEventsPage }))
);
const RiskEventDetailPage = lazy(() =>
  import("../features/risk-events/RiskEventDetailPage").then(m => ({ default: m.RiskEventDetailPage }))
);
const IncidentsPage = lazy(() =>
  import("../features/incidents/IncidentsPage").then(m => ({ default: m.IncidentsPage }))
);
const CreateIncidentPage = lazy(() =>
  import("../features/incidents/CreateIncidentPage").then(m => ({ default: m.CreateIncidentPage }))
);
const IncidentDetailPage = lazy(() =>
  import("../features/incidents/IncidentDetailPage").then(m => ({ default: m.IncidentDetailPage }))
);
const ProcessingJobsPage = lazy(() =>
  import("../features/processing-jobs/ProcessingJobsPage").then(m => ({ default: m.ProcessingJobsPage }))
);

// ThreatBoard
const ThreatBoardOverviewPage = lazy(() =>
  import("../features/threatboard/ThreatBoardOverviewPage").then(m => ({ default: m.ThreatBoardOverviewPage }))
);
const VulnerabilitiesPage = lazy(() =>
  import("../features/threatboard/VulnerabilitiesPage").then(m => ({ default: m.VulnerabilitiesPage }))
);
const VulnerabilityDetailPage = lazy(() =>
  import("../features/threatboard/VulnerabilityDetailPage").then(m => ({ default: m.VulnerabilityDetailPage }))
);
const AssetMatchesPage = lazy(() =>
  import("../features/threatboard/AssetMatchesPage").then(m => ({ default: m.AssetMatchesPage }))
);
const AssetMatchDetailPage = lazy(() =>
  import("../features/threatboard/AssetMatchDetailPage").then(m => ({ default: m.AssetMatchDetailPage }))
);
const IngestionRunsPage = lazy(() =>
  import("../features/threatboard/IngestionRunsPage").then(m => ({ default: m.IngestionRunsPage }))
);

// LogLens
const LogLensOverviewPage = lazy(() =>
  import("../features/loglens/LogLensOverviewPage").then(m => ({ default: m.LogLensOverviewPage }))
);
const AnomaliesPage = lazy(() =>
  import("../features/loglens/AnomaliesPage").then(m => ({ default: m.AnomaliesPage }))
);
const AnomalyDetailPage = lazy(() =>
  import("../features/loglens/AnomalyDetailPage").then(m => ({ default: m.AnomalyDetailPage }))
);
const UploadLogsPage = lazy(() =>
  import("../features/loglens/UploadLogsPage").then(m => ({ default: m.UploadLogsPage }))
);

// DataPrivacy Doctor
const PrivacyDoctorOverviewPage = lazy(() =>
  import("../features/privacy-doctor/PrivacyDoctorOverviewPage").then(m => ({ default: m.PrivacyDoctorOverviewPage }))
);
const DatasetListPage = lazy(() =>
  import("../features/privacy-doctor/DatasetListPage").then(m => ({ default: m.DatasetListPage }))
);
const DatasetDetailPage = lazy(() =>
  import("../features/privacy-doctor/DatasetDetailPage").then(m => ({ default: m.DatasetDetailPage }))
);
const UploadDatasetPage = lazy(() =>
  import("../features/privacy-doctor/UploadDatasetPage").then(m => ({ default: m.UploadDatasetPage }))
);

// Misinformation Observatory (aliased to avoid name collisions with Privacy Doctor)
const ObservatoryOverviewPage = lazy(() =>
  import("../features/misinformation/ObservatoryOverviewPage").then(m => ({ default: m.ObservatoryOverviewPage }))
);
const MisDatasetListPage = lazy(() =>
  import("../features/misinformation/DatasetListPage").then(m => ({ default: m.DatasetListPage }))
);
const MisDatasetDetailPage = lazy(() =>
  import("../features/misinformation/DatasetDetailPage").then(m => ({ default: m.DatasetDetailPage }))
);
const MisUploadDatasetPage = lazy(() =>
  import("../features/misinformation/UploadDatasetPage").then(m => ({ default: m.UploadDatasetPage }))
);
const ClusterListPage = lazy(() =>
  import("../features/misinformation/ClusterListPage").then(m => ({ default: m.ClusterListPage }))
);
const ClusterDetailPage = lazy(() =>
  import("../features/misinformation/ClusterDetailPage").then(m => ({ default: m.ClusterDetailPage }))
);

// Risk Graph + IncidentFlow
const RiskGraphPage = lazy(() =>
  import("../features/risk-graph/RiskGraphPage").then(m => ({ default: m.RiskGraphPage }))
);
const IncidentFlowOverviewPage = lazy(() =>
  import("../features/incidents/IncidentFlowOverviewPage").then(m => ({ default: m.IncidentFlowOverviewPage }))
);

// ─────────────────────────────────────────────────────────────────────────────

export function AppRouter() {
  return (
    <Routes>
      {/* Public landing routes — no auth required, no app shell */}
      <Route element={<LandingPage />} path="/" />
      <Route element={<AboutPage />} path="/about" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<Navigate replace to="/dashboard" />} path="/home" />
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<AssetsPage />} path="/assets" />
          <Route element={<AssetCreatePage />} path="/assets/new" />
          <Route element={<AssetDetailPage />} path="/assets/:id" />
          <Route element={<RiskEventsPage />} path="/risk-events" />
          <Route element={<RiskEventDetailPage />} path="/risk-events/:id" />
          <Route element={<IncidentsPage />} path="/incidents" />
          <Route element={<CreateIncidentPage />} path="/incidents/new" />
          <Route element={<IncidentDetailPage />} path="/incidents/:id" />
          <Route element={<ProcessingJobsPage />} path="/processing-jobs" />
          <Route element={<ThreatBoardOverviewPage />} path="/modules/threatboard" />
          <Route element={<VulnerabilitiesPage />} path="/modules/threatboard/vulnerabilities" />
          <Route
            element={<VulnerabilityDetailPage />}
            path="/modules/threatboard/vulnerabilities/:id"
          />
          <Route element={<AssetMatchesPage />} path="/modules/threatboard/matches" />
          <Route element={<AssetMatchDetailPage />} path="/modules/threatboard/matches/:id" />
          <Route element={<IngestionRunsPage />} path="/modules/threatboard/ingestion-runs" />
          <Route element={<LogLensOverviewPage />} path="/modules/loglens" />
          <Route element={<AnomaliesPage />} path="/modules/loglens/anomalies" />
          <Route element={<AnomalyDetailPage />} path="/modules/loglens/anomalies/:id" />
          <Route element={<UploadLogsPage />} path="/modules/loglens/upload" />
          <Route element={<PrivacyDoctorOverviewPage />} path="/modules/privacy-doctor" />
          <Route element={<DatasetListPage />} path="/modules/privacy-doctor/datasets" />
          <Route element={<DatasetDetailPage />} path="/modules/privacy-doctor/datasets/:id" />
          <Route element={<UploadDatasetPage />} path="/modules/privacy-doctor/upload" />
          <Route element={<ObservatoryOverviewPage />} path="/modules/misinformation-observatory" />
          <Route element={<MisDatasetListPage />} path="/modules/misinformation-observatory/datasets" />
          <Route element={<MisDatasetDetailPage />} path="/modules/misinformation-observatory/datasets/:id" />
          <Route element={<MisUploadDatasetPage />} path="/modules/misinformation-observatory/upload" />
          <Route element={<ClusterListPage />} path="/modules/misinformation-observatory/clusters" />
          <Route element={<ClusterDetailPage />} path="/modules/misinformation-observatory/clusters/:id" />
          <Route element={<RiskGraphPage />} path="/modules/risk-graph" />
          <Route element={<IncidentFlowOverviewPage />} path="/modules/incidentflow" />
        </Route>
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
