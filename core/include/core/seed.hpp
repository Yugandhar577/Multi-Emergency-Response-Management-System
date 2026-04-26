#pragma once

#include "graph.hpp"
#include "types.hpp"

namespace emergency::seed {

// Build the 60-node Pune-shaped graph with fabricated weights (km-ish minutes).
Graph build_pune_graph();

// Deterministic seed teams/incidents for the demo.
std::vector<Team> seed_teams();
std::vector<Incident> seed_incidents();

}  // namespace emergency::seed
