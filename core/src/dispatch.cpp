#include "core/algorithms.hpp"

#include <algorithm>
#include <chrono>
#include <queue>
#include <vector>

namespace emergency::algo {

CostMatrix build_cost_matrix(const Graph& g, const std::vector<Team>& teams,
                             const std::vector<Incident>& pending,
                             bool priority_corridors) {
    CostMatrix m;
    m.n_teams = (int)teams.size();
    m.n_incidents = (int)pending.size();
    m.cost.assign(m.n_teams, std::vector<int>(m.n_incidents, INF));
    m.path.assign(m.n_teams, std::vector<std::vector<int>>(m.n_incidents));

    for (int i = 0; i < m.n_teams; ++i) {
        // Run Dijkstra once per team home; cheaper than repeated full pairs.
        int n = g.size();
        std::vector<int> dist(n, INF);
        std::vector<int> parent(n, -1);
        int src = teams[i].home_area_id;
        if (src < 0 || src >= n) continue;
        dist[src] = 0;
        using Pii = std::pair<int, int>;
        std::priority_queue<Pii, std::vector<Pii>, std::greater<Pii>> pq;
        pq.push(std::make_pair(0, src));
        while (!pq.empty()) {
            Pii current = pq.top();
            int d = current.first;
            int u = current.second;
            pq.pop();
            if (d > dist[u]) continue;
            for (const auto& adj : g.neighbors(u)) {
                int w = g.effective_weight(adj.edge_index, priority_corridors);
                if (w < 0) w = 0; // Hungarian/MCMF expect non-negative; clamp here.
                int nd = dist[u] + w;
                if (nd < dist[adj.to]) {
                    dist[adj.to] = nd;
                    parent[adj.to] = u;
                    pq.push(std::make_pair(nd, adj.to));
                }
            }
        }
        for (int j = 0; j < m.n_incidents; ++j) {
            int target = pending[j].area_id;
            if (target < 0 || target >= n) continue;
            m.cost[i][j] = dist[target];
            if (dist[target] < INF) {
                std::vector<int> p;
                for (int v = target; v != -1; v = parent[v]) p.push_back(v);
                std::reverse(p.begin(), p.end());
                m.path[i][j] = std::move(p);
            }
        }
    }
    return m;
}

AssignmentPlan greedy_nearest(const Graph& g, const std::vector<Team>& teams,
                              const std::vector<Incident>& pending,
                              bool priority_corridors) {
    AssignmentPlan plan;
    plan.strategy = "greedy";
    auto t0 = std::chrono::steady_clock::now();

    CostMatrix m = build_cost_matrix(g, teams, pending, priority_corridors);
    std::vector<int> caps(teams.size());
    for (size_t i = 0; i < teams.size(); ++i) caps[i] = teams[i].available_units;

    // Process incidents by severity desc.
    std::vector<int> order(pending.size());
    for (size_t i = 0; i < pending.size(); ++i) order[i] = (int)i;
    std::sort(order.begin(), order.end(),
              [&](int a, int b) { return pending[a].severity > pending[b].severity; });

    for (int j : order) {
        int best_team = -1;
        int best_cost = INF;
        for (int i = 0; i < (int)teams.size(); ++i) {
            if (caps[i] <= 0) continue;
            if (m.cost[i][j] < best_cost) {
                best_cost = m.cost[i][j];
                best_team = i;
            }
        }
        if (best_team == -1) continue;
        caps[best_team]--;
        AssignmentPlan::Pair pair;
        pair.incident_id = pending[j].id;
        pair.team_id = teams[best_team].id;
        pair.cost = best_cost;
        pair.path = m.path[best_team][j];
        plan.pairs.push_back(pair);
        plan.total_cost += best_cost;
    }

    plan.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                          std::chrono::steady_clock::now() - t0).count();
    return plan;
}

}  // namespace emergency::algo
