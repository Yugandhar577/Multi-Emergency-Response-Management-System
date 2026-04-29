import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';

const labSyllabus = [
  {
    unit: 'Unit II — Graphs',
    algorithms: [
      {
        name: 'Routing',
        path: '/lab/routing',
        algorithms: ['Dijkstra', 'A*', 'Bellman-Ford', 'Floyd-Warshall'],
        complexity: 'O((V+E)log V) to O(V³)',
        motivation: 'Shortest path in weighted road networks with priority corridors',
      },
      {
        name: 'Spanning Trees',
        path: '/lab/mst',
        algorithms: ['Kruskal MST'],
        complexity: 'O(E log E)',
        motivation: 'Minimum-cost backbone connecting all neighborhoods',
      },
      {
        name: 'Critical Structures',
        path: '/lab/critical',
        algorithms: ['Tarjan Bridges & APs'],
        complexity: 'O(V + E)',
        motivation: 'Identify critical roads and areas whose failure isolates the network',
      },
    ],
  },
  {
    unit: 'Unit III — Heaps',
    algorithms: [
      {
        name: 'Priority Queue',
        path: '/lab/heap',
        algorithms: ['Binary Min-Heap'],
        complexity: 'O(log n) per operation',
        motivation: 'Efficiently process incidents by priority within algorithms like Dijkstra',
      },
    ],
  },
  {
    unit: 'Unit V — Greedy & DP',
    algorithms: [
      {
        name: 'Optimal Assignment',
        path: '/lab/assignment',
        algorithms: ['Greedy', 'Hungarian', 'Min-Cost Max-Flow'],
        complexity: 'O(T·I) to O(N³)',
        motivation: 'Assign teams to incidents minimizing total travel distance',
      },
    ],
  },
  {
    unit: 'Unit I — Trees',
    algorithms: [
      {
        name: 'AVL & Red-Black Trees',
        locked: true,
        complexity: 'O(log n)',
        motivation: 'Self-balancing search structures',
      },
    ],
  },
  {
    unit: 'Unit IV — Divide & Conquer',
    algorithms: [
      {
        name: 'Sorting Comparison',
        locked: true,
        complexity: 'O(n log n)',
        motivation: 'Quicksort vs Mergesort performance analysis',
      },
    ],
  },
  {
    unit: 'Unit VI — Backtracking',
    algorithms: [
      {
        name: 'Graph Problems',
        locked: true,
        complexity: 'Exponential worst-case',
        motivation: 'Graph coloring and constraint satisfaction',
      },
    ],
  },
];

export function LabGallery() {
  const navigate = useNavigate();

  return (
    <PageWrapper
      eyebrow="Algorithm Laboratory"
      title="Syllabus & Algorithms"
      byline="Select an algorithm to inspect proofs, complexity analysis, and live visualization on the Pune emergency network."
    >
      <div className="space-y-12">
        {labSyllabus.map((unit) => (
          <div key={unit.unit}>
            <h2 className="display text-2xl text-ink mb-6">{unit.unit}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unit.algorithms.map((algo, i) => (
                <button
                  key={i}
                  onClick={() => (algo as any).path && navigate((algo as any).path)}
                  disabled={(algo as any).locked}
                  className={`border rounded-sm p-6 text-left transition-all ${
                    (algo as any).locked
                      ? 'border-mist bg-mist/20 opacity-60 cursor-not-allowed'
                      : 'border-brass/40 bg-paper hover:border-brass hover:shadow-sm'
                  }`}
                >
                  <h3 className="display text-lg text-ink mb-1">{algo.name}</h3>
                  {(algo as any).algorithms && (
                    <div className="text-xs text-brass font-medium mb-3 space-x-2">
                      {(algo as any).algorithms.map((a: string) => (
                        <span key={a}>{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="font-mono text-xs text-ink/70 mb-2">{algo.complexity}</div>
                  <p className="text-sm text-ink/70">{algo.motivation}</p>
                  {(algo as any).locked && (
                    <div className="text-xs text-ink/50 mt-3 font-medium">Coming soon</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
