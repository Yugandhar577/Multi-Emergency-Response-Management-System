import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';

const labSyllabus = [
  {
    unit: 'Graph routing',
    algorithms: [
      {
        name: 'Routing Comparison',
        path: '/lab/routing',
        algorithms: ['Dijkstra', 'A*', 'Bellman-Ford', 'Floyd-Warshall'],
        complexity: 'O((V+E) log V) to O(V^3)',
        motivation: 'Shows how the command center finds routes and why negative priority corridors need Bellman-Ford.',
      },
      {
        name: 'Spanning Trees',
        path: '/lab/mst',
        algorithms: ['Kruskal MST', 'DSU'],
        complexity: 'O(E log E)',
        motivation: 'Explains the minimum road backbone used in resilience planning.',
      },
      {
        name: 'Critical Structures',
        path: '/lab/critical',
        algorithms: ['Tarjan bridges', 'Articulation points'],
        complexity: 'O(V + E)',
        motivation: 'Identifies roads and areas whose failure can isolate neighborhoods.',
      },
    ],
  },
  {
    unit: 'Dispatch optimization',
    algorithms: [
      {
        name: 'Optimal Assignment',
        path: '/lab/assignment',
        algorithms: ['Greedy', 'Hungarian', 'Min-Cost Max-Flow'],
        complexity: 'O(T*I) to O(N^3)',
        motivation: 'Compares fast local assignment with globally optimal and capacity-aware dispatch.',
      },
      {
        name: 'Priority Queue',
        path: '/lab/heap',
        algorithms: ['Binary Min-Heap'],
        complexity: 'O(log n) per operation',
        motivation: 'Shows the heap structure used by Dijkstra, A*, and high-priority incident processing.',
      },
    ],
  },
];

export function LabGallery() {
  const navigate = useNavigate();

  return (
    <PageWrapper
      eyebrow="Algorithm proof layer"
      title="Algorithms Behind The Console"
      byline="Use these labs after the operations demo to explain the choices, complexity, and trade-offs behind each visible system decision."
    >
      <div className="space-y-12">
        {labSyllabus.map((unit) => (
          <div key={unit.unit}>
            <h2 className="display text-2xl text-ink mb-6">{unit.unit}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unit.algorithms.map((algo) => (
                <button
                  key={algo.path}
                  onClick={() => navigate(algo.path)}
                  className="border rounded-sm p-6 text-left transition-all border-brass/40 bg-paper hover:border-brass hover:shadow-sm"
                >
                  <h3 className="display text-lg text-ink mb-1">{algo.name}</h3>
                  <div className="text-xs text-brass font-medium mb-3 space-x-2">
                    {algo.algorithms.map((a) => (
                      <span key={a}>{a}</span>
                    ))}
                  </div>
                  <div className="font-mono text-xs text-ink/70 mb-2">{algo.complexity}</div>
                  <p className="text-sm text-ink/70">{algo.motivation}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
