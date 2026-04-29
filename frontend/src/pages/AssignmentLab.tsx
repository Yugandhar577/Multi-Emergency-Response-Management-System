import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';
import { CodeExcerpt } from '../components/ui/CodeExcerpt';
import { ComplexityCard } from '../components/ui/ComplexityCard';
import { axios } from '../lib/axios';
import { useAreas } from '../features/graph/hooks';
import { useIncidents } from '../features/incidents/hooks';
import { useTeams } from '../features/teams/hooks';

export function AssignmentLab() {
  const { data: areas = [] } = useAreas();
  const { data: incidents = [] } = useIncidents();
  const { data: teams = [] } = useTeams();
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCompare = async () => {
    setComparing(true);
    try {
      const res = await axios.post('/api/dispatch/compare');
      setResult(res.data);
    } catch (err) {
      console.error('Failed to compare strategies:', err);
    } finally {
      setComparing(false);
    }
  };

  const pendingIncidents = incidents.filter((i: any) => i.status === 0);

  return (
    <PageWrapper
      eyebrow="Algorithm proof layer / Assignment"
      title="The Hungarian Algorithm & Network Flow"
      byline="Explain why the dispatch screen compares fast greedy assignment with optimal matching and capacity-aware flow."
    >
      <div className="space-y-8">
        {/* Problem Section */}
        <div className="rise-1 space-y-4">
          <h2 className="display text-2xl text-ink">The Problem</h2>
          <p className="text-sm text-ink/70 max-w-2xl">
            Given T teams and I pending incidents, find the assignment minimizing total route cost subject to team capacity constraints. This is a maximum weighted bipartite matching problem, or equivalently, a min-cost max-flow problem.
          </p>
          <p className="text-sm text-ink/70 max-w-2xl">
            Three strategies: Greedy (nearest available), Hungarian (optimal for small instances), and MCMF (optimal for general instances).
          </p>
        </div>

        {/* Live Comparison */}
        <div className="rise-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="display text-lg text-ink">Live Comparison</h3>
            <Button
              variant="primary"
              size="md"
              onClick={handleCompare}
              disabled={comparing || pendingIncidents.length === 0}
            >
              {comparing ? 'Comparing...' : 'Compare Strategies'}
            </Button>
          </div>

          {pendingIncidents.length === 0 && (
            <div className="border border-mist bg-mist/20 rounded p-6 text-center text-sm text-ink/60">
              No pending incidents to assign. File some incidents in the Operations section to see dispatch comparisons.
            </div>
          )}

          {result && (
            <div className="grid grid-cols-3 gap-4">
              {result.strategies.map((strategy: any, i: number) => {
                const strategyNames = ['Greedy', 'Hungarian', 'Min-Cost Max-Flow'];
                const costMap = ['greedy', 'hungarian', 'mcmf'];
                const winner = result.strategies.reduce(
                  (min: any, s: any) => (s.total_cost < min.total_cost ? s : min)
                );
                const isWinner = strategy.total_cost === winner.total_cost;

                return (
                  <div
                    key={i}
                    className={`border rounded-sm p-4 transition-all ${
                      isWinner ? 'border-moss/60 bg-moss/5' : 'border-ink/10'
                    }`}
                  >
                    <div className="eyebrow mb-2">{strategyNames[i]}</div>
                    <div className="display text-2xl text-ink mb-4">{strategy.total_cost}</div>
                    <div className="space-y-2 text-xs text-ink/60 mb-4">
                      <div>Elapsed: {strategy.elapsed_us} us</div>
                      <div>Pairs: {strategy.pairs.length}</div>
                    </div>
                    {isWinner && (
                      <div className="inline-block px-2 py-1 bg-moss text-paper text-xs font-medium rounded-sm">
                        Optimal
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Algorithm Explanations */}
        <div className="rise-3 space-y-6">
          <div>
            <h4 className="font-medium text-ink mb-2">Greedy: Nearest Available</h4>
            <p className="text-sm text-ink/70 mb-2">
              For each incident (in priority order), assign the nearest available team. O(I·T log T). Can produce suboptimal matchings when two teams are equidistant to two incidents.
            </p>
            <ComplexityCard
              best="O(I·T)"
              average="O(I·T log T)"
              worst="O(I·T log T)"
              space="O(T)"
            />
          </div>

          <div className="border-t border-ink/10 pt-6">
            <h4 className="font-medium text-ink mb-2">Hungarian Algorithm</h4>
            <p className="text-sm text-ink/70 mb-2">
              Uses the method of augmenting paths and potentials to find the minimum-cost perfect matching in O(n³). Guarantees optimality for bipartite graphs up to min(T, I) pairs.
            </p>
            <ComplexityCard
              best="O(n³)"
              average="O(n³)"
              worst="O(n³)"
              space="O(n²)"
            />
          </div>

          <div className="border-t border-ink/10 pt-6">
            <h4 className="font-medium text-ink mb-2">Min-Cost Max-Flow (MCMF)</h4>
            <p className="text-sm text-ink/70 mb-2">
              Frames assignment as a flow network. Source connects to teams (capacity = units available), teams to incidents (cost = shortest path), incidents to sink (demand = 1). Finds min-cost flow equal to min(I, total capacity). Works for general T, I.
            </p>
            <ComplexityCard
              best="O(T·I·log(T·I))"
              average="O(T·I·log(T·I))"
              worst="O(T·I²·log(T·I))"
              space="O(T·I)"
            />
          </div>
        </div>

        {/* When Does Hungarian Beat Greedy */}
        <div className="rise-4 border-l-4 border-brass p-6 bg-brass/5 rounded">
          <h4 className="font-medium text-ink mb-3">When Does Hungarian Beat Greedy?</h4>
          <p className="text-sm text-ink/70 mb-3">
            Consider two teams T1, T2 both 5 units from incident A, and T1 is 2 units from B while T2 is 100 units from B.
          </p>
          <ul className="text-sm text-ink/70 space-y-2">
            <li>
              <strong>Greedy:</strong> Picks T1 to A (cost 5). Then assigns T2 to B (cost 100). Total: 105.
            </li>
            <li>
              <strong>Hungarian:</strong> Recognizes the global optimum: T2 to A (cost 5) + T1 to B (cost 2). Total: 7.
            </li>
          </ul>
        </div>

        {/* Code */}
        <CodeExcerpt
          filename="core/src/dispatch.cpp (excerpt)"
          code={`// Greedy dispatcher
AssignmentPlan greedy_nearest(const Graph& g, const vector<Team>& teams,
                              const vector<Incident>& incidents, bool corridors) {
    auto start = high_resolution_clock::now();
    AssignmentPlan plan;

    for (const auto& inc : incidents) {
        int best_team = -1, best_cost = INF;
        for (const auto& team : teams) {
            if (team.available_units <= 0) continue;
            auto path = dijkstra(g, team.home_area_id, inc.area_id, corridors);
            if (path.feasible && path.total_weight < best_cost) {
                best_cost = path.total_weight;
                best_team = team.id;
            }
        }
        if (best_team >= 0) {
            plan.pairs.push_back({inc.id, best_team, best_cost, path});
            plan.total_cost += best_cost;
        }
    }

    auto end = high_resolution_clock::now();
    plan.elapsed_us = duration_cast<micros>(end - start).count();
    plan.strategy = "greedy";
    return plan;
}`}
        />

        {/* Domain Rationale */}
        <div className="rise-5 border-l-4 border-ruby p-6 bg-ruby/5 rounded">
          <h4 className="font-medium text-ink mb-3">Domain Rationale</h4>
          <p className="text-sm text-ink/70">
            During a surge (multiple simultaneous incidents), Hungarian or MCMF ensures no team is locked into a suboptimal assignment. Greedy works well for routine dispatching but breaks under load. Modern emergency systems run MCMF-based dispatchers; it's worth the O(n³) cost to guarantee system-wide optimality under peak demand.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
