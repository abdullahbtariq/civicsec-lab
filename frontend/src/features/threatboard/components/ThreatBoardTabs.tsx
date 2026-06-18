import { NavLink } from "react-router-dom";

import { cn } from "../../../lib/utils";

const tabs = [
  { label: "Overview", to: "/modules/threatboard" },
  { label: "Vulnerabilities", to: "/modules/threatboard/vulnerabilities" },
  { label: "Asset Matches", to: "/modules/threatboard/matches" },
  { label: "Ingestion Runs", to: "/modules/threatboard/ingestion-runs" },
];

export function ThreatBoardTabs() {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-paper-line pb-2" aria-label="ThreatBoard">
      {tabs.map((tab) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              "inline-flex min-h-10 shrink-0 items-center rounded-lg border px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "border-[#d65a29]/60 bg-[#d65a29]/[0.12] text-orange-ink"
                : "border-transparent bg-transparent text-ink-soft hover:border-paper-line hover:bg-paper-raise hover:text-ink",
            )
          }
          end={tab.to === "/modules/threatboard"}
          key={tab.to}
          to={tab.to}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
