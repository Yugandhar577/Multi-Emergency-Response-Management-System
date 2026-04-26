#include "core/algorithms.hpp"

#include <algorithm>
#include <chrono>
#include <queue>
#include <vector>

namespace emergency::algo {

PathResult dijkstra(const Graph& g, int source, int destination, bool priority_corridors) {
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

    using Pii = std::pair<int, int>;
    std::priority_queue<Pii, std::vector<Pii>, std::greater<Pii>> pq;
    pq.push(std::make_pair(0, source));

    int relax = 0;
    while (!pq.empty()) {
        Pii current = pq.top();
        int d = current.first;
        int u = current.second;
        pq.pop();
        if (d > dist[u]) continue;
        if (u == destination) break;
        for (const auto& adj : g.neighbors(u)) {
            int w = g.effective_weight(adj.edge_index, priority_corridors);
            // Dijkstra requires non-negative weights. With priority corridors enabled,
            // some edges may have w + bonus < 0. We still try, but flag the result.
            if (w < 0) {
                r.note = "negative-weight edge encountered (Dijkstra invalid)";
                // Continue to demonstrate the failure mode - distances may be wrong.
            }
            int nd = dist[u] + w;
            relax++;
            if (nd < dist[adj.to]) {
                dist[adj.to] = nd;
                parent[adj.to] = u;
                pq.push(std::make_pair(nd, adj.to));
            }
        }
    }
    r.relaxations = relax;
    r.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                       std::chrono::steady_clock::now() - t0).count();

    if (dist[destination] >= INF) {
        r.note = r.note.empty() ? "no path" : r.note;
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
