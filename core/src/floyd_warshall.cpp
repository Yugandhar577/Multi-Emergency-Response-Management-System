#include "core/algorithms.hpp"

#include <chrono>
#include <vector>

namespace emergency::algo {

FloydWarshallTable floyd_warshall(const Graph& g, bool priority_corridors) {
    auto t0 = std::chrono::steady_clock::now();
    int n = g.size();
    FloydWarshallTable t;
    t.dist.assign(n, std::vector<int>(n, INF));
    t.next_hop.assign(n, std::vector<int>(n, -1));
    for (int i = 0; i < n; ++i) {
        t.dist[i][i] = 0;
        t.next_hop[i][i] = i;
    }
    for (int u = 0; u < n; ++u) {
        for (const auto& adj : g.neighbors(u)) {
            int w = g.effective_weight(adj.edge_index, priority_corridors);
            // For undirected graphs we'll see each edge from both ends; keep min.
            if (w < t.dist[u][adj.to]) {
                t.dist[u][adj.to] = w;
                t.next_hop[u][adj.to] = adj.to;
            }
        }
    }
    for (int k = 0; k < n; ++k) {
        for (int i = 0; i < n; ++i) {
            if (t.dist[i][k] >= INF) continue;
            for (int j = 0; j < n; ++j) {
                if (t.dist[k][j] >= INF) continue;
                int cand = t.dist[i][k] + t.dist[k][j];
                if (cand < t.dist[i][j]) {
                    t.dist[i][j] = cand;
                    t.next_hop[i][j] = t.next_hop[i][k];
                }
            }
        }
    }
    t.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                       std::chrono::steady_clock::now() - t0).count();
    return t;
}

PathResult fw_query(const FloydWarshallTable& t, int source, int destination) {
    PathResult r;
    auto t0 = std::chrono::steady_clock::now();
    int n = (int)t.dist.size();
    if (source < 0 || source >= n || destination < 0 || destination >= n) {
        r.note = "invalid endpoints";
        return r;
    }
    if (t.dist[source][destination] >= INF) {
        r.note = "no path";
        return r;
    }
    int cur = source;
    int safety = n + 5;
    while (cur != destination && safety-- > 0) {
        r.path.push_back(cur);
        cur = t.next_hop[cur][destination];
        if (cur < 0) { r.path.clear(); r.note = "missing next-hop"; return r; }
    }
    r.path.push_back(destination);
    r.feasible = true;
    r.total_weight = t.dist[source][destination];
    r.hops = (int)r.path.size() - 1;
    r.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                       std::chrono::steady_clock::now() - t0).count();
    return r;
}

}  // namespace emergency::algo
