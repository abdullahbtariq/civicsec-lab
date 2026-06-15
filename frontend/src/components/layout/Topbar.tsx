import { LogOut } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

export function Topbar({ title, moduleColor }: { title: string; moduleColor?: string }) {
  const { logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-20 border-b px-4 py-3 backdrop-blur lg:px-8"
      style={{
        background: "rgba(20, 24, 29, 0.95)",
        borderBottomColor: moduleColor ? `${moduleColor}55` : "#2b3036",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {moduleColor && (
            <span
              aria-hidden="true"
              className="h-4 w-0.5 shrink-0 rounded-full"
              style={{ backgroundColor: moduleColor }}
            />
          )}
          <p className="font-display text-base font-semibold text-white">{title}</p>
        </div>
        {/* Sign-out is available on mobile here; desktop uses the sidebar */}
        <button
          aria-label="Sign out"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-civic-muted transition-colors hover:bg-[#20252b] hover:text-white lg:hidden"
          onClick={logout}
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
