import { api } from "../../lib/api";

export type GraphNodeType =
  | "asset"
  | "risk_event"
  | "vulnerability"
  | "incident"
  | "anomaly"
  | "cluster"
  | "dataset";

export type GraphSeverity = "info" | "low" | "medium" | "high" | "critical" | null;

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  severity: GraphSeverity;
  meta: Record<string, unknown>;
  url: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function getGraphData(): Promise<GraphData> {
  return api.get<GraphData>("/api/graph/");
}
