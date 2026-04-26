add_library(emergency_core STATIC
  src/graph.cpp
  src/dijkstra.cpp
  src/astar.cpp
  src/bellman_ford.cpp
  src/floyd_warshall.cpp
  src/kruskal_mst.cpp
  src/dsu.cpp
  src/tarjan.cpp
  src/hungarian.cpp
  src/mcmf.cpp
  src/dispatch.cpp
  src/database.cpp
  src/seed.cpp
)

target_include_directories(emergency_core PUBLIC include)
target_link_libraries(emergency_core PUBLIC sqlite3 nlohmann_json::nlohmann_json)
