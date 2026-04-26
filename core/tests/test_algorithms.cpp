// Lightweight self-checking tests for the 10 algorithms. Returns non-zero on failure.
#include "core/algorithms.hpp"
#include "core/seed.hpp"

#include <cstdio>
#include <cstdlib>
#include <iostream>
#include <string>

using namespace emergency;

#define CHECK(cond, msg) do { \
    if (!(cond)) { std::fprintf(stderr, "FAIL: %s @ %s:%d\n", msg, __FILE__, __LINE__); return 1; } \
    else { std::printf("ok: %s\n", msg); } \
} while (0)

int main() {
    Graph g = seed::build_pune_graph();
    CHECK(g.size() == 60, "graph has 60 nodes");
    CHECK(g.edges().size() > 80, "graph has many edges");

    // 1. Dijkstra
    auto d1 = algo::dijkstra(g, 0, 31, false); // Baner -> Hadapsar
    CHECK(d1.feasible, "dijkstra feasible Baner->Hadapsar");
    CHECK(d1.path.front() == 0 && d1.path.back() == 31, "dijkstra path endpoints");

    // 2. A*
    auto a1 = algo::astar(g, 0, 31, false);
    CHECK(a1.feasible, "astar feasible");
    CHECK(a1.total_weight == d1.total_weight, "astar matches dijkstra weight");

    // 3. Bellman-Ford (no negatives -> same answer)
    auto b1 = algo::bellman_ford(g, 0, 31, false);
    CHECK(b1.feasible, "bf feasible");
    CHECK(b1.total_weight == d1.total_weight, "bf matches dijkstra (no negatives)");

    // 3b. Bellman-Ford with priority corridors (negatives allowed)
    auto b2 = algo::bellman_ford(g, 15, 49, true); // Shivajinagar -> Swargate (corridor edge)
    CHECK(b2.feasible, "bf feasible with corridors");

    // 4. Floyd-Warshall
    auto fw = algo::floyd_warshall(g, false);
    CHECK((int)fw.dist.size() == 60, "fw dist 60x60");
    auto fwq = algo::fw_query(fw, 0, 31);
    CHECK(fwq.feasible && fwq.total_weight == d1.total_weight, "fw query matches dijkstra");

    // 5. Kruskal MST
    auto mst = algo::kruskal_mst(g);
    CHECK((int)mst.chosen_edge_indices.size() == g.size() - 1 ||
          (int)mst.chosen_edge_indices.size() < g.size(),
          "mst edge count <= n-1");
    CHECK(mst.total_weight > 0, "mst total weight positive");

    // 6. DSU connectivity probe (no edge removed -> 1 component for connected graph)
    auto rep = algo::connectivity_with_edge_removed(g, -1);
    CHECK(rep.component_count >= 1, "connectivity components >=1");

    // 7. Tarjan
    auto crit = algo::tarjan_bridges_articulations(g);
    CHECK(!crit.bridge_edge_indices.empty(), "tarjan finds at least one bridge");

    // Removing a bridge should split the graph.
    int br = crit.bridge_edge_indices.front();
    auto rep2 = algo::connectivity_with_edge_removed(g, br);
    CHECK(rep2.component_count >= 2, "removing bridge splits graph");

    // 8/9/10. Dispatch family
    auto teams = seed::seed_teams();
    auto pending_all = seed::seed_incidents();
    std::vector<Incident> pending;
    for (auto& e : pending_all) if (e.status == IncidentStatus::Pending) pending.push_back(e);
    CHECK(!teams.empty() && !pending.empty(), "seed pending and teams populated");

    auto greedy = algo::greedy_nearest(g, teams, pending, false);
    CHECK(!greedy.pairs.empty(), "greedy assigns at least one");

    auto cm = algo::build_cost_matrix(g, teams, pending, false);
    auto hung = algo::hungarian(cm, teams, pending);
    CHECK(!hung.pairs.empty(), "hungarian assigns");
    CHECK(hung.total_cost <= greedy.total_cost,
          "hungarian total_cost <= greedy total_cost");

    auto mcmf = algo::min_cost_max_flow(cm, teams, pending);
    CHECK(!mcmf.pairs.empty(), "mcmf assigns");
    CHECK(mcmf.total_cost <= greedy.total_cost, "mcmf total_cost <= greedy total_cost");

    std::printf("\nAll core algorithm tests passed.\n");
    return 0;
}
