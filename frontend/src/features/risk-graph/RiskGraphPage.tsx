import "./xyflow-styles.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type EdgeTypes,
  MarkerType,
  MiniMap,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { type GraphData, type GraphEdge, type GraphNode, type GraphSeverity, getGraphData } from "./api";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { CivicGraphNode } from "./components/CivicGraphNode";

// ── Condense: merge nodes that are exact duplicates (same type + label) ────────
// The backend emits many near-identical risk events; collapsing them into one
// node with a count removes the "repeated cards that read the same" noise and
// rewires their edges onto the surviving node.
function condense(data: GraphData): GraphData {
  const canonByKey = new Map<string, string>();
  const idMap = new Map<string, string>();
  const counts = new Map<string, number>();
  const nodes: GraphNode[] = [];

  for (const n of data.nodes) {
    const key = `${n.type}::${n.label.trim().toLowerCase()}`;
    const existing = canonByKey.get(key);
    if (existing) {
      idMap.set(n.id, existing);
      counts.set(existing, (counts.get(existing) ?? 1) + 1);
    } else {
      canonByKey.set(key, n.id);
      idMap.set(n.id, n.id);
      nodes.push(n);
    }
  }

  const withCounts = nodes.map((n) => {
    const c = counts.get(n.id) ?? 1;
    return c > 1 ? { ...n, meta: { ...n.meta, count: c } } : n;
  });

  const edgeSeen = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const e of data.edges) {
    const source = idMap.get(e.source) ?? e.source;
    const target = idMap.get(e.target) ?? e.target;
    if (source === target) continue; // self-loop from a merge
    const key = `${source}->${target}`;
    if (edgeSeen.has(key)) continue;
    edgeSeen.add(key);
    edges.push({ ...e, source, target });
  }

  return { nodes: withCounts, edges };
}

// ── Drop orphans: a risk graph is about relationships, so hide nodes that have
// no connections. Standalone items live in the list views; here they'd just be
// scattered noise. Falls back to all nodes if filtering would empty the graph.
function dropOrphans(data: GraphData): GraphData {
  const connected = new Set<string>();
  for (const e of data.edges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  const nodes = data.nodes.filter((n) => connected.has(n.id));
  return nodes.length >= 2 ? { nodes, edges: data.edges } : data;
}

// ── Component-packed layout ────────────────────────────────────────────────────
// The graph is a forest of small relationship clusters (a hub + its spokes:
// e.g. a narrative cluster → its risk event, an asset → its risk events). We
// lay out each connected component compactly as hub-and-spoke, then shelf-pack
// the components into tidy rows — far clearer than a force-scatter of pairs.
function layoutNodes(graphNodes: GraphNode[], graphEdges: GraphEdge[]): Node[] {
  const N = graphNodes.length;
  if (N === 0) return [];

  const index = new Map(graphNodes.map((n, i) => [n.id, i]));
  const adj: number[][] = graphNodes.map(() => []);
  const deg = new Array(N).fill(0);
  for (const e of graphEdges) {
    const a = index.get(e.source);
    const b = index.get(e.target);
    if (a == null || b == null || a === b) continue;
    adj[a].push(b); adj[b].push(a); deg[a]++; deg[b]++;
  }

  // connected components (BFS)
  const compId = new Array(N).fill(-1);
  const components: number[][] = [];
  for (let i = 0; i < N; i++) {
    if (compId[i] !== -1) continue;
    const id = components.length;
    const members: number[] = [];
    const queue = [i];
    compId[i] = id;
    while (queue.length) {
      const u = queue.shift() as number;
      members.push(u);
      for (const v of adj[u]) if (compId[v] === -1) { compId[v] = id; queue.push(v); }
    }
    components.push(members);
  }

  const pos: { x: number; y: number }[] = graphNodes.map(() => ({ x: 0, y: 0 }));
  const boxes: { members: number[]; w: number; h: number }[] = [];
  const PAD = 78; // node + label half-extent

  for (const members of components) {
    // hub = highest-degree node; spokes arranged around it
    let hub = members[0];
    for (const m of members) if (deg[m] > deg[hub]) hub = m;
    const spokes = members.filter((m) => m !== hub);
    const R = spokes.length <= 1 ? 150 : Math.max(150, spokes.length * 36);
    pos[hub] = { x: 0, y: 0 };
    spokes.forEach((m, si) => {
      const ang = spokes.length === 1 ? 0 : (si / spokes.length) * Math.PI * 2 - Math.PI / 2;
      pos[m] = { x: Math.cos(ang) * R, y: Math.sin(ang) * R };
    });
    const xs = members.map((m) => pos[m].x);
    const ys = members.map((m) => pos[m].y);
    const minX = Math.min(...xs) - PAD;
    const minY = Math.min(...ys) - PAD;
    for (const m of members) { pos[m].x -= minX; pos[m].y -= minY; }
    boxes.push({
      members,
      w: Math.max(...xs) - Math.min(...xs) + PAD * 2,
      h: Math.max(...ys) - Math.min(...ys) + PAD * 2,
    });
  }

  // shelf-pack components into rows (tallest first keeps rows even)
  boxes.sort((a, b) => b.h - a.h);
  const GAP = 56;
  const MAX_ROW = 1500;
  let cx = 0;
  let cy = 0;
  let rowH = 0;
  for (const box of boxes) {
    if (cx > 0 && cx + box.w > MAX_ROW) { cx = 0; cy += rowH + GAP; rowH = 0; }
    for (const m of box.members) { pos[m].x += cx; pos[m].y += cy; }
    cx += box.w + GAP;
    rowH = Math.max(rowH, box.h);
  }

  return graphNodes.map((n, i) => ({
    id: n.id,
    type: "civicNode",
    position: { x: Math.round(pos[i].x), y: Math.round(pos[i].y) },
    data: { graphNode: n },
    draggable: true,
  }));
}

function toFlowEdges(graphEdges: GraphEdge[]): Edge[] {
  return graphEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label || undefined,
    animated: false,
    style: { stroke: "#54707d", strokeWidth: 1.6, opacity: 0.85 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#54707d", width: 16, height: 16 },
    labelStyle: { fill: "#505962", fontSize: 10, fontWeight: 500 },
    labelBgStyle: { fill: "#f4ecdb", fillOpacity: 0.9 },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
  }));
}

const nodeTypes: NodeTypes = { civicNode: CivicGraphNode };
const edgeTypes: EdgeTypes = {};

// ReactFlow panel chrome — matches paper-card background + paper-line border from design tokens
const flowPanelStyle = {
  background: "#fcf9f2",       // paper-card
  border: "1px solid #e7dcc7", // paper-line
  borderRadius: 8,
};

function GraphCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  hasNodes,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeClick: (e: React.MouseEvent, node: Node) => void;
  hasNodes: boolean;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!hasNodes) return;
    const id = setTimeout(() => fitView({ padding: 0.16, duration: 500 }), 80);
    return () => clearTimeout(id);
  }, [hasNodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      minZoom={0.1}
      maxZoom={2}
      colorMode="light"
    >
      <Background color="#ddd0b8" gap={22} size={1} variant={BackgroundVariant.Dots} />
      <Controls
        position="top-right"
        style={flowPanelStyle}
        showFitView
        fitViewOptions={{ padding: 0.16, duration: 500 }}
      />
      <MiniMap
        position="bottom-right"
        nodeColor={(node) => nodeTypeColor((node.data as { graphNode: GraphNode }).graphNode.type)}
        nodeStrokeWidth={3}
        style={flowPanelStyle}
        maskColor="rgba(244,236,219,0.65)"
        zoomable
        pannable
      />
    </ReactFlow>
  );
}

export function RiskGraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setIsLoading(true);
    getGraphData()
      .then((data) => {
        const condensed = dropOrphans(condense(data));
        setGraphData(condensed);
        setNodes(layoutNodes(condensed.nodes, condensed.edges));
        setEdges(toFlowEdges(condensed.edges));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load graph."))
      .finally(() => setIsLoading(false));
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const gn = (node.data as { graphNode: GraphNode }).graphNode;
    setSelectedNode((prev) => (prev?.id === gn.id ? null : gn));
  }, []);

  if (isLoading) return <LoadingState label="Building risk graph" />;
  if (error) return <ErrorState message={error} />;

  const isEmpty = !graphData || graphData.nodes.length === 0;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="shrink-0">
        <h1 className="font-display text-xl font-semibold text-ink">Civic Risk Graph</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Connected view of assets, vulnerabilities, anomalies, narrative signals, and open risk
          events. Click a node to inspect it.
        </p>
        {graphData && (
          <p className="mt-1 text-xs text-ink-soft">
            {graphData.nodes.length} connected entities · {graphData.edges.length} relationships
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1.5">
        {[
          { type: "asset",         label: "Asset",             color: "#d65a29" },
          { type: "vulnerability", label: "Vulnerability",     color: "#cf9c46" },
          { type: "risk_event",    label: "Risk Event",        color: "#d6452f" },
          { type: "anomaly",       label: "Login Anomaly",     color: "#3f74c4" },
          { type: "cluster",       label: "Narrative Cluster", color: "#cf9c46" },
          { type: "dataset",       label: "High-risk Dataset", color: "#54707d" },
          { type: "incident",      label: "Incident",          color: "#d6452f" },
        ].map((l) => (
          <div key={l.type} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-xs text-ink-soft">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="relative flex min-h-0 flex-1 gap-4">
        <div className="flex-1 overflow-hidden rounded-xl border border-paper-line bg-paper">
          {isEmpty ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center">
                <p className="text-sm font-medium text-ink">Graph is empty</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  The graph populates as your modules produce risk events, anomalies, and
                  incidents. Run a scan or upload data to get started.
                </p>
              </div>
            </div>
          ) : (
            <ReactFlowProvider>
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                hasNodes={nodes.length > 0}
              />
            </ReactFlowProvider>
          )}
        </div>

        {selectedNode && <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
      </div>
    </div>
  );
}

export function nodeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    asset:         "#d65a29",
    vulnerability: "#cf9c46",
    risk_event:    "#d6452f",
    anomaly:       "#3f74c4",
    cluster:       "#cf9c46",
    dataset:       "#54707d",
    incident:      "#d6452f",
  };
  return colors[type] ?? "#54707d";
}

export function severityColor(sev: GraphSeverity): string {
  const colors: Record<string, string> = {
    critical: "#d6452f",
    high:     "#cf9c46",
    medium:   "#cf9c46",
    low:      "#3f74c4",
    info:     "#8a8273",
  };
  return sev ? (colors[sev] ?? "#8a8273") : "#8a8273";
}
