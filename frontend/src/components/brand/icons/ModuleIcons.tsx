import type { SVGProps } from "react";

export type ModuleIconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  xmlns: "http://www.w3.org/2000/svg",
};

/**
 * Custom drafting-style module marks — radial / technical-line glyphs that
 * share the CivicSec Lab instrument language (concentric geometry, nodes,
 * trails). Drop-in replacements for lucide icons: spread standard SVG props.
 */

// ThreatBoard — radar scope + exposure blip
export function ThreatBoardIcon(props: ModuleIconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 1.6v2.2M12 20.2v2.2M1.6 12h2.2M20.2 12h2.2" />
      <circle cx="17.4" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// LogLens — behavioural orbit with one off-path anomaly
export function LogLensIcon(props: ModuleIconProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="4.4" transform="rotate(-22 12 12)" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.4" cy="8.2" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="6" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="18.4" r="1.7" />
    </svg>
  );
}

// DataPrivacy Doctor — layered data planes with a scan line + masked field
export function PrivacyDoctorIcon(props: ModuleIconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.5" width="13" height="8" rx="1.6" />
      <rect x="7.5" y="10.5" width="13" height="8" rx="1.6" />
      <path d="M10 14.6h8" />
      <circle cx="11.3" cy="9.3" r="0.95" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Misinformation Observatory — narrative ripples radiating from a source
export function ObservatoryIcon(props: ModuleIconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M9.2 8.2a5 5 0 0 1 0 7.6" />
      <path d="M12.4 6a8.4 8.4 0 0 1 0 12" />
      <path d="M15.6 4.4a11.6 11.6 0 0 1 0 15.2" />
    </svg>
  );
}

// Civic Risk Graph — node-link constellation around a central event
export function RiskGraphIcon(props: ModuleIconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 12 5.2 6.4M12 12 19 7.2M12 12 6.4 18.2M12 12 18 17.2" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="5.2" cy="6.4" r="1.5" />
      <circle cx="19" cy="7.2" r="1.5" />
      <circle cx="6.4" cy="18.2" r="1.5" />
      <circle cx="18" cy="17.2" r="1.5" />
    </svg>
  );
}

// IncidentFlow — response route through a human-review gate
export function IncidentFlowIcon(props: ModuleIconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 17.5 8.6 13.4" />
      <path d="M15.4 10.6 20 6.5" />
      <path d="M12 8.8 15.2 12 12 15.2 8.8 12 12 8.8Z" />
      <circle cx="4" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const MODULE_ICONS = {
  threatboard: ThreatBoardIcon,
  loglens: LogLensIcon,
  privacy: PrivacyDoctorIcon,
  observatory: ObservatoryIcon,
  riskGraph: RiskGraphIcon,
  incidentFlow: IncidentFlowIcon,
} as const;
