import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Checking session" />;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-civic-surface p-6 text-civic-text">
        <ErrorState message={error} />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
