import { Badge } from "../../components/ui/Badge";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";

const modules = {
  threatboard: {
    name: "ThreatBoard",
    purpose: "Vulnerability intelligence and exposure prioritisation.",
    methods: ["CISA KEV", "FIRST EPSS", "OSV"],
    status: "planned",
  },
  loglens: {
    name: "LogLens",
    purpose: "Suspicious login and behavioural anomaly detection.",
    methods: ["Rules", "Anomaly detection", "MITRE ATT&CK mapping"],
    status: "planned",
  },
  "privacy-doctor": {
    name: "DataPrivacy Doctor",
    purpose: "Dataset privacy-risk scanner.",
    methods: ["Identifier detection", "Quasi-identifier checks", "k-anonymity-style review"],
    status: "planned",
  },
  "misinformation-observatory": {
    name: "Misinformation Observatory",
    purpose: "Narrative clustering and online harm signal monitoring.",
    methods: ["NLP", "Clustering", "Sentiment trend", "Keyword burst detection"],
    status: "planned",
  },
  "risk-graph": {
    name: "Civic Risk Graph",
    purpose: "Cross-module relationship and correlation layer.",
    methods: ["Graph visualisation", "Risk correlation", "Evidence context"],
    status: "planned",
  },
  incidentflow: {
    name: "IncidentFlow",
    purpose: "Incident response workflows and reports.",
    methods: ["Incident records", "Timeline entries", "Report generation later"],
    status: "foundation started",
  },
} as const;

export function ModulePlaceholderPage({ moduleKey }: { moduleKey: keyof typeof modules }) {
  const module = modules[moduleKey];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader description={module.purpose} title={module.name} />
        <CardContent className="space-y-5">
          <Badge variant={module.status === "planned" ? "neutral" : "teal"}>{module.status}</Badge>
          <div className="grid gap-3 md:grid-cols-3">
            {module.methods.map((method) => (
              <div className="rounded-lg border border-civic-line bg-[#14181d] p-4" key={method}>
                <p className="text-sm font-medium text-white">{method}</p>
              </div>
            ))}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-civic-muted">
            This page is intentionally a platform placeholder. Module-specific ingestion, analysis,
            scoring, visualisation, and workflows will be implemented in later prompts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
