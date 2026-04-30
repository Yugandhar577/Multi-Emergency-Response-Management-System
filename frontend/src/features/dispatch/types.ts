export interface DispatchPair {
  incident_id: number;
  team_id: number;
  cost: number;
  path: number[];
}

export interface DispatchPlan {
  strategy: string;
  total_cost: number;
  elapsed_us: number;
  pairs: DispatchPair[];
  committed?: boolean;
}

export interface CompareDispatchResponse {
  strategies: DispatchPlan[];
}

export interface RunDispatchRequest {
  priority_corridors: boolean;
}

export interface ManualAssignRequest {
  team_id: number;
  algorithm: string; // dijkstra | astar | bellman_ford | floyd_warshall
  priority_corridors?: boolean;
}

export interface ManualAssignResponse {
  incident_id: number;
  team_id: number;
  algorithm: string;
  cost: number;
  path: number[];
  elapsed_us: number;
  committed: boolean;
}
