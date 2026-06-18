import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useApiList } from "../../hooks/useApiData";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type { ProcessingJob } from "../../types/api";

export function ProcessingJobsPage() {
  const { data, isLoading, error } = useApiList<ProcessingJob>("/api/processing-jobs/");

  if (isLoading) return <LoadingState label="Loading processing jobs" />;
  if (error) return <ErrorState message={error} />;

  return (
    <Card>
      <CardHeader
        description="Background job records for future ingestion, scanning, processing, and report pipelines."
        title="Data Jobs"
      />
      <CardContent>
        {data.length ? (
          <DataTable
            columns={[
              { key: "type", header: "Job type", cell: (job) => formatLabel(job.job_type) },
              { key: "status", header: "Status", cell: (job) => <StatusBadge status={job.status} /> },
              {
                key: "progress",
                header: "Progress",
                cell: (job) => (
                  <div className="min-w-32">
                    <div className="h-2 rounded-full bg-paper">
                      <div
                        className="h-2 rounded-full bg-[#d65a29]"
                        style={{ width: `${Math.max(0, Math.min(job.progress, 100))}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">{job.progress}%</p>
                  </div>
                ),
              },
              { key: "started", header: "Started", cell: (job) => formatDateTime(job.started_at), className: "whitespace-nowrap" },
              { key: "finished", header: "Finished", cell: (job) => formatDateTime(job.finished_at), className: "whitespace-nowrap" },
              { key: "error", header: "Error", cell: (job) => job.error_message || "None" },
            ]}
            data={data}
            getRowKey={(job) => job.id}
          />
        ) : (
          <EmptyState
            description="Processing jobs will track future vulnerability ingestion, log detection, privacy scans, discourse processing, and reports."
            title="No processing jobs yet"
          />
        )}
      </CardContent>
    </Card>
  );
}
