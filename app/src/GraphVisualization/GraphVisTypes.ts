
export interface SldCache {
  [graphKey: string]: number[];
}

export interface Dimensions {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface Node {
  id: number;
  group?: number;
  optionalLabel?: string;
}

export interface Edge {
  source: number;
  target: number;
  weight?: number;
  optionalLabel?: string;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  title: string;
  parameterized?: boolean;
}