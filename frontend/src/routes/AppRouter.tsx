import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { AssetCreatePage } from "../features/assets/AssetCreatePage";
import { AssetDetailPage } from "../features/assets/AssetDetailPage";
import { AssetsPage } from "../features/assets/AssetsPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { IncidentDetailPage } from "../features/incidents/IncidentDetailPage";
import { IncidentsPage } from "../features/incidents/IncidentsPage";
import { ModulePlaceholderPage } from "../features/modules/ModulePlaceholderPage";
import { ProcessingJobsPage } from "../features/processing-jobs/ProcessingJobsPage";
import { RiskEventDetailPage } from "../features/risk-events/RiskEventDetailPage";
import { RiskEventsPage } from "../features/risk-events/RiskEventsPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<Navigate replace to="/dashboard" />} path="/" />
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<AssetsPage />} path="/assets" />
          <Route element={<AssetCreatePage />} path="/assets/new" />
          <Route element={<AssetDetailPage />} path="/assets/:id" />
          <Route element={<RiskEventsPage />} path="/risk-events" />
          <Route element={<RiskEventDetailPage />} path="/risk-events/:id" />
          <Route element={<IncidentsPage />} path="/incidents" />
          <Route element={<IncidentDetailPage />} path="/incidents/:id" />
          <Route element={<ProcessingJobsPage />} path="/processing-jobs" />
          <Route
            element={<ModulePlaceholderPage moduleKey="threatboard" />}
            path="/modules/threatboard"
          />
          <Route element={<ModulePlaceholderPage moduleKey="loglens" />} path="/modules/loglens" />
          <Route
            element={<ModulePlaceholderPage moduleKey="privacy-doctor" />}
            path="/modules/privacy-doctor"
          />
          <Route
            element={<ModulePlaceholderPage moduleKey="misinformation-observatory" />}
            path="/modules/misinformation-observatory"
          />
          <Route
            element={<ModulePlaceholderPage moduleKey="risk-graph" />}
            path="/modules/risk-graph"
          />
          <Route
            element={<ModulePlaceholderPage moduleKey="incidentflow" />}
            path="/modules/incidentflow"
          />
        </Route>
      </Route>
      <Route element={<Navigate replace to="/dashboard" />} path="*" />
    </Routes>
  );
}
