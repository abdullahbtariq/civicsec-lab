import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { createIncident } from "./api";

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const INCIDENT_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "vulnerability_exposure", label: "Vulnerability Exposure" },
  { value: "suspected_account_compromise", label: "Suspected Account Compromise" },
  { value: "data_privacy_issue", label: "Data Privacy Issue" },
  { value: "online_harm_escalation", label: "Online Harm Escalation" },
  { value: "mixed_civic_risk", label: "Mixed Civic Risk" },
];

export function CreateIncidentPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [incidentType, setIncidentType] = useState("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const incident = await createIncident({
        title: title.trim(),
        description,
        severity,
        incident_type: incidentType,
      });
      navigate(`/incidents/${incident.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create incident.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <nav className="mb-1 text-xs text-civic-muted">
          <ButtonLink to="/modules/incidentflow" variant="ghost" className="px-0 text-xs min-h-0 py-0 h-auto">
            IncidentFlow
          </ButtonLink>{" "}
          / New Incident
        </nav>
        <h1 className="text-xl font-semibold text-white">Create Incident</h1>
        <p className="mt-0.5 text-sm text-civic-muted">
          Open a new structured response record.
        </p>
      </div>

      <Card>
        <CardHeader title="Incident Details" />
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-civic-muted uppercase tracking-wide">
                Title <span className="text-civic-rose">*</span>
              </label>
              <Input
                placeholder="Brief, specific description of the incident"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-civic-muted uppercase tracking-wide">
                  Severity
                </label>
                <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-civic-muted uppercase tracking-wide">
                  Incident Type
                </label>
                <Select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-civic-muted uppercase tracking-wide">
                Description
              </label>
              <Textarea
                placeholder="What happened? Provide initial context and known impact."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-civic-rose/40 bg-civic-rose/10 px-4 py-3 text-sm text-civic-rose">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create Incident"}
              </Button>
              <ButtonLink to="/incidents" variant="secondary">
                Cancel
              </ButtonLink>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
