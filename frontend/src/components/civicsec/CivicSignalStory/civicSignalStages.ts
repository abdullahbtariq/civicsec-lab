export type CivicVisualMode =
  | "base"
  | "threatboard"
  | "loglens"
  | "privacy"
  | "misinformation"
  | "riskGraph"
  | "incidentFlow"
  | "core";

export type CivicSignalStage = {
  id: string;
  label: string;
  moduleName: string;
  headline: string;
  description: string;
  signalIn: string;
  transform: string;
  output: string;
  audience: string[];
  ctaLabel: string;
  ctaTo: string;
  visualMode: CivicVisualMode;
};

/**
 * One signal. Six instruments. One response system.
 * Each stage links the morphing Civic Signal Core to a module's copy.
 */
export const CIVIC_SIGNAL_STAGES: CivicSignalStage[] = [
  {
    id: "base",
    label: "00 · The model",
    moduleName: "Dispersed civic signal",
    headline: "Dispersed civic signals rarely arrive as evidence.",
    description:
      "CivicSec Lab begins with noisy, partial, and disconnected risk signals: assets, logs, datasets, narratives, incidents, and public reports.",
    signalIn: "Unstructured civic risk signals",
    transform: "Initial intake, tagging, and source context",
    output: "A signal ready to become a RiskEvent",
    audience: ["Civic organisations", "Researchers", "Journalists", "Public-interest teams"],
    ctaLabel: "Explore the model",
    ctaTo: "/login",
    visualMode: "base",
  },
  {
    id: "threatboard",
    label: "01 · ThreatBoard",
    moduleName: "ThreatBoard",
    headline: "ThreatBoard turns exposure into prioritised risk.",
    description:
      "ThreatBoard helps civic teams understand vulnerabilities, exposed services, exploited CVEs, and asset-level risk without overwhelming them.",
    signalIn: "Known exploited vulnerabilities, EPSS scores, exposed assets",
    transform: "Exposure scoring, asset criticality, and prioritisation",
    output: "Explainable vulnerability risk events",
    audience: ["Security teams", "Operations leads", "Civic technologists"],
    ctaLabel: "View ThreatBoard",
    ctaTo: "/modules/threatboard",
    visualMode: "threatboard",
  },
  {
    id: "loglens",
    label: "02 · LogLens",
    moduleName: "LogLens",
    headline: "LogLens makes suspicious access behaviour legible.",
    description:
      "LogLens traces login patterns, impossible travel, unusual access, account anomalies, and risky authentication behaviour.",
    signalIn: "Login events, account activity, access metadata",
    transform: "Pattern comparison, anomaly detection, and session context",
    output: "Account and access risk events",
    audience: ["Analysts", "Trust & safety teams", "Account security teams"],
    ctaLabel: "View LogLens",
    ctaTo: "/modules/loglens",
    visualMode: "loglens",
  },
  {
    id: "privacy",
    label: "03 · DataPrivacy Doctor",
    moduleName: "DataPrivacy Doctor",
    headline: "DataPrivacy Doctor protects sensitive civic datasets.",
    description:
      "DataPrivacy Doctor scans datasets for exposure, sensitive fields, risky combinations, and privacy issues before data is shared, analysed, or published.",
    signalIn: "Datasets, schemas, fields, metadata, sample records",
    transform: "PII detection, exposure checks, risk classification",
    output: "Privacy risk findings and safer handling guidance",
    audience: ["Researchers", "Data stewards", "NGOs", "Civic organisations"],
    ctaLabel: "View DataPrivacy Doctor",
    ctaTo: "/modules/privacy-doctor",
    visualMode: "privacy",
  },
  {
    id: "misinformation",
    label: "04 · Observatory",
    moduleName: "Misinformation Observatory",
    headline: "Misinformation Observatory tracks narrative movement.",
    description:
      "The Observatory helps researchers and civic defenders detect narrative spikes, harmful claims, coordinated patterns, and information disorder across public-interest contexts.",
    signalIn: "Claims, posts, public narratives, spikes, clusters",
    transform: "Narrative clustering, anomaly detection, and context labelling",
    output: "Narrative risk events and monitoring briefs",
    audience: ["Researchers", "Journalists", "Policy teams", "Civic defenders"],
    ctaLabel: "View Observatory",
    ctaTo: "/modules/misinformation-observatory",
    visualMode: "misinformation",
  },
  {
    id: "riskGraph",
    label: "05 · Civic Risk Graph",
    moduleName: "Civic Risk Graph",
    headline: "Civic Risk Graph connects isolated signals into context.",
    description:
      "The graph links assets, accounts, datasets, narratives, incidents, and alerts so teams can understand whether separate signals are actually part of the same civic risk story.",
    signalIn: "Entities, events, relationships, prior incidents",
    transform: "Context linking, correlation, and relationship mapping",
    output: "A connected civic risk picture",
    audience: ["Investigators", "Leadership teams", "Researchers", "Responders"],
    ctaLabel: "View Risk Graph",
    ctaTo: "/modules/risk-graph",
    visualMode: "riskGraph",
  },
  {
    id: "incidentFlow",
    label: "06 · IncidentFlow",
    moduleName: "IncidentFlow",
    headline: "IncidentFlow turns risk into accountable response.",
    description:
      "IncidentFlow helps teams triage, review, assign, document, respond, and export incident evidence without losing the reasoning behind decisions.",
    signalIn: "RiskEvents, analyst notes, evidence packets, playbooks",
    transform: "Triage, assignment, review gates, escalation logic",
    output: "Incident timeline, response playbook, exportable report",
    audience: ["Responders", "Incident managers", "NGOs", "Civic teams"],
    ctaLabel: "View IncidentFlow",
    ctaTo: "/modules/incidentflow",
    visualMode: "incidentFlow",
  },
  {
    id: "core",
    label: "07 · Shared model",
    moduleName: "The RiskEvent Core",
    headline: "Six modules. One shared civic risk model.",
    description:
      "Every module resolves into the same evidence object: what was observed, how severe it is, how confident the system is, who or what is affected, and what needs human review.",
    signalIn: "Assets, logs, datasets, narratives, alerts, incident notes",
    transform: "Evidence modelling, confidence scoring, human review",
    output: "Reviewable, explainable civic risk response",
    audience: ["Public-interest teams", "Researchers", "Civic defenders", "Technologists"],
    ctaLabel: "Explore CivicSec Lab",
    ctaTo: "/login",
    visualMode: "core",
  },
];

// Brand tokens for the WebGL instrument (drawn navy/orange on archival cream).
export const CIVIC_COLORS = {
  navy: "#0f2230",
  navy2: "#162b3a",
  cream: "#f3eadc",
  paper: "#efe3cf",
  orange: "#d65a29",
  gold: "#c79a44",
  coral: "#e96565",
  sage: "#7b8f79",
  muted: "#8e8882",
  line: "rgba(15, 34, 48, 0.55)",
} as const;
