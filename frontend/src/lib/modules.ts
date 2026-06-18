/**
 * Canonical module metadata — single source of truth for accent colours.
 * Both AppLayout (route→colour map) and Sidebar (icon colours) import from here
 * so the palette never drifts between the two files.
 *
 * Colours chosen to read well on both navy (sidebar) and cream (content).
 */

export const MODULE_COLORS = {
  threatboard:                  "#d99a3c", // civic.amber
  loglens:                      "#8fa7b0", // civic.slate-text
  "privacy-doctor":             "#71a7ff", // civic.blue
  "misinformation-observatory": "#e2703f", // civic.orangelt
  "risk-graph":                 "#5f8c6e", // civic.sage
  incidentflow:                 "#ee6c7a", // civic.rose
} as const;

/** Route prefix → accent colour used by the Topbar module indicator. */
export const MODULE_ACCENT_COLORS: [prefix: string, color: string][] = [
  ["/modules/threatboard",                MODULE_COLORS.threatboard],
  ["/modules/loglens",                    MODULE_COLORS.loglens],
  ["/modules/privacy-doctor",             MODULE_COLORS["privacy-doctor"]],
  ["/modules/misinformation-observatory", MODULE_COLORS["misinformation-observatory"]],
  ["/modules/risk-graph",                 MODULE_COLORS["risk-graph"]],
  ["/modules/incidentflow",               MODULE_COLORS.incidentflow],
];
