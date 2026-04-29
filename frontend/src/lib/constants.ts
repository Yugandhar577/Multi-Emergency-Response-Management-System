// Severity badge palette tied to editorial accents.
export const SEVERITY_BAND = (sev: number): { label: string; cls: string } => {
  if (sev >= 9) return { label: 'critical', cls: 'bg-ruby/95 text-paper' };
  if (sev >= 7) return { label: 'severe',   cls: 'bg-ruby/80 text-paper' };
  if (sev >= 5) return { label: 'elevated', cls: 'bg-brass/90 text-paper' };
  return { label: 'routine', cls: 'bg-moss/85 text-paper' };
};

export const CATEGORY_LABEL: Record<number, string> = {
  0: 'Medical',
  1: 'Fire',
  2: 'Police',
  3: 'Disaster',
  4: 'Hazmat',
};

export const STATUS_LABEL: Record<number, string> = {
  0: 'Pending',
  1: 'Assigned',
  2: 'Handled',
  3: 'En-route',
  4: 'On-scene',
};

export const STATUS_LIFECYCLE_ORDER = [0, 1, 3, 4, 2] as const;

export const ALGO_META = {
  dijkstra:        { label: 'Dijkstra',        complexity: 'O((V + E) log V)', color: '#8f3528' },
  astar:           { label: 'A*',              complexity: 'O(b^d) (heuristic-bounded)', color: '#35544d' },
  bellman_ford:    { label: 'Bellman-Ford',    complexity: 'O(V · E)', color: '#b88b3b' },
  floyd_warshall:  { label: 'Floyd-Warshall',  complexity: 'O(V³) precompute, O(V) query', color: '#171009' },
} as const;

export type AlgoKey = keyof typeof ALGO_META;
