#include "core/algorithms.hpp"

#include <algorithm>
#include <chrono>

namespace emergency::algo {

// Iterative Tarjan: bridges + articulation points in one DFS.
// disc[u]   = discovery time
// low[u]    = lowest disc reachable from subtree of u using at most one back-edge
// Edge (u,v) is a bridge iff low[v] > disc[u].
// Vertex u is an AP iff
//   - u is root of DFS tree and has >=2 children, or
//   - u is non-root and has a child v with low[v] >= disc[u].
CriticalStructures tarjan_bridges_articulations(const Graph& g) {
    CriticalStructures out;
    auto t0 = std::chrono::steady_clock::now();
    int n = g.size();
    std::vector<int> disc(n, -1), low(n, -1), parent_edge(n, -1);
    std::vector<int> children_of_root(n, 0);
    std::vector<bool> ap(n, false);
    int timer = 0;

    // Iterative DFS to avoid stack overflow on big graphs.
    struct Frame {
        int u;
        int adj_idx;
        int parent_edge_index;
    };

    std::vector<Frame> stack;
    for (int s = 0; s < n; ++s) {
        if (disc[s] != -1) continue;
        disc[s] = low[s] = timer++;
        stack.push_back({s, 0, -1});
        while (!stack.empty()) {
            Frame& f = stack.back();
            const auto& adj = g.neighbors(f.u);
            if (f.adj_idx < (int)adj.size()) {
                int idx = f.adj_idx++;
                int v = adj[idx].to;
                int eidx = adj[idx].edge_index;
                if (eidx == f.parent_edge_index) continue;
                if (disc[v] == -1) {
                    if (f.u == s) children_of_root[s]++;
                    parent_edge[v] = eidx;
                    disc[v] = low[v] = timer++;
                    stack.push_back({v, 0, eidx});
                } else {
                    low[f.u] = std::min(low[f.u], disc[v]);
                }
            } else {
                int u = f.u;
                int peidx = f.parent_edge_index;
                stack.pop_back();
                if (!stack.empty()) {
                    Frame& pf = stack.back();
                    low[pf.u] = std::min(low[pf.u], low[u]);
                    if (low[u] > disc[pf.u]) {
                        out.bridge_edge_indices.push_back(peidx);
                    }
                    if (pf.u != s && low[u] >= disc[pf.u]) {
                        ap[pf.u] = true;
                    }
                }
            }
        }
        if (children_of_root[s] >= 2) ap[s] = true;
    }

    for (int i = 0; i < n; ++i) if (ap[i]) out.articulation_areas.push_back(i);
    std::sort(out.bridge_edge_indices.begin(), out.bridge_edge_indices.end());
    out.bridge_edge_indices.erase(
        std::unique(out.bridge_edge_indices.begin(), out.bridge_edge_indices.end()),
        out.bridge_edge_indices.end());

    out.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                         std::chrono::steady_clock::now() - t0).count();
    return out;
}

}  // namespace emergency::algo
