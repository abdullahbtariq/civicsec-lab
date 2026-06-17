import { ArrowRight, ExternalLink } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

import { BrandMark } from "../../components/brand/BrandMark";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../lib/api";

export function LoginPage() {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from?.pathname || "/dashboard";

  if (isLoading) {
    return <LoadingState label="Checking session" />;
  }

  if (isAuthenticated) {
    return <Navigate replace to={from} />;
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center">
            <BrandMark size={56} boxed className="mb-6 rounded-2xl shadow-card" />
            <p className="text-label font-semibold uppercase tracking-[0.12em] text-orange-ink">
              Public-interest security intelligence
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">CivicSec Lab</h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-ink-soft">
              Cyber, data, and platform-risk intelligence for civic organisations.
            </p>
          </div>

          <Card>
            <CardContent className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Sign in</h2>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  API login will be wired once backend session or token login is enabled. For this
                  foundation, sign in through Django admin, then return here and refresh the session.
                </p>
              </div>

              <div className="rounded-lg border border-paper-line bg-paper p-4">
                <p className="text-sm font-medium text-ink">Demo admin account</p>
                <p className="mt-2 text-sm text-ink-soft">admin@opencivicaid.test</p>
                <p className="text-sm text-ink-soft">ChangeMe123!</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={`${API_BASE_URL}/admin/login/`} rel="noreferrer">
                  <Button className="w-full sm:w-auto" variant="primary">
                    Open Django admin
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </a>
                <Button onClick={() => void refreshUser()} variant="secondary">
                  I signed in
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
