import { DataTable } from "../../../components/ui/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDateTime, formatLabel } from "../../../lib/utils";
import type { ThreatIngestionRun } from "../types";

export function IngestionRunTable({ runs }: { runs: ThreatIngestionRun[] }) {
  return (
    <DataTable
      columns={[
        { key: "run", header: "Run type", cell: (run) => formatLabel(run.run_type) },
        { key: "source", header: "Source", cell: (run) => formatLabel(run.source) },
        { key: "status", header: "Status", cell: (run) => <StatusBadge status={run.status} /> },
        { key: "seen", header: "Seen", cell: (run) => run.records_seen },
        { key: "created", header: "Created", cell: (run) => run.records_created },
        { key: "updated", header: "Updated", cell: (run) => run.records_updated },
        { key: "failed", header: "Failed", cell: (run) => run.records_failed },
        { key: "started", header: "Started", cell: (run) => formatDateTime(run.started_at), className: "whitespace-nowrap" },
        { key: "finished", header: "Finished", cell: (run) => formatDateTime(run.finished_at), className: "whitespace-nowrap" },
        { key: "error", header: "Error", cell: (run) => run.error_message || "None" },
      ]}
      data={runs}
      getRowKey={(run) => run.id}
    />
  );
}
