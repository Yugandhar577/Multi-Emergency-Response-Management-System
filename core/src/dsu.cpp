#include "core/algorithms.hpp"

#include <chrono>

namespace emergency::algo {

ConnectivityReport connectivity_with_edge_removed(const Graph& g, int removed_edge_index) {
    auto t0 = std::chrono::steady_clock::now();
    int n = g.size();
    DSU dsu(n);
    for (int i = 0; i < (int)g.edges().size(); ++i) {
        if (i == removed_edge_index) continue;
        const Edge& e = g.edges()[i];
        dsu.unite(e.u, e.v);
    }
    ConnectivityReport rep;
    rep.component_id.assign(n, -1);
    int next_id = 0;
    std::vector<int> root_to_id(n, -1);
    std::vector<int> sizes;
    for (int i = 0; i < n; ++i) {
        int r = dsu.find(i);
        if (root_to_id[r] == -1) {
            root_to_id[r] = next_id++;
            sizes.push_back(0);
        }
        rep.component_id[i] = root_to_id[r];
        sizes[root_to_id[r]]++;
    }
    rep.component_count = next_id;
    for (int i = 0; i < n; ++i) {
        if (sizes[rep.component_id[i]] == 1) rep.isolated_areas.push_back(i);
    }
    rep.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                         std::chrono::steady_clock::now() - t0).count();
    return rep;
}

}  // namespace emergency::algo
