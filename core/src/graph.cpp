#include "core/graph.hpp"

#include <cmath>

namespace emergency {

void Graph::set_areas(std::vector<Area> areas) {
    areas_ = std::move(areas);
    adjacency_.assign(areas_.size(), {});
    edges_.clear();
}

void Graph::add_edge(int u, int v, int weight, int bonus, bool priority) {
    if (u < 0 || v < 0 || u >= size() || v >= size()) return;
    Edge e{u, v, weight, bonus, priority};
    int idx = static_cast<int>(edges_.size());
    edges_.push_back(e);
    adjacency_[u].push_back({v, idx});
    adjacency_[v].push_back({u, idx});
}

double Graph::straight_line_km(int a, int b) const {
    if (a < 0 || b < 0 || a >= size() || b >= size()) return 0.0;
    constexpr double R = 6371.0;
    constexpr double D2R = 3.14159265358979323846 / 180.0;
    double lat1 = areas_[a].lat * D2R;
    double lat2 = areas_[b].lat * D2R;
    double dlat = lat2 - lat1;
    double dlng = (areas_[b].lng - areas_[a].lng) * D2R;
    double sa = std::sin(dlat / 2);
    double sb = std::sin(dlng / 2);
    double h = sa * sa + std::cos(lat1) * std::cos(lat2) * sb * sb;
    return 2 * R * std::asin(std::min(1.0, std::sqrt(h)));
}

}  // namespace emergency
