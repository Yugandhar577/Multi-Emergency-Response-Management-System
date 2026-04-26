#include "core/algorithms.hpp"

#include <algorithm>
#include <chrono>
#include <vector>

namespace emergency::algo {

// Bellman-Ford relaxes every edge V-1 times. Tolerates negative weights -- so when
// priority corridors are toggled on (some edges become net-negative as an
// emergency-vehicle bonus), this is the correct algorithm to use. A final pass
// detects a negative cycle.
PathResult bellman_ford(const Graph& g, int source, int destination, bool priority_corridors) {
    PathResult r;
    auto t0 = std::chrono::steady_clock::now();
    int n = g.size();
    if (source < 0 || source >= n || destination < 0 || destination >= n) {
        r.note = "invalid endpoints";
        return r;
    }

    std::vector<int> dist(n, INF);
    std::vector<int> parent(n, -1);
    dist[source] = 0;

    int relax = 0;
    for (int i = 0; i < n - 1; ++i) {
        bool changed = false;
        for (int u = 0; u < n; ++u) {
            if (dist[u] >= INF) continue;
            for (const auto& adj : g.neighbors(u)) {
                int w = g.effective_weight(adj.edge_index, priority_corridors);
                relax++;
                if (dist[u] + w < dist[adj.to]) {
                    dist[adj.to] = dist[u] + w;
                    parent[adj.to] = u;
                    changed = true;
                }
            }
        }
        if (!changed) break;  // convergence early-exit
    }
    // Negative-cycle detection.
    for (int u = 0; u < n; ++u) {
        if (dist[u] >= INF) continue;
        for (const auto& adj : g.neighbors(u)) {
            int w = g.effective_weight(adj.edge_index, priority_corridors);
            if (dist[u] + w < dist[adj.to]) {
                r.note = "negative cycle reachable";
                r.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                                   std::chrono::steady_clock::now() - t0).count();
                r.relaxations = relax;
                return r;
            }
        }
    }

    r.relaxations = relax;
    r.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                       std::chrono::steady_clock::now() - t0).count();

    if (dist[destination] >= INF) {
        r.note = "no path";
        return r;
    }
    r.feasible = true;
    r.total_weight = dist[destination];
    for (int v = destination; v != -1; v = parent[v]) r.path.push_back(v);
    std::reverse(r.path.begin(), r.path.end());
    r.hops = (int)r.path.size() - 1;
    return r;
}

}  // namespace emergency::algo
