#include "core/algorithms.hpp"

#include <algorithm>
#include <chrono>

namespace emergency::algo {

MSTResult kruskal_mst(const Graph& g) {
    MSTResult r;
    auto t0 = std::chrono::steady_clock::now();
    int n = g.size();

    // Index edges and sort copy by weight (use base weight for "backbone").
    std::vector<int> idx;
    idx.reserve(g.edges().size());
    for (int i = 0; i < (int)g.edges().size(); ++i) idx.push_back(i);
    std::sort(idx.begin(), idx.end(),
              [&](int a, int b) { return g.edges()[a].weight < g.edges()[b].weight; });

    DSU dsu(n);
    for (int i : idx) {
        const Edge& e = g.edges()[i];
        if (dsu.unite(e.u, e.v)) {
            r.chosen_edge_indices.push_back(i);
            r.total_weight += e.weight;
            if ((int)r.chosen_edge_indices.size() == n - 1) break;
        }
    }
    r.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                       std::chrono::steady_clock::now() - t0).count();
    return r;
}

}  // namespace emergency::algo
