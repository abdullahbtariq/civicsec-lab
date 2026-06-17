import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { AboutPage } from "../features/landing/AboutPage";
import { LandingPage } from "../features/landing/LandingPage";
import { AssetCreatePage } from "../features/assets/AssetCreatePage";
import { AssetDetailPage } from "../features/assets/AssetDetailPage";
import { AssetsPage } from "../features/assets/AssetsPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { CreateIncidentPage } from "../features/incidents/CreateIncidentPage";
import { IncidentDetailPage } from "../features/incidents/IncidentDetailPage";
import { IncidentFlowOverviewPage } from "../features/incidents/IncidentFlowOverviewPage";
import { IncidentsPage } from "../features/incidents/IncidentsPage";
import { AnomaliesPage } from "../features/loglens/AnomaliesPage";
import { AnomalyDetailPage } from "../features/loglens/AnomalyDetailPage";
import { LogLensOverviewPage } from "../features/loglens/LogLensOverviewPage";
import { UploadLogsPage } from "../features/loglens/UploadLogsPage";
import { ClusterDetailPage } from "../features/misinformation/ClusterDetailPage";
import { ClusterListPage } from "../features/misinformation/ClusterListPage";
import { DatasetDetailPage as MisDatasetDetailPage } from "../features/misinformation/DatasetDetailPage";
import { DatasetListPage as MisDatasetListPage } from "../features/misinformation/DatasetListPage";
import { ObservatoryOverviewPage } from "../features/misinformation/ObservatoryOverviewPage";
import { UploadDatasetPage as MisUploadDatasetPage } from "../features/misinformation/UploadDatasetPage";
import { RiskGraphPage } from "../features/risk-graph/RiskGraphPage";
import { DatasetDetailPage } from "../features/privacy-doctor/DatasetDetailPage";
import { DatasetListPage } from "../features/privacy-doctor/DatasetListPage";
import { PrivacyDoctorOverviewPage } from "../features/privacy-doctor/PrivacyDoctorOverviewPage";
import { UploadDatasetPage } from "../features/privacy-doctor/UploadDatasetPage";
import { ProcessingJobsPage } from "../features/processing-jobs/ProcessingJobsPage";
import { RiskEventDetailPage } from "../features/risk-events/RiskEventDetailPage";
import { RiskEventsPage } from "../features/risk-events/RiskEventsPage";
import { AssetMatchDetailPage } from "../features/threatboard/AssetMatchDetailPage";
import { AssetMatchesPage } from "../features/threatboard/AssetMatchesPage";
import { IngestionRunsPage } from "../features/threatboard/IngestionRunsPage";
import { ThreatBoardOverviewPage } from "../features/threatboard/ThreatBoardOverviewPage";
import { VulnerabilitiesPage } from "../features/threatboard/VulnerabilitiesPage";
import { VulnerabilityDetailPage } from "../features/threatboard/VulnerabilityDetailPage";
import { ProtectedRoute } from "./ProtectedRoute";

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
