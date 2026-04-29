import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';
import { MapCanvas } from '../components/MapCanvas';
import { CodeExcerpt } from '../components/ui/CodeExcerpt';
import { StepList } from '../components/ui/StepList';
import { ComplexityCard } from '../components/ui/ComplexityCard';
import { axios } from '../lib/axios';
import { useAreas, useEdges } from '../features/graph/hooks';

export function CriticalLab() {
  const { data: areas = [] } = useAreas();
  const { data: edges = [] } = useEdges();
  const [computing, setComputing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDetectCritical = async () => {
    setComputing(true);
    try {
      const res = await axios.get('/api/graph/critical');
      setResult(res.data);
    } catch (err) {
      console.error('Failed to detect critical structures:', err);
    } finally {
      setComputing(false);
    }
  };

  const criticalOverlays = result
    ? [
        {
          paths: [],
          color: '#8f3528',
          width: 5,
          dashed: '1 0',
          edgeIndices: result.bridges.map((b: any) => {
            return edges.findIndex(
              (edge: any) => (edge.u === b.u && edge.v === b.v) || (edge.u === b.v && edge.v === b.u)
            );
          }),
        },
      ]
    : [];

  const criticalAreas = result?.articulation_areas || [];

  return (
    <PageWrapper
      eyebrow="Unit II · Critical Structures"
      title="Tarjan's Algorithm: Bridges & Articulation Points"
      byline="Identify the critical roads and neighborhoods whose failure isolates parts of the network."
    >
      <div className="space-y-8">
        {/* Problem Section */}
        <div className="rise-1 space-y-4">
          <h2 className="display text-2xl text-ink">The Problem</h2>
          <p className="text-sm text-ink/70 max-w-2xl">
            A <strong>bridge</strong> is an edge whose removal increases the number of connected components. An <strong>articulation point</strong> (or cut vertex) is a vertex with the same property.
          </p>
          <p className="text-sm text-ink/70 max-w-2xl">
            Identifying these structures is crucial for resilience: satellite areas (Wagholi, Theur, Loni Kalbhor, Phursungi, Chakan) are deliberately reachable via single connectors. If that bridge fails, that zone isolates entirely. Routing through these areas requires redundancy planning.
          </p>
        </div>

        {/* Live Visualization */}
        <div className="rise-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="display text-lg text-ink">Live Visualization</h3>
            <Button
              variant="primary"
              size="md"
              onClick={handleDetectCritical}
              disabled={computing}
            >
              {computing ? 'Detecting...' : 'Detect Critical Edges'}
            </Button>
          </div>
          <MapCanvas areas={areas} edges={edges} height={400} overlays={criticalOverlays} />
          {result && (
            <div className="mt-4 border border-brass/40 bg-brass/5 rounded p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-medium text-ink text-sm mb-2">Bridges Found</div>
                  <div className="font-mono font-semibold text-lg text-ruby">{result.bridges.length}</div>
                </div>
                <div>
                  <div className="font-medium text-ink text-sm mb-2">Articulation Points</div>
                  <div className="font-mono font-semibold text-lg text-ruby">{criticalAreas.length}</div>
                </div>
              </div>
              <div className="text-xs text-ink/60 mt-3">
                Computed in {result.elapsed_us} µs
              </div>
            </div>
          )}

          {result?.bridges.length > 0 && (
            <div className="mt-4 border border-brass/40 bg-paper rounded p-4">
              <h4 className="font-medium text-sm text-ink mb-3">Critical Roads</h4>
              <div className="space-y-2 text-xs">
                {result.bridges.slice(0, 5).map((bridge: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-brass">✓</span>
                    <span className="text-ink/70">
                      {areas.find((a: any) => a.id === bridge.u)?.name || `Area ${bridge.u}`} ↔{' '}
                      {areas.find((a: any) => a.id === bridge.v)?.name || `Area ${bridge.v}`} (weight:{' '}
                      {bridge.weight})
                    </span>
                  </div>
                ))}
                {result.bridges.length > 5 && (
                  <div className="text-ink/50">... and {result.bridges.length - 5} more</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Algorithm Explanation */}
        <div className="rise-3 space-y-4">
          <h3 className="display text-lg text-ink">The Algorithm (DFS-based)</h3>
          <StepList
            steps={[
              {
                title: 'Run DFS from each unvisited vertex',
                body: 'Track discovery time disc[u] when first visited, and low[u] = lowest disc of any vertex reachable from u without using parent edge.',
              },
              {
                title: 'Update low values during recursion',
                body: 'On visiting neighbor v from u: if v unvisited, recurse and low[u] = min(low[u], low[v]). If v is ancestor, low[u] = min(low[u], disc[v]).',
              },
              {
                title: 'Identify bridges',
                body: 'Edge (u, v) is a bridge iff low[v] > disc[u]. The child v cannot reach above u without the parent edge.',
              },
              {
                title: 'Identify articulation points',
                body: 'Root is an AP iff it has ≥2 children. Non-root u is an AP iff it has child v with low[v] ≥ disc[u].',
              },
            ]}
          />
        </div>

        {/* Complexity */}
        <div className="rise-4">
          <ComplexityCard
            best="O(V + E)"
            average="O(V + E)"
            worst="O(V + E)"
            space="O(V)"
          />
          <p className="text-xs text-ink/70 mt-3">
            Single DFS pass visiting each vertex and edge once. Linear in the graph size.
          </p>
        </div>

        {/* Code */}
        <CodeExcerpt
          filename="core/src/tarjan.cpp (excerpt)"
          code={`struct CriticalResult {
    vector<int> bridge_edge_indices;
    vector<int> articulation_areas;
    long long elapsed_us;
};

void dfs(int u, int p, vector<int>& disc, vector<int>& low,
         int& timer, const Graph& g, vector<int>& bridges) {
    disc[u] = low[u] = timer++;
    for (int idx : g.adj(u)) {
        Edge e = g.edges()[idx];
        int v = (e.u == u) ? e.v : e.u;
        if (disc[v] == -1) {
            dfs(v, u, disc, low, timer, g, bridges);
            low[u] = min(low[u], low[v]);
            if (low[v] > disc[u]) {
                bridges.push_back(idx);  // Bridge found
            }
        } else if (v != p) {
            low[u] = min(low[u], disc[v]);  // Back edge
        }
    }
}

CriticalResult tarjan_bridges_articulations(const Graph& g) {
    auto start = chrono::high_resolution_clock::now();
    int n = g.areas().size();
    vector<int> disc(n, -1), low(n, -1);
    vector<int> bridges, articulations;
    int timer = 0;

    for (int i = 0; i < n; i++) {
        if (disc[i] == -1) {
            dfs(i, -1, disc, low, timer, g, bridges);
        }
    }

    auto end = chrono::high_resolution_clock::now();
    return {bridges, articulations, duration_cast<micros>(end - start).count()};
}`}
        />

        {/* Domain Rationale */}
        <div className="rise-5 border-l-4 border-ruby p-6 bg-ruby/5 rounded">
          <h4 className="font-medium text-ink mb-3">Domain Rationale: Satellite Area Resilience</h4>
          <p className="text-sm text-ink/70">
            In the Pune network, five satellite areas (Wagholi, Theur, Loni Kalbhor, Phursungi, Chakan) are deliberately reachable via single roads. These roads are bridges. If one fails, that satellite area is isolated. Emergency planners must pre-position resources, establish communication protocols, and design alternative transport (helicopter, rail) to handle such failures.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
