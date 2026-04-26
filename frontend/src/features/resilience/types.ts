export interface MSTResult {
  total_weight: number;
  elapsed_us: number;
  edges: Array<{
    id: number;
    u: number;
    v: number;
    weight: number;
  }>;
}

export interface CriticalResult {
  bridges: Array<{
    id: number;
    u: number;
    v: number;
    weight: number;
  }>;
  articulation_areas: number[];
  elapsed_us: number;
}

export interface ConnectivityResult {
  component_count: number;
  component_id: number[];
  isolated_areas: number[];
  elapsed_us: number;
}
