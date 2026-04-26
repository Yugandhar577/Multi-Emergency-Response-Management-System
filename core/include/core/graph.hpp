#pragma once

#include "types.hpp"

#include <unordered_map>
#include <vector>

namespace emergency {

// Adjacency-list graph with both base weights and "priority-corridor" bonus weights.
// Use effective_weight() to query with corridor toggle on/off.
class Graph {
public:
    Graph() = default;

    void set_areas(std::vector<Area> areas);
    void add_edge(int u, int v, int weight, int bonus = 0, bool priority = false);

    int size() const { return static_cast<int>(areas_.size()); }
    const Area& area(int id) const { return areas_[id]; }
    const std::vector<Area>& areas() const { return areas_; }
    const std::vector<Edge>& edges() const { return edges_; }

    struct Adj {
        int to;
        int edge_index;
    };
    const std::vector<Adj>& neighbors(int u) const { return adjacency_[u]; }

    // weight + (priority_corridors ? bonus : 0). Bonus is non-positive so total may go negative.
    int effective_weight(int edge_index, bool priority_corridors) const {
        const Edge& e = edges_[edge_index];
        return priority_corridors ? (e.weight + e.bonus) : e.weight;
    }

    // Haversine-ish flat-earth distance in km for use as A* heuristic.
    double straight_line_km(int a, int b) const;

private:
    std::vector<Area> areas_;
    std::vector<Edge> edges_;
    std::vector<std::vector<Adj>> adjacency_;
};

}  // namespace emergency
