#include "core/algorithms.hpp"

#include <algorithm>
#include <chrono>
#include <queue>
#include <vector>

namespace emergency::algo {

// Min-cost max-flow using SPFA (Bellman-Ford queue) for shortest augmenting paths.
// Network:
//   source 0 -> team-node t_i with capacity = available_units, cost 0
//   t_i -> incident-node inc_j with capacity 1, cost = travel_distance
//   inc_j -> sink with capacity 1, cost 0
// Output flow gives the optimal assignment under team capacities.
namespace {

struct MCMFEdge {
    int to;
    int cap;
    int cost;
    int rev;       // index of reverse edge in graph[to]
};

class MCMFGraph {
public:
    explicit MCMFGraph(int n) : adj_(n) {}
    int size() const { return (int)adj_.size(); }
    void add(int u, int v, int cap, int cost) {
        MCMFEdge a{v, cap, cost, (int)adj_[v].size()};
        MCMFEdge b{u, 0, -cost, (int)adj_[u].size()};
        adj_[u].push_back(a);
        adj_[v].push_back(b);
    }
    std::vector<MCMFEdge>& edges_at(int u) { return adj_[u]; }
private:
    std::vector<std::vector<MCMFEdge>> adj_;
};

bool spfa(MCMFGraph& g, int s, int t,
          std::vector<int>& dist, std::vector<int>& in_node, std::vector<int>& in_edge) {
    int n = g.size();
    dist.assign(n, INF);
    in_node.assign(n, -1);
    in_edge.assign(n, -1);
    std::vector<bool> inq(n, false);
    std::queue<int> q;
    dist[s] = 0;
    q.push(s);
    inq[s] = true;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        inq[u] = false;
        auto& adj = g.edges_at(u);
        for (int i = 0; i < (int)adj.size(); ++i) {
            const auto& e = adj[i];
            if (e.cap > 0 && dist[u] + e.cost < dist[e.to]) {
                dist[e.to] = dist[u] + e.cost;
                in_node[e.to] = u;
                in_edge[e.to] = i;
                if (!inq[e.to]) {
                    q.push(e.to);
                    inq[e.to] = true;
                }
            }
        }
    }
    return dist[t] < INF;
}

}  // namespace

AssignmentPlan min_cost_max_flow(const CostMatrix& m,
                                 const std::vector<Team>& teams,
                                 const std::vector<Incident>& pending) {
    AssignmentPlan plan;
    plan.strategy = "min_cost_max_flow";
    auto t0 = std::chrono::steady_clock::now();

    int nT = m.n_teams;
    int nI = m.n_incidents;
    if (nT == 0 || nI == 0) {
        plan.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                              std::chrono::steady_clock::now() - t0).count();
        return plan;
    }

    int S = 0;
    int T_node = 1 + nT + nI;
    int total_nodes = T_node + 1;
    MCMFGraph g(total_nodes);

    // Track which adjacency-edge index corresponds to each (team, incident) pair so we can
    // check residual capacity afterward.
    std::vector<std::vector<int>> ti_edge_idx(nT, std::vector<int>(nI, -1));

    for (int i = 0; i < nT; ++i) {
        int cap = std::max(0, teams[i].available_units);
        if (cap > 0) g.add(S, 1 + i, cap, 0);
    }
    for (int j = 0; j < nI; ++j) {
        g.add(1 + nT + j, T_node, 1, 0);
    }
    for (int i = 0; i < nT; ++i) {
        for (int j = 0; j < nI; ++j) {
            if (m.cost[i][j] >= INF) continue;
            ti_edge_idx[i][j] = (int)g.edges_at(1 + i).size();
            g.add(1 + i, 1 + nT + j, 1, m.cost[i][j]);
        }
    }

    std::vector<int> dist, in_node, in_edge;
    while (spfa(g, S, T_node, dist, in_node, in_edge)) {
        int bottleneck = INF;
        for (int v = T_node; v != S; v = in_node[v]) {
            bottleneck = std::min(bottleneck, g.edges_at(in_node[v])[in_edge[v]].cap);
        }
        for (int v = T_node; v != S; v = in_node[v]) {
            auto& fwd = g.edges_at(in_node[v])[in_edge[v]];
            fwd.cap -= bottleneck;
            g.edges_at(v)[fwd.rev].cap += bottleneck;
        }
    }

    // Extract assignment: a (team i, incident j) edge with cap reduced by 1 was used.
    for (int i = 0; i < nT; ++i) {
        auto& adj = g.edges_at(1 + i);
        for (int j = 0; j < nI; ++j) {
            int eidx = ti_edge_idx[i][j];
            if (eidx < 0) continue;
            // edge originally cap=1 -> if used, cap is now 0
            if (adj[eidx].cap == 0) {
                AssignmentPlan::Pair pair;
                pair.incident_id = pending[j].id;
                pair.team_id = teams[i].id;
                pair.cost = m.cost[i][j];
                pair.path = m.path[i][j];
                plan.pairs.push_back(pair);
                plan.total_cost += pair.cost;
            }
        }
    }
    plan.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                          std::chrono::steady_clock::now() - t0).count();
    return plan;
}

}  // namespace emergency::algo
