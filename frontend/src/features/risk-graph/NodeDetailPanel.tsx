import { X } from "lucide-react";

import { type GraphNode } from "./api";
import { nodeTypeColor, severityColor } from "./RiskGraphPage";

const TYPE_LABEL: Record<string, string> = {
  asset: "Asset",
  vulnerability: "Vulnerability",
  risk_event: "Risk Event",
  anomaly: "Login Anomaly",
  cluster: "Narrative Cluster",
  dataset: "High-risk Dataset",
  incident: "Incident",
};

interface Props {
  node: GraphNode;
  onClose: () => void;
}

function MetaRow({ label, value }: { label: string; value: unknown }) {
  const display =
    value === null || value === undefined
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);

  return (
    <div className="flex gap-2 border-b border-paper-line py-1.5 last:border-0">
      <dt className="w-32 shrink-0 text-xs text-ink-soft">{label}</dt>
      <dd className="min-w-0 break-words text-xs text-ink">{display}</dd>
    </div>
  );
}

function humanise(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function NodeDetailPanel({ node, onClose }: Props) {
  const typeColor = nodeTypeColor(node.type);
  const sevColor = node.severity ? severityColor(node.severity) : null;

  const metaEntries = Object.entries(node.meta).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  return (
    <aside className="flex w-72 shrink-0 flex-col rounded-lg border border-paper-line bg-paper">
      {/* Header */}
      <div
        className="flex items-start justify-between rounded-t-lg border-b border-paper-line p-3"
        style={{ borderLeftColor: typeColor, borderLeftWidth: 3 }}
      >
        <div className="min-w-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: typeColor }}
          >
            {TYPE_LABEL[node.type] ?? node.type}
          </span>
          <p className="mt-0.5 break-words text-sm font-medium leading-snug text-ink">
            {node.label}
          </p>
          {sevColor && node.severity && (
            <span
              className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase"
              style={{ color: sevColor }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: sevColor }}
              />
              {node.severity}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded p-1 text-ink-soft transition-colors hover:bg-paper-line hover:text-ink"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Meta */}
      <div className="flex-1 overflow-y-auto p-3">
        {metaEntries.length === 0 ? (
          <p className="text-xs text-ink-soft">No additional details.</p>
        ) : (
          <dl>
            {metaEntries.map(([key, value]) => (
              <MetaRow key={key} label={humanise(key)} value={value} />
            ))}
          </dl>
        )}
      </div>

      {/* Link */}
      {node.url && (
        <div className="shrink-0 border-t border-paper-line p-3">
          <a
            href={node.url}
            className="block w-full rounded-md py-1.5 text-center text-xs font-medium transition-colors"
            style={{
              backgroundColor: `${typeColor}20`,
              color: typeColor,
            }}
          >
            Open full record →
          </a>
        </div>
      )}
    </aside>
  );
}
