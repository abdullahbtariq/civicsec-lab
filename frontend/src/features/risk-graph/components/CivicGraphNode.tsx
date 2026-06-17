import { Handle, Position, type NodeProps } from "@xyflow/react";

import { type GraphNode } from "../api";
import { nodeTypeColor, severityColor } from "../RiskGraphPage";

interface CivicNodeData extends Record<string, unknown> {
  graphNode: GraphNode;
}

/**
 * Compact graph node: a type-coloured disc (severity ring + merge count) with a
 * short caption beneath. Small enough that 30+ nodes and their edges stay
 * legible — the full detail opens in the side panel on click.
 */
export function CivicGraphNode({ data, selected }: NodeProps) {
  const { graphNode } = data as CivicNodeData;
  const typeColor = nodeTypeColor(graphNode.type);
  const sev = graphNode.severity;
  const sevColor = sev ? severityColor(sev) : null;
  const showSev = sev === "high" || sev === "critical";
  const count = typeof graphNode.meta?.count === "number" ? (graphNode.meta.count as number) : 0;

  return (
    <div className="flex w-[124px] flex-col items-center">
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <div
        className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 bg-paper-card transition-all"
        style={{
          borderColor: typeColor,
          boxShadow: selected ? `0 0 0 4px ${typeColor}33` : "0 1px 4px rgba(21,36,47,0.18)",
        }}
      >
        <span className="h-4 w-4 rounded-full" style={{ background: typeColor }} />
        {showSev && sevColor ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-paper-card"
            style={{ background: sevColor }}
            title={sev ?? undefined}
          />
        ) : null}
        {count > 1 ? (
          <span className="absolute -bottom-1.5 -right-1.5 min-w-4 rounded-full bg-ink px-1 text-center text-[9px] font-bold leading-4 text-white">
            {count}
          </span>
        ) : null}
      </div>
      <span
        title={graphNode.label}
        className="mt-1.5 block max-w-[112px] truncate text-center text-[10px] font-medium leading-tight text-ink"
      >
        {graphNode.label}
      </span>
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
    </div>
  );
}
