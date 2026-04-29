# Viva Walkthrough: Emergency Response Decision Support

Use this script to present the project as one connected system. The core story is:

> A citizen reports an incident. The command center compares dispatch strategies, tracks the response, analyzes network weak points, and then uses the algorithm lab to explain the decisions.

## 5-Minute Demo Flow

### 0:00 - Landing And Dashboard

1. Open `http://127.0.0.1:5173`.
2. Explain the five-step flow: Report, Dispatch, Track, Analyze, Learn.
3. Click **Enter Operations**.
4. On Dashboard, point out active incidents, pending queue, handled count, and average response.

Talking point:
"This project is a decision-support system. The algorithm lab is not separate from the product; it explains why each operational decision is possible."

### 0:45 - Report Incident

1. Open **Report**.
2. Select an area.
3. Choose an incident type.
4. Set severity.
5. Add a short description and submit.

Talking point:
"This is the citizen intake layer. It creates the pending incident that the dispatch algorithms will assign."

### 1:30 - Dispatch Teams

1. Open **Dispatch**.
2. Click **Greedy Nearest**.
3. Click **Optimal (Hungarian)**.
4. Click **Capacity-aware (MCMF)**.
5. Click **Compare All Three**.

Talking point:
"Greedy is fast and intuitive but can be globally suboptimal. Hungarian gives optimal matching for the cost matrix. Min-Cost Max-Flow adds capacity constraints, so it is the most realistic assignment model in this demo."

### 2:30 - Active Incident Tracking

1. Open **Active**.
2. Show columns: Pending, Assigned, En-route, On-scene, Handled.
3. Move one incident forward if useful.

Talking point:
"The algorithm result becomes operational state. This page shows the lifecycle of incident response."

### 3:15 - Resilience Analysis

1. Open **Resilience**.
2. Toggle **Show MST**.
3. Toggle **Show Bridges**.
4. Toggle **Show APs**.
5. Click a road edge to simulate closure.

Talking point:
"Kruskal's MST shows a minimum connectivity backbone. Tarjan's algorithm finds bridges and articulation points in linear time. Closure simulation turns the structural result into an operational consequence."

### 4:15 - Algorithm Lab

1. Open **Algorithm Lab**.
2. Open **Routing Comparison**.
3. Run all four routing algorithms.
4. Toggle priority corridors and run again if time allows.

Talking point:
"Dijkstra is fast for non-negative weights. A* uses a heuristic to reduce search. Bellman-Ford handles negative priority-corridor bonuses. Floyd-Warshall precomputes all-pairs shortest paths for quick repeated lookups."

## Algorithm Summary

- **Dijkstra:** shortest path on non-negative weights using a binary heap priority queue. Complexity: `O((V + E) log V)`.
- **A*:** target-aware shortest path using an admissible geographic heuristic.
- **Bellman-Ford:** handles negative edge weights and detects negative cycles. Complexity: `O(V * E)`.
- **Floyd-Warshall:** all-pairs shortest paths. Complexity: `O(V^3)`.
- **Kruskal MST:** minimum spanning tree using DSU. Complexity: `O(E log E)`.
- **Tarjan:** bridges and articulation points in `O(V + E)`.
- **Connectivity simulation:** removes one edge and counts connected components.
- **Greedy dispatch:** fast nearest-team baseline.
- **Hungarian:** optimal bipartite matching for team-to-incident assignment.
- **Min-Cost Max-Flow:** capacity-aware assignment optimization.

## Likely Viva Questions

**Q: Why use multiple shortest-path algorithms?**  
A: Each demonstrates a different trade-off. Dijkstra is fast for normal roads, A* uses a heuristic, Bellman-Ford handles negative corridor bonuses, and Floyd-Warshall is useful when many route lookups are needed.

**Q: Why is Greedy not enough for dispatch?**  
A: Greedy makes locally best assignments. It can block a better global assignment. Hungarian considers the whole cost matrix and minimizes total assignment cost.

**Q: Why use Min-Cost Max-Flow if Hungarian exists?**  
A: Hungarian solves matching, but MCMF can model capacities. If one team has limited available units, flow constraints prevent overload.

**Q: What does Tarjan add to the project?**  
A: It identifies critical roads and areas in linear time, which makes the resilience planner more than a visual map.

**Q: Is this production-ready?**  
A: No. It is a course-grade decision-support prototype. The graph is Pune-inspired, not live traffic data. Production scope would need authentication, live GPS/traffic data, audit logging, and real-time updates.

## What To Emphasize

- The project has one coherent story: report, dispatch, track, analyze, explain.
- The backend algorithms are implemented in C++ and tested.
- The frontend makes those algorithms visible through an operations workflow.
- The system is intentionally scoped for an AADSA course project, not a real city deployment.
