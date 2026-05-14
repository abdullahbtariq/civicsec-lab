import { LogOut, RefreshCcw } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { formatLabel } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function Topbar({ title }: { title: string }) {
  const { user, refreshUser, logout } = useAuth();
  const displayName = user?.full_name || user?.email || "Unknown user";

  return (
    <header className="sticky top-0 z-20 border-b border-civic-line bg-civic-surface/95 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-civic-muted">CivicSec Lab</p>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-civic-muted">{user?.organisation?.name || "No organisation"}</p>
          </div>
          <Badge variant="teal">{formatLabel(user?.role)}</Badge>
          <Button aria-label="Refresh profile" onClick={() => void refreshUser()} variant="ghost">
            <RefreshCcw aria-hidden="true" className="h-4 w-4" />
          </Button>
          <Button onClick={logout} variant="ghost">
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
