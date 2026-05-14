import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiList } from "../../hooks/useApiData";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type { Incident } from "../../types/api";

export function IncidentsPage() {
  const { data, isLoading, error } = useApiList<Incident>("/api/incidents/");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [incidentType, setIncidentType] = useState("");

  const filteredIncidents = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return data.filter((incident) => {
      const text = `${incident.title} ${incident.description} ${incident.incident_type}`.toLowerCase();
      return (
        (!normalizedSearch || text.includes(normalizedSearch)) &&
        (!severity || incident.severity === severity) &&
        (!status || incident.status === status) &&
        (!incidentType || incident.incident_type === incidentType)
      );
    });
  }, [data, incidentType, search, severity, status]);

  if (isLoading) return <LoadingState label="Loading incidents" />;
  if (error) return <ErrorState message={error} />;

  return (
    <Card>
      <CardHeader
        description="Response records that connect risk events, notes, ownership, and report-ready timelines."
        title="Incidents"
      />
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_12rem_13rem_15rem]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-civic-muted" />
            <Input
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search incidents"
              value={search}
            />
          </label>
          <Select onChange={(event) => setSeverity(event.target.value)} value={severity}>
            <option value="">All severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">All status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="contained">Contained</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="dismissed">Dismissed</option>
          </Select>
          <Select onChange={(event) => setIncidentType(event.target.value)} value={incidentType}>
            <option value="">All types</option>
            <option value="vulnerability_exposure">Vulnerability exposure</option>
            <option value="suspected_account_compromise">Suspected account compromise</option>
            <option value="data_privacy_issue">Data privacy issue</option>
            <option value="online_harm_escalation">Online harm escalation</option>
            <option value="mixed_civic_risk">Mixed civic risk</option>
            <option value="manual">Manual</option>
          </Select>
        </div>

        {filteredIncidents.length ? (
          <DataTable
            columns={[
              {
                key: "title",
                header: "Title",
                cell: (incident) => (
                  <Link className="font-medium text-white hover:text-civic-teal" to={`/incidents/${incident.id}`}>
                    {incident.title}
                  </Link>
                ),
              },
              { key: "type", header: "Type", cell: (incident) => formatLabel(incident.incident_type) },
              { key: "severity", header: "Severity", cell: (incident) => <SeverityBadge severity={incident.severity} /> },
              { key: "status", header: "Status", cell: (incident) => <StatusBadge status={incident.status} /> },
              { key: "owner", header: "Owner", cell: (incident) => incident.owner_email || "Not set" },
              { key: "opened", header: "Opened", cell: (incident) => formatDateTime(incident.opened_at) },
              { key: "updated", header: "Updated", cell: (incident) => formatDateTime(incident.updated_at) },
            ]}
            data={filteredIncidents}
            getRowKey={(incident) => incident.id}
          />
        ) : (
          <EmptyState
            description="Incidents will appear here when risk events are escalated into response workflows."
            title="No incidents match this view"
          />
        )}
      </CardContent>
    </Card>
  );
}
