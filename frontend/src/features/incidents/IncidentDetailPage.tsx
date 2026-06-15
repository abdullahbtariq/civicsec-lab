import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../hooks/useAuth";
import { useApiItem, useApiList } from "../../hooks/useApiData";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type {
  Incident,
  IncidentTask,
  IncidentTimelineEntry,
  PlaybookTemplate,
  RiskEvent,
} from "../../types/api";
import {
  addTimelineNote,
  applyPlaybook,
  createTask,
  deleteTask,
  downloadReport,
  getPlaybooks,
  getTasks,
  updateIncidentStatus,
  updateTask,
} from "./api";

const STATUSES = ["open", "investigating", "contained", "resolved", "closed", "dismissed"];

// ------------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------------

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-civic-line bg-[#14181d] p-4">
      <p className="text-xs uppercase text-civic-muted">{label}</p>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function TaskRow({
  task,
  canAct,
  onToggle,
  onDelete,
}: {
  task: IncidentTask;
  canAct: boolean;
  onToggle: (t: IncidentTask) => void;
  onDelete: (t: IncidentTask) => void;
}) {
  const isDone = task.status === "done";
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
        isDone
          ? "border-civic-line/40 bg-[#111418]/60 opacity-60"
          : "border-civic-line bg-[#14181d]"
      }`}
    >
      {canAct ? (
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            isDone
              ? "border-civic-teal bg-civic-teal text-[#091311]"
              : "border-civic-line hover:border-civic-teal"
          }`}
          title={isDone ? "Mark as pending" : "Mark as done"}
        >
          {isDone && (
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
            </svg>
          )}
        </button>
      ) : (
        <div
          className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 ${
            isDone ? "border-civic-teal bg-civic-teal" : "border-civic-line"
          }`}
        />
      )}

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${isDone ? "line-through text-civic-muted" : "text-white"}`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 text-xs text-civic-muted">{task.description}</p>
        )}
        {task.assignee_email && (
          <p className="mt-1 text-xs text-civic-muted">{task.assignee_email}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={isDone ? "teal" : task.status === "in_progress" ? "blue" : "neutral"}>
          {task.status_display}
        </Badge>
        {canAct && (
          <button
            onClick={() => onDelete(task)}
            className="text-xs text-civic-muted transition-colors hover:text-civic-rose"
            title="Delete task"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main page
// ------------------------------------------------------------------

export function IncidentDetailPage() {
  const { id } = useParams();
  const incidentId = Number(id);
  const { user } = useAuth();
  const canAct = user?.role === "admin" || user?.role === "analyst";

  // Refresh counters — incrementing the counter changes the URL path,
  // which causes useApiItem / useApiList to re-fetch.
  const [incidentKey, setIncidentKey] = useState(0);
  const [tlKey, setTlKey] = useState(0);

  const { data: incident, isLoading, error } = useApiItem<Incident>(
    id ? `/api/incidents/${id}/?_=${incidentKey}` : null,
  );
  const timelineData = useApiList<IncidentTimelineEntry>(
    `/api/incident-timeline/?_=${tlKey}`,
  );
  const riskEventsData = useApiList<RiskEvent>("/api/risk-events/");

  // IncidentFlow local state
  const [tasks, setTasks] = useState<IncidentTask[]>([]);
  const [playbooks, setPlaybooks] = useState<PlaybookTemplate[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!id) return;
    try {
      setTasks(await getTasks(Number(id)));
    } catch {
      /* ignore */
    }
  }, [id]);

  useEffect(() => {
    void loadTasks();
    getPlaybooks()
      .then(setPlaybooks)
      .catch(() => {});
  }, [loadTasks]);

  // Generic action wrapper
  async function act<T>(fn: () => Promise<T>, successMsg: string): Promise<T | null> {
    setIsActing(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const result = await fn();
      setActionMsg(successMsg);
      return result;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
      return null;
    } finally {
      setIsActing(false);
    }
  }

  async function handleApplyPlaybook() {
    if (!selectedPlaybookId) return;
    const result = await act(
      () => applyPlaybook(incidentId, Number(selectedPlaybookId)),
      "Playbook applied — tasks created.",
    );
    if (result !== null) {
      await loadTasks();
      setTlKey((k) => k + 1);
      setSelectedPlaybookId("");
    }
  }

  async function handleToggleTask(task: IncidentTask) {
    const next = task.status === "done" ? "pending" : "done";
    await act(
      () => updateTask(task.id, { status: next }),
      next === "done" ? "Task marked done." : "Task marked pending.",
    );
    await loadTasks();
  }

  async function handleDeleteTask(task: IncidentTask) {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await act(() => deleteTask(task.id), "Task deleted.");
    await loadTasks();
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    await act(() => createTask(incidentId, { title: newTaskTitle.trim() }), "Task added.");
    setNewTaskTitle("");
    await loadTasks();
  }

  async function handleStatusUpdate() {
    if (!newStatus) return;
    await act(
      () => updateIncidentStatus(incidentId, newStatus, statusNote),
      `Status updated to "${newStatus}".`,
    );
    setStatusNote("");
    setNewStatus("");
    setIncidentKey((k) => k + 1);
    setTlKey((k) => k + 1);
  }

  async function handleAddNote() {
    if (!noteTitle.trim()) return;
    await act(
      () => addTimelineNote(incidentId, { title: noteTitle.trim(), description: noteBody }),
      "Note added to timeline.",
    );
    setNoteTitle("");
    setNoteBody("");
    setTlKey((k) => k + 1);
  }

  // ------------------------------------------------------------------
  if (isLoading) return <LoadingState label="Loading incident" />;
  if (error) return <ErrorState message={error} />;
  if (!incident)
    return (
      <EmptyState
        description="The requested incident could not be found."
        title="Incident not found"
      />
    );

  const timelineEntries = timelineData.data.filter((e) => e.incident === incidentId);
  const linkedRiskEvents = riskEventsData.data.filter((e) =>
    incident.linked_risk_events.includes(e.id),
  );
  const tasksDone = tasks.filter((t) => t.status === "done").length;

  const matchingPlaybooks = playbooks.filter(
    (pb) => pb.incident_type === "" || pb.incident_type === incident.incident_type,
  );
  const otherPlaybooks = playbooks.filter(
    (pb) => pb.incident_type !== "" && pb.incident_type !== incident.incident_type,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="mb-1 text-xs text-civic-muted">
            <Link to="/modules/incidentflow" className="transition-colors hover:text-white">
              IncidentFlow
            </Link>{" "}
            /{" "}
            <Link to="/incidents" className="transition-colors hover:text-white">
              Incidents
            </Link>{" "}
            / {incident.title}
          </nav>
          <h1 className="font-display text-xl font-semibold text-white">{incident.title}</h1>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            downloadReport(incidentId, `incident-${incidentId}-report.md`)
          }
        >
          Download Report
        </Button>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className="rounded-lg border border-civic-teal/30 bg-civic-teal/5 px-4 py-2 text-xs text-civic-teal">
          {actionMsg}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-civic-rose/40 bg-civic-rose/10 px-4 py-2 text-xs text-civic-rose">
          {actionError}
        </div>
      )}

      {/* Overview */}
      <Card>
        <CardHeader
          description={incident.description || "No description provided."}
          title="Overview"
        />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Detail label="Severity" value={<SeverityBadge severity={incident.severity} />} />
          <Detail label="Status" value={<StatusBadge status={incident.status} />} />
          <Detail label="Type" value={formatLabel(incident.incident_type)} />
          <Detail label="Owner" value={incident.owner_email ?? "Not set"} />
          <Detail label="Opened" value={formatDateTime(incident.opened_at)} />
          <Detail
            label="Closed"
            value={incident.closed_at ? formatDateTime(incident.closed_at) : "—"}
          />
          <Detail
            label="Tasks"
            value={tasks.length > 0 ? `${tasksDone} / ${tasks.length} done` : "No tasks yet"}
          />
          <Detail label="Timeline entries" value={timelineEntries.length} />
        </CardContent>
      </Card>

      {/* Status update + apply playbook (admins/analysts only) */}
      {canAct && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Update Status" />
            <CardContent className="space-y-3">
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="">Select new status…</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatLabel(s)}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Optional note (reason for change)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={() => void handleStatusUpdate()}
                disabled={!newStatus || isActing}
              >
                Update Status
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Apply Playbook"
              description="Auto-generate a task checklist from a response template."
            />
            <CardContent className="space-y-3">
              <Select
                value={selectedPlaybookId}
                onChange={(e) => setSelectedPlaybookId(e.target.value)}
              >
                <option value="">Select playbook…</option>
                {matchingPlaybooks.length > 0 && (
                  <optgroup label="Recommended for this incident type">
                    {matchingPlaybooks.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.name} ({pb.steps.length} steps)
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherPlaybooks.length > 0 && (
                  <optgroup label="Other templates">
                    {otherPlaybooks.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
              <Button
                variant="secondary"
                onClick={() => void handleApplyPlaybook()}
                disabled={!selectedPlaybookId || isActing}
              >
                Apply Playbook
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task checklist */}
      <Card>
        <CardHeader
          title={`Response Tasks (${tasksDone}/${tasks.length} done)`}
          description="Actionable steps to resolve this incident."
        />
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description={
                canAct
                  ? "Apply a playbook above or add a task manually below."
                  : "No response tasks have been created for this incident."
              }
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  canAct={canAct}
                  onToggle={(t) => void handleToggleTask(t)}
                  onDelete={(t) => void handleDeleteTask(t)}
                />
              ))}
            </div>
          )}

          {canAct && (
            <div className="flex gap-2 border-t border-civic-line pt-2">
              <Input
                placeholder="Add a task…"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAddTask();
                }}
              />
              <Button
                variant="secondary"
                onClick={() => void handleAddTask()}
                disabled={!newTaskTitle.trim() || isActing}
              >
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline + linked risk events */}
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Timeline" />
          <CardContent className="space-y-3">
            {timelineData.isLoading && <LoadingState label="Loading timeline" />}
            {timelineData.error && <ErrorState message={timelineData.error} />}

            {timelineEntries.length > 0
              ? timelineEntries.map((entry) => (
                  <div
                    className="rounded-lg border border-civic-line bg-[#14181d] p-4"
                    key={entry.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="blue">{formatLabel(entry.entry_type)}</Badge>
                      <span className="text-xs text-civic-muted">
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{entry.title}</p>
                    {entry.description && (
                      <p className="mt-1 text-sm leading-6 text-civic-muted">
                        {entry.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-civic-muted">
                      {entry.actor_email ?? "System"}
                    </p>
                  </div>
                ))
              : !timelineData.isLoading && (
                  <EmptyState
                    description="Status changes, notes, and playbook actions appear here."
                    title="No timeline entries"
                  />
                )}

            {canAct && (
              <div className="space-y-2 border-t border-civic-line pt-2">
                <p className="text-xs font-medium uppercase tracking-wide text-civic-muted">
                  Add Note
                </p>
                <Input
                  placeholder="Note title…"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Optional details…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={2}
                  className="min-h-0"
                />
                <Button
                  variant="secondary"
                  onClick={() => void handleAddNote()}
                  disabled={!noteTitle.trim() || isActing}
                >
                  Add Note
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Linked Risk Events" />
          <CardContent className="space-y-3">
            {riskEventsData.isLoading && <LoadingState label="Loading risk events" />}
            {linkedRiskEvents.length > 0
              ? linkedRiskEvents.map((re) => (
                  <Link
                    className="block rounded-lg border border-civic-line bg-[#14181d] p-4 transition-colors hover:border-civic-teal/60"
                    key={re.id}
                    to={`/risk-events/${re.id}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={re.severity} />
                      <StatusBadge status={re.status} />
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{re.title}</p>
                  </Link>
                ))
              : !riskEventsData.isLoading && (
                  <EmptyState
                    description="No risk events are linked to this incident."
                    title="No linked events"
                  />
                )}
          </CardContent>
        </Card>
      </section>

      {/* Timeline summary + lessons learned */}
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Timeline Summary" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              {incident.timeline_summary || "No timeline summary provided."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Lessons Learned" />
          <CardContent>
            <p className="text-sm leading-6 text-civic-muted">
              {incident.lessons_learned || "Lessons learned not yet recorded."}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
