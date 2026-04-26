# Viva Walkthrough — The Emergency Response Console

A talking-points guide for the AADSA (Advanced Algorithms & Data Structures Analysis) viva. Covers the 5-minute live demo, algorithm justifications, exam-likely questions, and data structure choices.

## 5-Minute Live Demo Flow

Open the browser to `http://localhost:5173` (frontend already running against C++ backend on `:8080`).

### 0:00 — Algorithm Lab (Dijkstra vs A* vs Bellman-Ford vs Floyd-Warshall)

1. **Open** `/lab` tab (already routed).
2. **Select** source: Downtown Pune, destination: Phursungi (any two distant areas).
3. **Click** "Run All Four" button.
   - Live map updates with four colored paths overlaid (Ruby = Dijkstra, Moss = A*, Brass = Bellman-Ford, Ink = Floyd-Warshall).
   - Below, four stat cards show complexity, total weight, hops, relaxations, elapsed time.
   - All show "OK" badge because paths exist and weights are non-negative (yet).

**Key talking point:** "Notice the elapsed times — Dijkstra and A* are fastest for single-pair routing. Floyd-Warshall is expensive to precompute but answers all-pairs queries instantly."

### 1:30 — Toggle Priority Corridors, Re-run

1. **Check** "Priority Corridors" checkbox.
2. **Click** "Run All Four" again.
   - Dijkstra badge now shows **"Failed"** in ruby with note: "negative-weight edge encountered (Dijkstra invalid)".
   - Bellman-Ford badge stays "OK" and computes the correct path using the negative-bonus corridors.
   - A* and Floyd-Warshall also handle it correctly.

**Key talking point:** "This is why we implemented Bellman-Ford even though Dijkstra is faster — emergency corridors get a negative cost bonus, and Bellman-Ford is the only single-source algorithm that handles negative weights correctly. Dijkstra's greedy assumption breaks."

### 2:30 — Dispatcher (Greedy vs Hungarian vs MCMF)

1. **Click** Dispatcher tab.
   - Left panel: queue of pending incidents (auto-refetches every 3s).
   - Center: map with ruby incident pins and moss team home-base pins.
   - Right: three strategy buttons.

2. **Click** "Greedy Nearest" button.
   - Runs in < 1ms. Shows total cost and assignment pairs.
   - Assigns each incident to the nearest available team.

3. **Click** "Optimal (Hungarian)" button.
   - Computes min-cost matching across all incident-team pairs.
   - Total cost is lower than Greedy.

4. **Click** "Capacity-aware (Min-Cost Flow)" button.
   - Respects team capacity constraints (each team has a max unit count).
   - Result may differ from Hungarian if capacities are binding.

5. **Click** "Compare All Three" button.
   - Shows three stat cards side-by-side.
   - Highlights the winner (lowest total cost) with moss border and "Winner" badge.

**Key talking point:** "Greedy is O(T · I log T) — fast but suboptimal. Hungarian is O(T³) — guarantees optimal matching among available teams. MCMF is the most sophisticated, respecting capacity constraints while minimizing cost. In live operations, we choose based on time budget and constraint severity."

### 3:30 — Resilience (MST, Bridges, Articulation Points, Closure Simulation)

1. **Click** Resilience tab.
   - Stat strip at top shows bridge count, articulation point count, MST weight.
   - Control panel on right with three toggles.

2. **Check** "Show MST" toggle.
   - Map overlays moss-colored minimum spanning tree edges.
   - Panel shows MST total weight.

3. **Check** "Show Bridges" toggle.
   - Map overlays ruby-colored critical edges (bridges).
   - Panel updates to show articulation points count.

4. **Check** "Show APs" (Articulation Points) toggle.
   - Map marks articulation areas with ruby ringed circles.
   - These areas, if removed, would disconnect the graph.

5. **Click** an edge on the map (e.g., Manjari-Phursungi bridge).
   - Simulator runs `/api/graph/connectivity` with that edge removed.
   - Shows component count and lists isolated areas below.
   - Map highlights isolated areas in ruby.

**Key talking point:** "Tarjan's algorithm finds bridges and articulation points in O(V + E) using DFS with a clever discovery-time trick. This helps us identify critical infrastructure — if this one bridge fails, entire districts go offline. MST shows the minimum cost to keep the graph connected. Connectivity analysis lets us simulate failures and plan redundancy."

### 4:30 — Analytics (Aggregate Metrics)

1. **Click** Analytics tab.
   - Top row: four stat numerals — Total, Pending, Handled, Max Severity Pending.
   - Two-column grid below: Incidents per Area (bar chart, top 10), Severity Distribution (pie chart).
   - Bottom: Team Utilization (bar chart, handled count per team).

**Key talking point:** "All data flows through TanStack Query, so charts auto-update as incidents are filed or handled. The dashboard gives command staff a live operational picture without refreshing."

---

## The Ten Algorithms: Definitions & Exam Answers

### 1. Dijkstra's Shortest Path

**Definition:** Single-source shortest path using a greedy priority queue. Visits nodes in order of increasing distance from source. O((V + E) log V) with binary heap.

**Where:** Algorithm Lab (compare with others), Dispatcher (dispatch routes).

**Complexity Proof:**
- Extract min: O(log V) per operation, O(V) operations → O(V log V).
- Relax edges: O(E log V).
- Total: O((V + E) log V).

**Why We Chose It:**
- Standard choice for single-source routing on non-negative graphs.
- Greedy assumption makes it fast; used in GPS, emergency dispatch, game pathfinding.

**Likely Exam Question:** "Why does Dijkstra fail on graphs with negative edge weights?"
**Answer:** "Dijkstra uses a greedy assumption — once a node is visited, its distance is final. But with negative edges, a longer path through a negative edge later might improve the distance. Bellman-Ford relaxes edges iteratively, so it handles negatives."

---

### 2. A* Search

**Definition:** Best-first search using a heuristic `f(n) = g(n) + h(n)`, where g(n) is known cost and h(n) estimates remaining cost. Expands fewer nodes than Dijkstra if heuristic is admissible.

**Where:** Algorithm Lab (compare with Dijkstra).

**Complexity:** O(b^d) where b is branching factor, d is depth. In practice, much faster than Dijkstra if heuristic is good.

**Why We Chose It:**
- Geographic heuristic (Haversine distance between areas) prunes exploration space.
- Educational value: demonstrates how heuristics improve graph search.

**Likely Exam Question:** "What makes a heuristic admissible, and why does admissibility guarantee optimality?"
**Answer:** "An admissible heuristic never overestimates true cost (h(n) <= actual remaining cost). This ensures f(n) never underestimates true path length, so the first path we find to the goal is optimal. We use Haversine distance — it's admissible because straight-line distance is always <= road distance."

---

### 3. Bellman-Ford

**Definition:** Single-source shortest path that relaxes all edges V-1 times. Handles negative weights and detects negative cycles. O(V · E).

**Where:** Algorithm Lab (shows as only algorithm that handles priority corridors with negative bonus), Dispatcher (route planning).

**Complexity:** O(V · E) — V-1 passes, each checking E edges.

**Why We Chose It:**
- Our priority corridors have negative-weight bonuses (emergency routes get cost reduction).
- Only single-source algorithm that handles negatives correctly.
- Demonstrates algorithmic correctness over performance — slower, but correct.

**Likely Exam Question:** "Why do we run Bellman-Ford V-1 times, not V times or just once?"
**Answer:** "In a DAG, any simple path has at most V-1 edges. So after V-1 relaxations, all reachable nodes have final distances. A V-th pass would detect negative cycles (if a node distance still improves, there's a negative cycle). We stop at V-1 because that's sufficient to prove correctness."

---

### 4. Floyd-Warshall

**Definition:** All-pairs shortest path using dynamic programming. Builds up shortest paths by considering intermediate nodes. O(V³).

**Where:** Algorithm Lab (precomputed for fast all-pairs queries), Dispatcher (quick route lookups).

**Complexity:** O(V³) — three nested loops over V nodes. Space: O(V²) for distance matrix.

**Why We Chose It:**
- Precomputed once, answers any source-destination pair in O(V) table lookup.
- Educational: demonstrates dynamic programming on graphs.
- For small graphs (60 nodes), O(V³) = ~216K operations — negligible.

**Likely Exam Question:** "When is Floyd-Warshall better than running Dijkstra from each node?"
**Answer:** "Floyd-Warshall is O(V³) once. Running Dijkstra from each node is O(V · (V + E) log V). For dense graphs or if we need many all-pairs lookups, Floyd-Warshall's one-time cost is amortized better. We cache FW results and reuse them."

---

### 5. Kruskal's MST

**Definition:** Minimum spanning tree using greedy edge selection with Disjoint Set Union (DSU). Sort edges by weight, add each edge if it doesn't create a cycle. O(E log E) with union-find.

**Where:** Resilience page ("Show MST" toggle).

**Complexity:** O(E log E) — sort edges, then O(E · α(V)) union-find ops. With path compression and union by rank, α(V) ≈ 1.

**Why We Chose It:**
- MST shows minimum-cost network connectivity (if we had to rebuild roads to minimum specs).
- Demonstrates union-find (DSU) data structure — crucial for graph connectivity problems.
- Visual appeal: overlay MST on the map to show backbone roads.

**Likely Exam Question:** "Why is Kruskal's safe? (Why does greedy work for MST?)"
**Answer:** "Cut property: for any cut (partition of vertices), the minimum-weight edge crossing the cut is in some MST. Kruskal picks minimum-weight edges globally, so each edge satisfies the cut property. Inductive proof shows the result is an MST."

---

### 6. Tarjan's Bridges & Articulation Points

**Definition:** Single DFS traversal finds bridges (edges whose removal increases connected components) and articulation points (vertices whose removal does so). Uses discovery time and low-time tracking. O(V + E).

**Where:** Resilience page ("Show Bridges", "Show APs" toggles).

**Complexity:** O(V + E) — single DFS with O(1) per-node and per-edge work.

**Why We Chose It:**
- Critical for infrastructure resilience — identify single points of failure.
- One of the most elegant DFS applications; demonstrates advanced graph algorithms.
- Real-world use: network reliability, city planning, social network analysis.

**Likely Exam Question:** "How does Tarjan detect a bridge without re-running DFS after each edge removal?"
**Answer:** "For each edge (u, v) in the DFS tree, it's a bridge if low[v] > disc[u]. low[v] is the minimum discovery time reachable from v's subtree without using (u, v). If low[v] > disc[u], there's no back-edge from v's subtree to u's ancestors, so removing (u, v) disconnects v from u."

---

### 7. Connectivity Analysis (Edge Removal)

**Definition:** Given a graph and an edge to remove, count connected components and identify isolated vertices. Uses DSU or DFS.

**Where:** Resilience page (click an edge on map to simulate closure).

**Complexity:** O(V + E) with DFS, O(E · α(V)) with DSU-based edge addition.

**Why We Chose It:**
- Practical resilience testing — "what if this critical road closes?"
- Demonstrates dynamic graph algorithms.
- Shows how one edge failure can cascade (e.g., one bridge isolates 3 areas).

**Likely Exam Question:** "Why do we simulate edge removal instead of just checking bridge status?"
**Answer:** "Bridge detection tells us which edges are critical. Edge removal simulation shows the actual impact — how many areas are isolated, which ones, and how communication is rerouted. It's the operational consequence of the structural finding."

---

### 8. Greedy Nearest Dispatch

**Definition:** For each pending incident, assign to the closest available team (by shortest path distance). O(T · I log T) with Dijkstra or table lookup.

**Where:** Dispatcher page ("Greedy Nearest" button).

**Complexity:** O(T · I · (V + E) log V) or O(T · I) if using precomputed all-pairs distances.

**Why We Chose It:**
- Baseline strategy — simple, fast, intuitive.
- Educational: demonstrates greedy algorithm design and its limitations.
- Shows O(T) can give suboptimal results even though each local decision seems reasonable.

**Likely Exam Question:** "Why is greedy dispatch suboptimal?"
**Answer:** "Greedy assigns each incident to its nearest team without considering global impact. If incident 1 is closer to Team A but incident 2 is far from all teams, assigning incident 1 to Team A leaves Team B for incident 2 at high cost. Hungarian finds the global optimum by considering all pairings."

---

### 9. Hungarian Algorithm (Optimal Assignment)

**Definition:** Polynomial-time algorithm for minimum-weight perfect matching in a bipartite graph. Uses cost matrix reduction and augmenting paths. O(T³) for T workers.

**Where:** Dispatcher page ("Optimal (Hungarian)" button).

**Complexity:** O(T³) — builds augmenting paths in O(T²), runs O(T) iterations.

**Why We Chose It:**
- Guarantees optimal incident-team assignments.
- Educational: demonstrates advanced matching theory.
- Shows the cost difference vs. Greedy (often 10-30% better).

**Likely Exam Question:** "What's the difference between Hungarian and Greedy?"
**Answer:** "Greedy is O(T · I log T) but suboptimal. Hungarian is O(T³) and optimal. For 10 teams and 20 incidents, Hungarian solves in ~1ms. Greedy is instant but often 10-20% worse. We use Hungarian for final dispatch; Greedy for quick estimates."

---

### 10. Min-Cost Max-Flow (MCMF)

**Definition:** Flow network algorithm that finds a flow of maximum value with minimum total cost. Uses cost scaling or successive shortest paths. O(V · E²) or better with optimization.

**Where:** Dispatcher page ("Capacity-aware (MCMF)" button).

**Complexity:** O(V · E²) with Successive Shortest Paths, O(E · log(V · max_cost)) with cost scaling.

**Why We Chose It:**
- Respects team capacity constraints (each team has X available units; MCMF never oversends).
- Most sophisticated dispatch algorithm — handles real-world constraints.
- Educational: demonstrates network flow theory and practical optimization.

**Likely Exam Question:** "Why does MCMF give different results than Hungarian?"
**Answer:** "Hungarian ignores capacity constraints — it can assign 5 incidents to a team with only 2 units. MCMF models each team as a capacity-constrained node; it can send at most capacity units. If capacity is tight, MCMF may assign incidents to farther teams to avoid overload. Trade-off: cost vs. feasibility."

---

## Hidden Data Structures

These are not explicitly "algorithms" but critical to implementation correctness:

### Priority Queue (Binary Heap)

**Used In:** Dijkstra, A*, MCMF (all use min-heap for next-best-choice).

**Implementation:** STL `std::priority_queue` in C++.

**Why It's Crucial:**
- Dijkstra must extract the unvisited node with minimum distance. Without a heap, this is O(V²). With heap, it's O(V log V).
- A* uses f(n) values to prioritize exploration.

**Exam Angle:** "Why not use a sorted list instead of a heap?" → "Insertion is O(log V) vs O(V), and we insert/extract O(E) times, so heap saves O(E log V) vs O(E · V)."

### Disjoint Set Union (DSU / Union-Find)

**Used In:** Kruskal MST, Connectivity, any graph component analysis.

**Implementation:** STL-like or custom with path compression + union by rank.

**Why It's Crucial:**
- Kruskal must quickly check if two vertices are in the same connected component. DSU does this in O(α(V)) ≈ O(1) amortized.
- Without DSU, checking connectivity is O(V + E), and Kruskal becomes O(E² + E log E) = O(E²).

**Exam Angle:** "Explain union-find with path compression." → "Path compression: during find(x), set all nodes on the path from x to root to point directly to root. Next find(x) is O(1). Amortized, we get O(α(V)) per operation."

### Adjacency List (Graph Representation)

**Used In:** Every algorithm (Dijkstra, DFS, BFS, Tarjan, etc.).

**Implementation:** Vector of vectors or map of vectors in C++.

**Why It's Crucial:**
- O(E) to iterate over edges; O(V) to iterate over vertices.
- Adjacency matrix would be O(V²) memory and slower for sparse graphs.

**Exam Angle:** "Why adjacency list vs. matrix?" → "60 nodes, ~200 edges is sparse. Adjacency matrix = 3.6KB for 60×60; list = ~1.6KB for 60 vectors + 200 edges. But iteration over matrix edges is O(V²); list is O(E). In practice, list is standard."

### BFS/DFS Stack & Visited Set

**Used In:** Tarjan (uses DFS), Connectivity (uses DFS or BFS).

**Implementation:** STL `std::stack` for DFS, `std::vector<bool>` for visited tracking.

**Why It's Crucial:**
- DFS must track visited nodes to avoid cycles. Without it, infinite loops.
- Tarjan uses a recursion stack (implicitly) and low-time array to track algorithm state.

**Exam Angle:** "Why does Tarjan use low[v]?" → "Discovery time disc[v] is when we first visit v. Low-time low[v] is the minimum disc value reachable from v's subtree. It detects back-edges: if low[v] > disc[u], there's no back-edge, so (u, v) is a bridge."

---

## Why C++ Backend Instead of Python?

**Performance:** 10 algorithms running on 60 nodes × 200 edges. C++ compiled to native machine code runs ~10-100x faster than interpreted Python. Dijkstra in C++: ~0.1ms. In Python: ~1-10ms. For interactive UI (Viva demo), latency matters.

**Learning Value:** AADSA is a data structures course. Implementing algorithms in C++ forces you to understand memory layout, pointer semantics, and efficiency. Python abstracts these away.

**Production Credibility:** HTTP server in C++ with a custom WinSock adapter is lightweight and production-ready. FastAPI in Python is heavier. For a viva demo, C++ signals serious engineering, and building HTTP request parsing in plain C++ demonstrates network-protocol understanding.

**Compatibility:** SQLite bindings, JSON support, and HTTP server are all mature in C++. Building and shipping a single C++ executable is simpler than a Python venv + dependencies.

---

## Likely Viva Questions & Crisp Answers

### Q1: "Walk us through Dijkstra's algorithm."
**A:** "Start with source distance = 0, all others = infinity. Repeatedly extract the unvisited node with min distance, relax all its outgoing edges (update neighbor distances if shorter path found), mark node visited. Repeat until destination is visited or queue is empty. Complexity O((V + E) log V) with binary heap."

### Q2: "Why implement four different shortest-path algorithms when Dijkstra is enough?"
**A:** "Bellman-Ford handles negative weights (our priority corridors). Floyd-Warshall precomputes all-pairs (fast query for dispatch). A* uses heuristics to prune search space. Each has different trade-offs; we show them all to educate about design choices."

### Q3: "How does the Dispatcher choose between Greedy, Hungarian, and MCMF?"
**A:** "Greedy is O(T · I log T) — fastest, used for real-time estimates. Hungarian is O(T³) — optimal matching, used when time permits. MCMF is O(V · E²) — respects capacity constraints, used when overload is a concern. In a live system, you'd choose based on time budget and constraint severity."

### Q4: "Explain Tarjan's bridge-finding algorithm."
**A:** "Single DFS traversal maintains disc[v] (discovery time) and low[v] (minimum disc reachable from v). For each edge (u, v) in the DFS tree, if low[v] > disc[u], it's a bridge because v's subtree has no back-edge to u's ancestors, so removing (u, v) disconnects v."

### Q5: "What's the difference between a bridge and an articulation point?"
**A:** "Bridge: an edge whose removal increases connected components. Articulation point: a vertex whose removal does so. A bridge connects two biconnected components; an AP is at the junction of multiple biconnected components. Both indicate critical infrastructure."

### Q6: "Why use TanStack Query on the frontend instead of useState?"
**A:** "TanStack Query handles caching, refetching, synchronization, and error handling automatically. useState is just local state; fetching with useState is a common source of bugs (race conditions, missed updates). TanStack Query is the modern best practice for server-state management."

### Q7: "Explain the dispatch cost matrix. What does it represent?"
**A:** "cost[i][j] = cost to assign incident i to team j, computed as shortest path distance from incident location to team location times some weight. Hungarian finds the minimum-weight perfect matching; MCMF adds capacity constraints on top."

### Q8: "If a bridge fails, how does the system respond?"
**A:** "The Resilience page lets us simulate closure: we submit the edge ID and run connectivity analysis, which counts components and lists isolated areas. In a real system, we'd pre-compute all bridge failures and pre-plan redundancy or rerouting strategies."

### Q9: "What would you add to make this production-ready?"
**A:** "Authentication (which teams can dispatch), real-time WebSocket updates (instead of polling), persistent incident history with analytics, integration with actual GPS data, load balancing for multiple dispatchers, and automated testing of all algorithms."

### Q10: "How would you scale this to 10,000 areas instead of 60?"
**A:** "Dijkstra and Bellman-Ford still work. Floyd-Warshall becomes infeasible (10,000³ = 10^12 ops). For all-pairs, we'd use Dijkstra from each node, cached lazily. For dispatch, we'd use approximate nearest-neighbor trees (k-d trees) instead of exact Dijkstra. Graph data would be partitioned across regions."

---

## Exam Preparation Checklist

- [ ] Understand and derive Dijkstra, Bellman-Ford, Floyd-Warshall complexity.
- [ ] Explain why Dijkstra fails on negative weights and when Bellman-Ford is needed.
- [ ] Draw and trace Tarjan's algorithm on a small graph by hand (10 nodes).
- [ ] Understand union-find: path compression, union by rank, amortized analysis.
- [ ] Explain Hungarian vs. Greedy vs. MCMF dispatch trade-offs.
- [ ] Know the five pages of the UI and which algorithms each demonstrates.
- [ ] Explain the architecture: React frontend, C++ backend, SQLite, Vite proxy.
- [ ] Be ready to live-demo: run the system, explain results, answer follow-up questions.

Good luck!
