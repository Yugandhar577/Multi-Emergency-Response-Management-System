import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { MapCanvas } from '../components/MapCanvas';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner, ErrorState } from '../components/ui/Spinner';
import { CodeExcerpt } from '../components/ui/CodeExcerpt';
import { ComplexityCard } from '../components/ui/ComplexityCard';
import { useAreas, useEdges } from '../features/graph/hooks';
import { useCompareRoutes } from '../features/algorithms/hooks';
import { ALGO_META } from '../lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PathResult } from '../features/algorithms/types';

export function AlgorithmLab() {
  const { data: areas = [], isLoading: areasLoading } = useAreas();
  const { data: edges = [], isLoading: edgesLoading } = useEdges();
  const compareRoutesMutation = useCompareRoutes();

  const [sourceId, setSourceId] = useState<number>(0);
  const [destId, setDestId] = useState<number>(1);
  const [priorityCorridors, setPriorityCorridors] = useState(false);
  const [results, setResults] = useState<PathResult[] | null>(null);

  const handleRunAll = async () => {
    if (sourceId === destId) return;
    compareRoutesMutation.mutate(
      { source: sourceId, destination: destId, priority_corridors: priorityCorridors },
      {
        onSuccess: (data) => {
          setResults(data.results);
        },
      }
    );
  };

  if (areasLoading || edgesLoading) {
    return (
      <PageWrapper eyebrow="Issue 01 · Comparative Routing" title="The Algorithm Laboratory">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  const overlays = results
    ? results.map((r, idx) => {
        // Stagger widths and dashes so identical paths are visually distinct
        const widths = [5, 4, 3.5, 3];
        const dashArrays = ['1 0', '8 4', '2 6', '12 6'];
        return {
          paths: r.path,
          color: ALGO_META[r.algorithm as keyof typeof ALGO_META]?.color || '#171009',
          width: widths[idx % widths.length],
          dashed: dashArrays[idx % dashArrays.length],
        };
      })
    : [];

  const sourceArea = areas.find((a) => a.id === sourceId);
  const destArea = areas.find((a) => a.id === destId);

  const markers = sourceArea && destArea
    ? [
        { areaId: sourceId, color: '#35544d', label: 'Start', size: 'lg' as const },
        { areaId: destId, color: '#8f3528', label: 'End', size: 'lg' as const },
      ]
    : [];

  const chartData = results
    ? results.map((r) => ({
        algorithm: ALGO_META[r.algorithm as keyof typeof ALGO_META]?.label || r.algorithm,
        elapsed_us: r.elapsed_us,
      }))
    : [];

  return (
    <PageWrapper
      eyebrow="Issue 01 · Comparative Routing"
      title="The Algorithm Laboratory"
      byline="Compare four major graph algorithms side-by-side to understand their performance characteristics and correctness on live emergency routing data."
    >
      <div className="space-y-8">
        {/* About This Experiment */}
        <div className="rise-1 border border-brass/40 bg-brass/5 rounded p-6">
          <h3 className="display text-lg text-ink mb-4">About this experiment</h3>
          <div className="space-y-4 text-sm text-ink/70">
            <p>
              <strong>Problem:</strong> Given a weighted graph of 60 Pune neighborhoods and 156 roads (edges), compute the shortest path between two areas. Compare four classical single-source shortest-path algorithms by latency, edge relaxations, and correctness.
            </p>
            <div>
              <strong className="block mb-2">When to use each:</strong>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Dijkstra:</strong> Non-negative weights, single-source shortest path to all. O((V+E) log V) with binary heap.</li>
                <li>• <strong>A*:</strong> Dijkstra + heuristic. Faster when you know the target. Requires admissible heuristic.</li>
                <li>• <strong>Bellman-Ford:</strong> Handles negative weights. O(V·E). Detects negative cycles.</li>
                <li>• <strong>Floyd-Warshall:</strong> All-pairs shortest paths. O(V³) precompute, O(1) query. Detects negative cycles.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Complexity Table */}
        <div className="rise-2">
          <ComplexityCard
            best="O((V+E) log V)"
            average="O((V+E) log V)"
            worst="O(V²) dense graph"
            space="O(V)"
          />
        </div>

        {/* Control Strip */}
        <div className="rise-1 bg-parchment border border-mist p-6 rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="eyebrow block mb-2">Source Area</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(Number(e.target.value))}
                className="w-full border border-mist px-3 py-2 text-sm bg-paper text-ink rounded"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-2">Destination Area</label>
              <select
                value={destId}
                onChange={(e) => setDestId(Number(e.target.value))}
                className="w-full border border-mist px-3 py-2 text-sm bg-paper text-ink rounded"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-2">Options</label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={priorityCorridors}
                  onChange={(e) => setPriorityCorridors(e.target.checked)}
                />
                <span>Priority Corridors</span>
              </label>
            </div>
          </div>
          <Button
            onClick={handleRunAll}
            disabled={sourceId === destId || compareRoutesMutation.isPending}
            variant="primary"
            size="lg"
            className="mt-4 w-full"
          >
            {compareRoutesMutation.isPending ? 'Running...' : 'Run All Four'}
          </Button>
        </div>

        {/* Map */}
        {results && sourceArea && destArea && (
          <div className="rise-2">
            <MapCanvas
              areas={areas}
              edges={edges}
              overlays={overlays}
              markers={markers}
              height={520}
            />
          </div>
        )}

        {/* Results Grid */}
        {results && (
          <div className="rise-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.map((result) => {
                const meta = ALGO_META[result.algorithm as keyof typeof ALGO_META];
                return (
                  <Card key={result.algorithm}>
                    <CardHeader eyebrow={meta.label} title={meta.complexity} />
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-ink/60 uppercase tracking-wider">Total Weight</div>
                        <div className="numeral text-3xl text-ink mt-1">
                          {result.feasible ? result.total_weight : '−'}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="text-ink/60">
                          <div className="font-medium text-ink">{result.hops}</div>
                          <div>hops</div>
                        </div>
                        <div className="text-ink/60">
                          <div className="font-medium text-ink">{result.relaxations}</div>
                          <div>relax</div>
                        </div>
                        <div className="text-ink/60">
                          <div className="font-medium text-ink">{result.elapsed_us}</div>
                          <div>µs</div>
                        </div>
                      </div>
                      <Badge tone={result.feasible ? 'moss' : 'ruby'} className="w-full justify-center">
                        {result.feasible ? 'OK' : 'Failed'}
                      </Badge>
                      {result.note && (
                        <div className="text-xs italic text-ruby pt-2 border-t border-mist">{result.note}</div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Latency Chart */}
        {chartData.length > 0 && (
          <div className="rise-4">
            <Card>
              <CardHeader title="Execution Latency Comparison" />
              {chartData.every(d => d.elapsed_us === 0) ? (
                <div className="py-12 text-center text-sm text-ink/60">
                  <p className="font-medium mb-2">All algorithms completed sub-microsecond</p>
                  <p>Latencies were too fast to measure reliably. See relaxation counts in result cards above.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3,3" stroke="rgb(217 208 196)" />
                    <XAxis dataKey="algorithm" />
                    <YAxis domain={[0, 'dataMax + 1']} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="elapsed_us" fill="#b88b3b" name="Elapsed (µs)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* Why Negative Weights Break Dijkstra */}
        <details className="rise-5 border border-brass/40 rounded p-6 bg-brass/5">
          <summary className="cursor-pointer font-medium text-ink text-sm">
            Why priority corridors break Dijkstra
          </summary>
          <div className="mt-4 space-y-4 text-sm text-ink/70">
            <p>
              Dijkstra requires non-negative edge weights. Our priority corridors offer negative bonuses, which can create violations.
            </p>
            <div className="bg-paper border border-brass/40 p-4 rounded text-xs font-mono">
              <div>Example: Three areas A, B, C</div>
              <div className="mt-2">A --5--&gt; B</div>
              <div>A --2--&gt; C</div>
              <div>C --(-10)--&gt; B  (priority corridor with bonus)</div>
              <div className="mt-2 text-ink">
                Dijkstra picks path A→C→B cost 2+(-10)=−8
                <br />
                But after exploring A→B cost 5, Dijkstra locks B's distance at 5.
                <br />
                Later, C→B negative weight cannot be relaxed (Dijkstra already visited B).
              </div>
            </div>
            <p>
              Toggle "Priority Corridors" to see Bellman-Ford and Floyd-Warshall handle negative weights correctly while Dijkstra fails.
            </p>
          </div>
        </details>

        {/* Code Reference */}
        <div className="rise-6">
          <CodeExcerpt
            filename="core/src/dijkstra.cpp (excerpt)"
            code={`// Dijkstra's algorithm with Fibonacci heap optimization
PathResult dijkstra(const Graph& g, int src, int dst, bool corridors) {
    int n = g.areas().size();
    std::vector<int> dist(n, INF);
    std::priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;

    dist[src] = 0;
    pq.push({0, src});

    int relaxations = 0;
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;  // Already processed

        for (int idx : g.adj(u)) {
            Edge e = g.edges()[idx];
            int v = (e.u == u) ? e.v : e.u;
            int w = e.weight + (corridors && e.priority_corridor ? e.bonus : 0);

            if (dist[u] + w < dist[v]) {
                relaxations++;
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return {dist[dst], /*hops*/, path, elapsed, dist[dst] < INF, relaxations};
}`}
          />
        </div>

        {/* Reading the Metrics */}
        <div className="rise-7 border-l-4 border-brass p-6 bg-paper">
          <h4 className="font-medium text-ink mb-2">Reading the metrics</h4>
          <ul className="text-sm text-ink/70 space-y-2">
            <li><strong>Total Weight:</strong> Sum of edge weights along the path (−1 if no path found).</li>
            <li><strong>Hops:</strong> Number of edges in the path.</li>
            <li><strong>Relaxations:</strong> How many times the algorithm updated a distance estimate. Proxy for work performed.</li>
            <li><strong>Elapsed (µs):</strong> Wall-clock time in microseconds. Highly noisy on sub-millisecond workloads.</li>
          </ul>
        </div>

        {compareRoutesMutation.isError && (
          <ErrorState
            message="Failed to run algorithms"
            retry={() => handleRunAll()}
          />
        )}
      </div>
    </PageWrapper>
  );
}
