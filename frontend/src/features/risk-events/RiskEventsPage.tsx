import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { ConfidenceBadge } from "../../components/ui/ConfidenceBadge";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { RiskScoreBadge } from "../../components/ui/RiskScoreBadge";
import { Select } from "../../components/ui/Select";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiList } from "../../hooks/useApiData";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type { RiskEvent } from "../../types/api";

export function RiskEventsPage() {
  const { data, isLoading, error } = useApiList<RiskEvent>("/api/risk-events/");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [sourceModule, setSourceModule] = useState("");

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return data.filter((event) => {
      const text = `${event.title} ${event.summary} ${event.source_module}`.toLowerCase();
      return (
        (!normalizedSearch || text.includes(normalizedSearch)) &&
        (!severity || event.severity === severity) &&
        (!status || event.status === status) &&
        (!sourceModule || event.source_module === sourceModule)
      );
    });
  }, [data, search, severity, sourceModule, status]);

  if (isLoading) return <LoadingState label="Loading risk events" />;
  if (error) return <ErrorState message={error} />;

  return (
    <Card>
      <CardHeader
        description="Shared review queue for module-generated and manual risk signals."
        title="Risk Events"
      />
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_14rem]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-civic-muted" />
            <Input
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search risk events"
              value={search}
            />
          </label>
          <Select onChange={(event) => setSeverity(event.target.value)} value={severity}>
            <option value="">All severity</option>
            <option value="info">Info</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">All status</option>
            <option value="new">New</option>
            <option value="triaged">Triaged</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="false_positive">False positive</option>
          </Select>
          <Select onChange={(event) => setSourceModule(event.target.value)} value={sourceModule}>
            <option value="">All modules</option>
            <option value="manual">Manual</option>
            <option value="threatboard">ThreatBoard</option>
            <option value="loglens">LogLens</option>
            <option value="privacy_doctor">DataPrivacy Doctor</option>
            <option value="misinformation_observatory">Misinformation Observatory</option>
            <option value="incidentflow">IncidentFlow</option>
          </Select>
        </div>

        {filteredEvents.length ? (
          <DataTable
            columns={[
              {
                key: "title",
                header: "Title",
                cell: (event) => (
                  <Link className="font-medium text-white hover:text-civic-teal" to={`/risk-events/${event.id}`}>
                    {event.title}
                  </Link>
                ),
              },
              { key: "source", header: "Source", cell: (event) => formatLabel(event.source_module) },
              { key: "severity", header: "Severity", cell: (event) => <SeverityBadge severity={event.severity} /> },
              { key: "status", header: "Status", cell: (event) => <StatusBadge status={event.status} /> },
              { key: "confidence", header: "Confidence", cell: (event) => <ConfidenceBadge confidence={event.confidence} /> },
              { key: "score", header: "Risk score", cell: (event) => <RiskScoreBadge score={event.risk_score} /> },
              { key: "asset", header: "Affected asset", cell: (event) => event.affected_asset_name || "Not set" },
              { key: "first", header: "First seen", cell: (event) => formatDateTime(event.first_seen_at) },
              { key: "updated", header: "Updated", cell: (event) => formatDateTime(event.updated_at) },
            ]}
            data={filteredEvents}
            getRowKey={(event) => event.id}
          />
        ) : (
          <EmptyState
            description="Future modules will generate risk events from vulnerability, login, privacy, and narrative signals."
            title="No risk events match this view"
          />
        )}
      </CardContent>
    </Card>
  );
}
