import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';
import { MapCanvas } from '../components/MapCanvas';
import { CodeExcerpt } from '../components/ui/CodeExcerpt';
import { StepList } from '../components/ui/StepList';
import { ComplexityCard } from '../components/ui/ComplexityCard';
import { axios } from '../lib/axios';
import { useAreas, useEdges } from '../features/graph/hooks';

export function MstLab() {
  const { data: areas = [] } = useAreas();
  const { data: edges = [] } = useEdges();
  const [computing, setComputing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleComputeMST = async () => {
    setComputing(true);
    try {
      const res = await axios.get('/api/graph/mst');
      setResult(res.data);
    } catch (err) {
      console.error('Failed to compute MST:', err);
    } finally {
      setComputing(false);
    }
  };

  const mstOverlays = result
    ? [
        {
          paths: [],
          color: '#35544d',
          width: 6,
          dashed: '1 0',
          edgeIndices: result.edges.map((e: any) => {
            return edges.findIndex(
              (edge: any) => (edge.u === e.u && edge.v === e.v) || (edge.u === e.v && edge.v === e.u)
            );
          }),
        },
      ]
    : [];

  return (
    <PageWrapper
      eyebrow="Unit II · Spanning Trees"
      title="Kruskal's Minimum Spanning Tree"
      byline="Find the lowest-cost network backbone that connects all neighborhoods without cycles."
    >
      <div className="space-y-8">
        {/* Problem Section */}
        <div className="rise-1 space-y-4">
          <h2 className="display text-2xl text-ink">The Problem</h2>
          <p className="text-sm text-ink/70 max-w-2xl">
            An MST is a subset of edges connecting all vertices with minimum total weight and no cycles. In emergency planning, it represents the cheapest backbone of roads that keeps every neighborhood reachable.
          </p>
          <p className="text-sm text-ink/70 max-w-2xl">
            Closing any non-MST edge has zero connectivity impact. Closing an MST edge forces alternative routing or isolation.
          </p>
        </div>

        {/* Live Visualization */}
        <div className="rise-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="display text-lg text-ink">Live Visualization</h3>
            <Button
              variant="primary"
              size="md"
              onClick={handleComputeMST}
              disabled={computing}
            >
              {computing ? 'Computing...' : 'Compute MST'}
            </Button>
          </div>
          <MapCanvas areas={areas} edges={edges} height={400} overlays={mstOverlays} />
          {result && (
            <div className="mt-4 border border-brass/40 bg-brass/5 rounded p-4">
              <div className="font-mono font-semibold text-lg text-ink">
                Total Weight: {result.total_weight}
              </div>
              <div className="text-xs text-ink/60 mt-1">
                {result.edges.length} edges · Computed in {result.elapsed_us} µs
              </div>
            </div>
          )}
        </div>

        {/* Algorithm Explanation */}
        <div className="rise-3 space-y-4">
          <h3 className="display text-lg text-ink">The Algorithm</h3>
          <StepList
            steps={[
              {
                title: 'Sort all edges by weight (ascending)',
                body: 'In our 60-node Pune graph: 156 edges sorted smallest to largest.',
              },
              {
                title: 'Initialize Disjoint Set Union (DSU)',
                body: 'Each area starts as its own component with parent = self, rank = 0.',
              },
              {
                title: 'Iterate edges in sorted order',
                body: 'For each edge (u, v), if find(u) ≠ find(v), add to MST and union(u, v).',
              },
              {
                title: 'Stop when V−1 edges added',
                body: 'An MST of V vertices has exactly V−1 edges. We are done.',
              },
            ]}
          />
        </div>

        {/* Why DSU */}
        <div className="rise-4 border-l-4 border-moss p-6 bg-moss/5 rounded">
          <h4 className="font-medium text-ink mb-3">Why Disjoint Set Union?</h4>
          <p className="text-sm text-ink/70 mb-3">
            DSU (union-find) efficiently answers "are u and v in the same component?" and merges components. Each operation amortizes to nearly O(1) with path compression.
          </p>
          <div className="text-xs text-ink/70 space-y-2">
            <p>
              <strong>Path Compression:</strong> When you find an element's root, make every node on that path point directly to the root. Subsequent finds are O(1).
            </p>
            <div className="bg-paper border border-moss/40 p-3 font-mono text-xs mt-2">
              Tree before: A→B→C→root
              <br />
              Tree after find(A): A→root, B→root, C→root
            </div>
          </div>
        </div>

        {/* Complexity */}
        <div className="rise-5">
          <ComplexityCard
            best="O(E log E)"
            average="O(E log E)"
            worst="O(E log E)"
            space="O(V + E)"
          />
          <p className="text-xs text-ink/70 mt-3">
            Dominated by sorting. DSU operations with path compression are O(α(V)) ≈ O(1) per operation, where α is the inverse Ackermann function (virtually constant for all practical sizes).
          </p>
        </div>

        {/* Code */}
        <CodeExcerpt
          filename="core/src/kruskal_mst.cpp (excerpt)"
          code={`struct MSTResult {
    int total_weight;
    vector<int> chosen_edge_indices;
    long long elapsed_us;
};

MSTResult kruskal_mst(const Graph& g) {
    auto start = chrono::high_resolution_clock::now();
    int n = g.areas().size();
    auto edges = g.edges();

    // Create (weight, index) pairs and sort
    vector<pair<int, int>> sorted_edges;
    for (int i = 0; i < edges.size(); i++) {
        sorted_edges.push_back({edges[i].weight, i});
    }
    sort(sorted_edges.begin(), sorted_edges.end());

    DSU dsu(n);
    vector<int> chosen;
    int total = 0;

    for (auto [w, idx] : sorted_edges) {
        Edge e = edges[idx];
        if (dsu.find(e.u) != dsu.find(e.v)) {
            dsu.unite(e.u, e.v);
            chosen.push_back(idx);
            total += w;
            if (chosen.size() == n - 1) break;
        }
    }

    auto end = chrono::high_resolution_clock::now();
    return {total, chosen, duration_cast<micros>(end - start).count()};
}`}
        />

        {/* Domain Rationale */}
        <div className="rise-6 border-l-4 border-ruby p-6 bg-ruby/5 rounded">
          <h4 className="font-medium text-ink mb-3">Domain Rationale</h4>
          <p className="text-sm text-ink/70">
            In our 60-node Pune graph, the MST identifies the minimal backbone. If we had a fixed budget to maintain roads, we would maintain all 59 MST edges. Non-MST edges are optional for connectivity but may offer redundancy and faster alternate routes. The MST is often the first layer in resilience planning.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
