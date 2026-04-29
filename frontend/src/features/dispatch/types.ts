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
