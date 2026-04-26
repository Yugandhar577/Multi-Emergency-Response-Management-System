#include "core/algorithms.hpp"

#include <algorithm>
#include <chrono>
#include <queue>
#include <vector>

namespace emergency::algo {

// Haversine straight-line km is admissible if road weights are roughly proportional to
// distance (which our seed satisfies). Multiplied by a small factor so the heuristic
// stays admissible relative to the fabricated minute-units.
PathResult astar(const Graph& g, int source, int destination, bool priority_corridors) {
    PathResult r;
    auto t0 = std::chrono::steady_clock::now();
    int n = g.size();
    if (source < 0 || source >= n || destination < 0 || destination >= n) {
        r.note = "invalid endpoints";
        return r;
    }

    auto h = [&](int u) {
        // 1.0 minute/km is conservative & admissible vs base weights of ~3-12 minutes for short links.
        return g.straight_line_km(u, destination) * 1.0;
    };

    std::vector<double> g_score(n, DINF);
    std::vector<int> parent(n, -1);
    g_score[source] = 0.0;

    using Node = std::pair<double, int>;
    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> open;
    open.push(std::make_pair(h(source), source));

    int relax = 0;
    while (!open.empty()) {
        Node current = open.top();
        double f = current.first;
        int u = current.second;
        open.pop();
        if (u == destination) break;
        if (f > g_score[u] + h(u) + 1e-9) continue;
        for (const auto& adj : g.neighbors(u)) {
            int w = g.effective_weight(adj.edge_index, priority_corridors);
            double tentative = g_score[u] + (double)w;
            relax++;
            if (tentative < g_score[adj.to]) {
                g_score[adj.to] = tentative;
                parent[adj.to] = u;
                open.push(std::make_pair(tentative + h(adj.to), adj.to));
            }
        }
    }
    r.relaxations = relax;
    r.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                       std::chrono::steady_clock::now() - t0).count();

    if (g_score[destination] >= DINF) {
        r.note = "no path";
        return r;
    }
    r.feasible = true;
    r.total_weight = (int)g_score[destination];
    for (int v = destination; v != -1; v = parent[v]) r.path.push_back(v);
    std::reverse(r.path.begin(), r.path.end());
    r.hops = (int)r.path.size() - 1;
    return r;
}

}  // namespace emergency::algo
