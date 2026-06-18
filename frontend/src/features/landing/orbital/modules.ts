// Shared data for the orbital landing experience.
// Geometry fields (R/incl/spd/ph/color) drive the 3D node; content fields drive the HUD panel.

export type OrbitalStat = { k: string; v: string };

export type OrbitalModule = {
  key: string;
  name: string;
  sec: string;        // "SEC·01"
  hex: string;        // CSS hex for DOM (labels, chips, tint)
  color: number;      // three.js hex for the node
  R: number;          // orbit radius
  incl: number;       // orbit inclination (radians)
  spd: number;        // angular speed
  ph: number;         // phase offset
  what: string;       // plain-language "what it does"
  stats: OrbitalStat[];
  href: string;       // "enter full module" target
};

export const ORBITAL_MODULES: OrbitalModule[] = [
  {
    key: "threatboard",
    name: "ThreatBoard",
    sec: "SEC·01",
    hex: "#e7b052",
    color: 0xe7b052,
    R: 3.0, incl: 0.16, spd: 0.4, ph: 0.3,
    what: "Shows which of your systems have flaws attackers are exploiting right now — and what to patch first.",
    stats: [
      { k: "SOURCE", v: "CISA KEV — 1,624 CVEs" },
      { k: "PRIORITY", v: "FIRST EPSS exploit-probability" },
      { k: "MATCH", v: "asset-aware risk score" },
    ],
    href: "/login",
  },
  {
    key: "loglens",
    name: "LogLens",
    sec: "SEC·02",
    hex: "#71a7ff",
    color: 0x71a7ff,
    R: 3.8, incl: -0.32, spd: 0.33, ph: 1.4,
    what: "Catches unusual sign-ins and access patterns before they become a breach.",
    stats: [
      { k: "DETECTORS", v: "6 rules (impossible travel…)" },
      { k: "CONTEXT", v: "MITRE ATT&CK mapped" },
      { k: "FLAGS", v: "confidence-scored" },
    ],
    href: "/login",
  },
  {
    key: "privacy-doctor",
    name: "DataPrivacy Doctor",
    sec: "SEC·03",
    hex: "#5b8def",
    color: 0x5b8def,
    R: 4.6, incl: 0.42, spd: 0.27, ph: 2.6,
    what: "Finds personal data hidden in your spreadsheets and scores how exposed you are.",
    stats: [
      { k: "SCAN", v: "14 PII / quasi-id types" },
      { k: "SCORE", v: "0–100 per dataset" },
      { k: "OUTPUT", v: "per-column findings" },
    ],
    href: "/login",
  },
  {
    key: "observatory",
    name: "Misinformation Observatory",
    sec: "SEC·04",
    hex: "#e0662f",
    color: 0xe0662f,
    R: 3.3, incl: -0.2, spd: 0.36, ph: 3.7,
    what: "Surfaces coordinated narratives and disinformation aimed at your cause.",
    stats: [
      { k: "CLUSTERING", v: "TF-IDF + k-means" },
      { k: "REACH", v: "multilingual (auto-translate)" },
      { k: "TONE", v: "VADER sentiment" },
    ],
    href: "/login",
  },
  {
    key: "risk-graph",
    name: "Civic Risk Graph",
    sec: "SEC·05",
    hex: "#5f8c6e",
    color: 0x5f8c6e,
    R: 5.3, incl: 0.28, spd: 0.22, ph: 5.0,
    what: "Connects every alert across all systems so related threats show up together, not as scattered noise.",
    stats: [
      { k: "LINKS", v: "assets · vulns · anomalies" },
      { k: "LAYER", v: "one shared risk model" },
      { k: "VIEW", v: "interactive graph" },
    ],
    href: "/login",
  },
  {
    key: "incidentflow",
    name: "IncidentFlow",
    sec: "SEC·06",
    hex: "#ee6c7a",
    color: 0xee6c7a,
    R: 4.1, incl: -0.44, spd: 0.29, ph: 0.9,
    what: "Takes you from first alert to a documented, auditable close — without a SOC.",
    stats: [
      { k: "FLOW", v: "alert → closure" },
      { k: "PLAYBOOKS", v: "templated" },
      { k: "TRAIL", v: "full timeline" },
    ],
    href: "/login",
  },
];
