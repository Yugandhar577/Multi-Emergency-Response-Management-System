export interface PathResult {
  algorithm: string;
  feasible: boolean;
  total_weight: number;
  hops: number;
  path: number[];
  elapsed_us: number;
  relaxations: number;
  note: string;
}

export interface CompareRoutesRequest {
  source: number;
  destination: number;
  priority_corridors: boolean;
}

export interface CompareRoutesResponse {
  source: number;
  destination: number;
  priority_corridors: boolean;
  results: PathResult[];
}

export interface RunRouteRequest {
  source: number;
  destination: number;
  priority_corridors: boolean;
}
