#pragma once

#include "graph.hpp"
#include "types.hpp"

#include <utility>
#include <vector>

namespace emergency::algo {

// ============ Shortest path family ============

PathResult dijkstra(const Graph& g, int source, int destination, bool priority_corridors = false);
PathResult astar   (const Graph& g, int source, int destination, bool priority_corridors = false);
PathResult bellman_ford(const Graph& g, int source, int destination, bool priority_corridors = true);

// All-pairs precomputation. Reusable; compute once, query many times.
struct FloydWarshallTable {
    std::vector<std::vector<int>> dist;
    std::vector<std::vector<int>> next_hop;   // next_hop[i][j] = next vertex from i toward j, -1 if no path
    long long elapsed_us = 0;
};
FloydWarshallTable floyd_warshall(const Graph& g, bool priority_corridors = false);
PathResult fw_query(const FloydWarshallTable& t, int source, int destination);

// ============ Spanning tree + connectivity ============

struct MSTResult {
    std::vector<int> chosen_edge_indices;   // into g.edges()
    int total_weight = 0;
    long long elapsed_us = 0;
};
MSTResult kruskal_mst(const Graph& g);

class DSU {
public:
    explicit DSU(int n) : parent_(n), rank_(n, 0) {
        for (int i = 0; i < n; ++i) parent_[i] = i;
    }
    int find(int x) {
        while (parent_[x] != x) { parent_[x] = parent_[parent_[x]]; x = parent_[x]; }
        return x;
    }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (rank_[a] < rank_[b]) std::swap(a, b);
        parent_[b] = a;
        if (rank_[a] == rank_[b]) rank_[a]++;
        return true;
    }
    int components() const {
        int c = 0;
        for (int i = 0; i < (int)parent_.size(); ++i) if (parent_[i] == i) c++;
        return c;
    }
    int size() const { return (int)parent_.size(); }
private:
    std::vector<int> parent_;
    std::vector<int> rank_;
};

// Connectivity report: the set of components when a given edge_index is removed.
struct ConnectivityReport {
    int component_count = 1;
    std::vector<int> component_id;   // per area id, which component (0..component_count-1)
    std::vector<int> isolated_areas; // areas in components of size 1
    long long elapsed_us = 0;
};
ConnectivityReport connectivity_with_edge_removed(const Graph& g, int removed_edge_index);

// ============ Critical structures ============

struct CriticalStructures {
    std::vector<int> bridge_edge_indices;
    std::vector<int> articulation_areas;
    long long elapsed_us = 0;
};
CriticalStructures tarjan_bridges_articulations(const Graph& g);

// ============ Assignment ============

// Compute pairwise team-home -> incident-area shortest distance via Dijkstra-per-team.
struct CostMatrix {
    int n_teams = 0;
    int n_incidents = 0;
    std::vector<std::vector<int>> cost; // [team][incident]
    std::vector<std::vector<std::vector<int>>> path; // [team][incident] = path of area ids
};

CostMatrix build_cost_matrix(const Graph& g, const std::vector<Team>& teams,
                             const std::vector<Incident>& pending,
                             bool priority_corridors = false);

AssignmentPlan greedy_nearest(const Graph& g, const std::vector<Team>& teams,
                              const std::vector<Incident>& pending,
                              bool priority_corridors = false);

AssignmentPlan hungarian(const CostMatrix& m,
                         const std::vector<Team>& teams,
                         const std::vector<Incident>& pending);

// Min-cost max-flow with team capacity (a team unit serves one incident).
AssignmentPlan min_cost_max_flow(const CostMatrix& m,
                                 const std::vector<Team>& teams,
                                 const std::vector<Incident>& pending);

}  // namespace emergency::algo
