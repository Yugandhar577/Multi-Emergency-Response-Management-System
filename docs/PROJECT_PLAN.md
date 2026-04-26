# Project Plan: Multi-Emergency Response Management System

## 1. Project Overview

The Multi-Emergency Response Management System is an advanced algorithms showcase built for AADSA (Advanced Algorithms & Data Structures Analysis), a 30%-weight subject in the college curriculum. It is a city-scale emergency dispatch platform modeling how a command center receives incident reports, assigns response teams by optimized routing, and analyzes network resilience.

The system targets a fictional 60-neighborhood Pune graph (~200 edges) and demonstrates 10 advanced algorithms across five operational roles: Algorithm Lab (comparison environment), Dispatcher (team assignment), City Resilience (critical infrastructure analysis), Citizen Reporter (incident intake), and Analytics (aggregate metrics). Built in C++17 backend + React 18 frontend in a 2-day development sprint by a 4-student team, the project expands a narrow Win32 proof-of-concept into a credible multi-algorithm, multi-panel system with REST API, persistent SQLite storage, and rigorous complexity documentation.

The core goal: showcase algorithm depth and system engineering competence, not production-ready scale. The system is credible, educational, and viva-ready.

## 2. The Origin Problem

The initial submission was `emer.cpp`, a ~2000-line Win32 desktop application built in isolation, with a single GUI panel, one emergency type, and classical algorithms only (Dijkstra, Segment Tree, Priority Queue, Trie). The teacher's feedback was clear: **scope too narrow for 30% weightage**. The project lacked:

- Algorithmic diversity (only single-source shortest path, no all-pairs, no matching, no network flow, no bridge/AP detection).
- System depth (monolithic GUI, no separation of concerns, no API, no persistence layer beyond text files).
- Multiple roles/perspectives (only one dispatcher view, no analyst/resilience angle, no citizen intake).
- Complexity justification (chose algorithms pragmatically; missing theoretical comparisons).

The team needed to **expand both algorithmic count and system surface** while remaining credible as 4-person work in a 2-day window.

## 3. Scope Decision

Four expansion axes were considered:

**Axis A — Multi-Agency Dispatch**  
Fire, Medical, Police, Disaster, Hazmat teams with distinct specialties and capacity constraints. Adds operational flavor but minimal algorithmic value.

**Axis B — Multi-Role Multi-Screen**  
Citizen reporter, dispatcher, analytics dashboard, resilience analyst, lab researcher. Adds UI surface; requires framework clarity and routing infrastructure.

**Axis C — Algorithmic Depth**  
10 algorithms across four families (shortest path, MST, critical structures, assignment), with live comparison, heuristics (A*), negative-weight handling (Bellman-Ford), all-pairs precomputation (Floyd-Warshall), and network flow (MCMF). Pure educational value, testable at viva.

**Axis D — Operational Realism**  
Replay/simulation, benchmark reports, persistent incident history, SLA tracking, automated redundancy planning. Adds value to analysts; requires sophisticated state management.

**Decision: Hybrid C-heavy + light B.** Axe D (operational realism) entirely — 60-node graph simulation is sufficient. Axe A (multi-agency) lightly — five team types exist in schema but no specialty-specific matching logic. Pick C (ten algorithms with rigorous side-by-side comparison) and B (five pages with clean routing). Reasoning: AADSA is an algorithms/structures course. Algorithm count, complexity proofs, and live comparison have immediate viva value. B (routing) unlocks five distinct demo pages (each showcasing different algorithm families), which feels like substantial system work without becoming a logistics simulator.

## 4. The Ten Algorithms (and Why Each Was Kept)

### 1. Dijkstra's Shortest Path
**Definition:** Single-source shortest path via greedy priority queue, visiting nodes in order of increasing distance. **Complexity:** O((V + E) log V) with binary heap. **Domain:** Baseline routing for incident-to-team dispatch. Fast, optimal on non-negative graphs, used in GPS and dispatch systems. **In System:** Algorithm Lab (vs. A*/BF/FW), Dispatcher (route planning).

### 2. A* Search
**Definition:** Best-first search using heuristic f(n) = g(n) + h(n) (cost + estimate). Admissible heuristic (Haversine distance) guarantees optimality while pruning search space. **Complexity:** O(b^d) in theory; O(V log V) comparable to Dijkstra in practice with good heuristic. **Domain:** Educational value — demonstrates how heuristics improve search without breaking correctness. **In System:** Algorithm Lab (compare with Dijkstra).

### 3. Bellman-Ford Shortest Path
**Definition:** Single-source shortest path via edge relaxation repeated V-1 times. Handles negative edge weights, detects negative cycles. **Complexity:** O(V · E). **Domain:** Priority corridors (negative-weight bonus edges representing emergency vehicle priority lanes). Dijkstra's greedy assumption fails on negatives; Bellman-Ford is the only single-source algorithm that handles them. This is not theoretical redundancy — it has real justification. **In System:** Algorithm Lab (toggle "Priority Corridors" to show Dijkstra failing while BF succeeds). Dispatcher (route planning with corridors).

### 4. Floyd-Warshall All-Pairs Shortest Path
**Definition:** Dynamic programming over all vertex pairs via k-th intermediate node. Computes distance matrix once, queries any pair in O(V) time. **Complexity:** O(V³) precomputation, O(1) query. **Domain:** For small graphs (60 nodes, 216K ops is instant), precomputing all-pairs and caching is better than running Dijkstra per query. Educational: demonstrates DP on graphs. **In System:** Algorithm Lab (precomputed once, reused for fast path lookups).

### 5. Kruskal's Minimum Spanning Tree
**Definition:** Greedy edge selection via union-find; sort edges by weight, add each if it doesn't create cycle. **Complexity:** O(E log E) with path-compressed DSU. **Domain:** Identifies minimum-cost connectivity backbone. In an emergency context: "if we had to rebuild roads to bare minimum specs, which roads are critical?" Visual appeal: overlay on map. **In System:** Resilience page ("Show MST" toggle).

### 6. Tarjan's Bridges & Articulation Points
**Definition:** Single DFS traversal finds edges (bridges) whose removal increases connected components and vertices (APs) whose removal does so. Uses discovery time + low-time tracking. **Complexity:** O(V + E). **Domain:** Critical infrastructure resilience. Identifies single points of failure in the road network. If a bridge fails, an entire neighborhood may be cut off — operationally crucial. One of the most elegant DFS applications in CS. **In System:** Resilience page ("Show Bridges", "Show APs" toggles). Pedagogical hook: the 60-node graph is designed with five satellite areas (Wagholi, Theur, Loni Kalbhor, Phursungi, Chakan) reachable only via one connector, making them perfect bridges for Tarjan to discover.

### 7. Connectivity Analysis (Edge Removal & Component Counting)
**Definition:** Remove a given edge from graph, count connected components and identify isolated vertices. Uses DSU or DFS. **Complexity:** O(V + E). **Domain:** Failure simulation. "If this critical road closes, how many areas are isolated?" Distinct from bridge detection: bridges tell structure; simulation shows operational consequence. **In System:** Resilience page (click an edge on map, run `/api/graph/connectivity` endpoint, see isolated areas highlighted).

### 8. Greedy Nearest-Team Dispatch
**Definition:** For each pending incident, assign to closest available team by shortest path. **Complexity:** O(T · I · log T) with Dijkstra per team, or O(T · I) with precomputed distances. **Domain:** Baseline heuristic. Fast, intuitive, suboptimal. Shows why greedy fails and motivates Hungarian/MCMF. **In System:** Dispatcher page ("Greedy Nearest" button). Live comparison shows greedy runs in < 1ms but total cost is typically 10-30% worse than Hungarian.

### 9. Hungarian Algorithm (Kuhn-Munkres Minimum-Weight Perfect Matching)
**Definition:** Polynomial algorithm for minimum-weight bipartite matching. Reduces cost matrix, finds augmenting paths, O(T³) for T workers. **Complexity:** O(T³). **Domain:** Optimal incident-to-team assignment ignoring capacity constraints. Guarantees global minimum cost. Educational: demonstrates advanced matching theory from combinatorial optimization. **In System:** Dispatcher page ("Optimal (Hungarian)" button). Stat card shows cost savings vs. Greedy (often 10-30%).

### 10. Min-Cost Max-Flow (MCMF)
**Definition:** Network flow algorithm finding maximum flow with minimum total cost. Uses successive shortest paths or cost scaling. **Complexity:** O(V · E²) or O(E · log(V · max_cost)) optimized. **Domain:** Capacity-constrained team dispatch. Each team has a max unit count; MCMF respects this. Can assign incident to farther team if it avoids overloading a closer one. Most sophisticated: trades cost for feasibility. **In System:** Dispatcher page ("Capacity-aware (MCMF)" button).

**Algorithms Deliberately Excluded:**
- Fibonacci Heap (O(E log V) single-source): Too complex to implement, marginal payoff for 60-node graph.
- Persistent Segment Tree (range queries over time): Low demo value for this problem.
- Yen's K-Shortest Paths, Johnson's, Bidirectional Dijkstra: Good algorithms, but team decided 10 captured the core curriculum; 11+ felt like scope creep.

## 5. Architecture

```
                    React 18 Frontend (Vite 5)
                   [Navbar] [Pages] [Routing]
                              |
                        Vite Dev Proxy
                              |
          ====================================================
          |
    C++17 Backend (Custom WinSock HTTP adapter)
    [HTTP Server on :8080]
         |
    +----+----+
    |         |
   Core    Database
  Algos    (SQLite)
  [10]      
    |
  [Graph]
```

The system is deliberately split:
- **Frontend:** React 18 + Vite SPA running on :5173 (dev), routed to five pages. Uses TanStack Query for server state, Zustand for UI state, Axios for HTTP.
- **Backend:** Single-binary C++ server on :8080 serving REST+JSON. No Win32 dependencies — pure C++17 standard lib + vendored deps (custom WinSock HTTP adapter, nlohmann/json, SQLite amalgamation). CMake build into `emergency_server` executable.
- **Core:** Algorithm library (no HTTP, no UI, pure graph logic). Testable in isolation.
- **Database:** SQLite on disk. Persists areas, edges, teams, incidents, assignments. Loaded into Graph at startup, queried by algorithms.

Intentional constraints:
- Single backend binary (no microservices complexity for 4-person team).
- No WebSockets or real-time push (polling instead; simpler).
- No authentication (open command center for demo; auth is trivial to add).
- HTTP endpoints ~20 total: graph config, algorithm execution, incident CRUD, assignment planning, connectivity.

## 6. Tech Stack

### Backend

| Component | Version | Justification |
|-----------|---------|---|
| C++ | C++17 | Course expects compiled language; raw performance for AADSA. |
| Custom WinSock HTTP | ~270 LOC | Single-threaded HTTP adapter built for MinGW portability (std::thread unavailable). Same REST contract as original cpp-httplib plan, fewer dependencies. |
| nlohmann/json | v3.11.3 | Robust JSON serialization, header-only. |
| SQLite | Amalgamation | Lightweight persistence; no external database server. |
| CMake | 3.16+ | Standard build system; FetchContent for vendored deps. |

### Frontend

| Component | Version | Justification |
|-----------|---------|---|
| React | 18 | Modern component model, hooks, concurrent rendering. |
| TypeScript | 5.4 | Type safety; catch bugs at compile time. |
| Vite | 5 | Fast dev server, fast build; ES modules native. |
| Tailwind CSS | 3.4 | Utility-first; theme tokens (Indian Insite Editorial). |
| React Router | v6 | Standard routing for five pages. |
| TanStack Query | 5 | Server-state management; caching, background refetch, auto-sync. |
| Zustand | 4.5 | Lightweight client-state (modal open, selected tab, filter). |
| Axios | 1.6 | HTTP client with interceptors. |
| Recharts | 2.12 | Charting for Analytics page. |
| react-leaflet | 4.2 | Map rendering with OpenStreetMap tiles (no API key needed). |

Rationale: All libraries are stable, mature, and widely used in production. Stack is a modern baseline for web frontends.

## 7. Theme & Design System

The system uses **Indian Insite Editorial** — a warm, editorial aesthetic with high-contrast typography and brass/moss/ruby accents. Locked-in design direction from `themes/indian-insite-editorial.md`:

**Color Palette (CSS Variables):**
- `--color-paper: #f5efe4` — Warm paper background
- `--color-parchment: #ede4d5` — Secondary surfaces
- `--color-ink: #171009` — Primary text
- `--color-brass: #b88b3b` — Primary accent, highlights
- `--color-moss: #35544d` — Supporting accent (routing paths, MST)
- `--color-ruby: #8f3528` — Alert/error accent (incident pins, bridges)
- `--color-mist: #d9d0c4` — Soft borders, fills

**Typography:**
- Headers: Fraunces (serif, distinctive, editorial flavor)
- Body: Manrope (sans, clean, readable)

The aesthetic direction is intentionally editorial/magazine, not generic dashboard. This binds the team to `frontend-design/SKILL.md` (production-grade UI conventions) and `frontend-design/react-frontend.md` (React component rules, feature-folder structure, TanStack Query patterns).

## 8. The 60-node Pune Graph

The graph is fabricated (not pulled from OpenStreetMap) but uses real Pune neighborhood names and approximate GPS coordinates. **60 vertices, ~200 edges, connected.**

**Key Design Decision:** Five satellite areas (Wagholi, Theur, Loni Kalbhor, Phursungi, Chakan, Talegaon, Dehu Road) are deliberately reachable via only one connector to the main network. This makes Tarjan's bridge-finding algorithm turn from textbook exercise into operational insight: "If this road closes, that entire neighborhood is isolated." The graph is a teaching tool.

**Priority Corridors:** Five edges marked with negative-weight bonuses (emergency vehicle priority lanes). When toggled on in Algorithm Lab, Dijkstra fails ("negative-weight edge encountered"), but Bellman-Ford succeeds. This is the main pedagogical hook for BF: it's not redundant; it's necessary.

**Seed Data:** Areas and edges defined in `core/src/seed.cpp` as constexpr arrays. Loaded into SQLite on first run. Stable indices (used as foreign keys for team homes, incident areas).

## 9. Build Plan / Execution Punchlist

The team followed an 11-task plan:

1. **Project structure & CMake setup** (~1 hr)  
   Created top-level dirs (core/, server/, frontend/, docs/). CMakeLists.txt with FetchContent for json and SQLite. Frontend Vite scaffold with Tailwind + theme config.

2. **60-node Pune graph + SQLite seed** (~1.5 hrs)  
   Wrote `core/src/seed.cpp` with area/edge arrays. Wrote `core/src/database.cpp` with schema + seed function. Verified ~140 edges, checked connectivity.

3. **C++ core with 10 algorithms** (~3 hrs)  
   Implemented `core/src/algorithms.cpp` with all 10 algorithms. Used STL containers (vector, priority_queue, unordered_map) for performance. No manual memory management. Tested each algorithm in isolation with small graphs before integration.

4. **Custom WinSock HTTP server** (~1.5 hrs)  
   Built `server/main.cpp` with custom WinSock HTTP adapter (~270 LOC) and ~20 endpoints (graph config, algorithm execution, incident CRUD, assignment planning, connectivity). Mapped C++ types to JSON via nlohmann/json. CORS headers for frontend.

5. **React frontend scaffold + theme** (~1 hr)  
   Set up Vite config, Tailwind theme tokens (Indian Insite Editorial), React Router structure. Navbar, Footer, page stubs.

6. **Algorithm Lab page** (~1.5 hrs)  
   Built controls (source/dest dropdowns, toggles for priority corridors, algorithm selection). Integrated `/api/lab/route` endpoint for all four algorithms. Live map rendering with colored paths. Stat cards showing complexity, weight, hops, elapsed time, notes. Dijkstra failure badge when BF is enabled.

7. **Dispatcher page** (~1.5 hrs)  
   Built incident queue, team roster, three buttons (Greedy / Hungarian / MCMF). Fetches pending incidents and teams via TanStack Query. Renders cost matrix heatmap, assignment pairs, total cost comparison. "Compare All Three" button side-by-side stats with winner highlight.

8. **City Resilience page** (~1.5 hrs)  
   Stat strip (bridge count, AP count, MST weight). Three toggles (MST, Bridges, APs). Edge-click handler to simulate removal, show connectivity report. Isolated areas highlighted on map.

9. **Citizen Reporter + Analytics pages** (~1 hr)  
   Reporter: form to log new incident, submit to `/api/incidents/create`. Analytics: fetches aggregate metrics (total, pending, handled, max severity), renders incident-per-area bar chart, severity distribution pie, team utilization bar.

10. **README + viva walkthrough docs** (~1.5 hrs)  
    Wrote comprehensive README.md (overview, features, architecture, files, build, limitations, future scope). Wrote VIVA_WALKTHROUGH.md (5-min demo flow, all 10 algorithm justifications, likely exam Qs, crisp answers).

11. **Verify & integrate** (~1 hr)  
    End-to-end test: build backend, run frontend, navigate all five pages, verify Algorithm Lab runs all four, Dispatcher compares three strategies, Resilience detects bridges/APs, incident intake works. Squashed bugs.

**Total Time: ~18 hrs across 4 students in 2 days = feasible pace.**

## 10. Folder Layout

```
core/
  include/core/
    algorithms.hpp      — Function signatures (10 algos + helpers)
    database.hpp        — SQLite wrapper
    graph.hpp           — Graph data structure
    seed.hpp            — Seed data
    types.hpp           — Incident, Team, Area, Edge, PathResult, etc.
  src/
    algorithms.cpp      — Implementation of 10 algorithms
    database.cpp        — SQLite schema + seed
    graph.cpp           — Graph class methods
    seed.cpp            — Area/edge constexpr arrays
  CMakeLists.txt

server/
  main.cpp              — Custom WinSock HTTP server, ~20 endpoints, ~270 LOC
  CMakeLists.txt

frontend/
  src/
    components/
      ui/               — Button, Badge, Spinner, Card, etc.
      layout/           — Navbar, Footer
    features/
      algorithmLab/     — AlgorithmLab page + hooks + api.ts
      dispatcher/       — Dispatcher page + hooks + api.ts
      resilience/       — Resilience page + hooks + api.ts
      reporter/         — Reporter page + hooks + api.ts
      analytics/        — Analytics page + hooks + api.ts
    hooks/              — useQuery, useAsync helpers
    lib/                — axios instance, query client, constants
    pages/              — Route-level wrappers
    App.tsx
    main.tsx
  package.json
  vite.config.ts
  tailwind.config.ts
  tsconfig.json

themes/
  indian-insite-editorial.md   — Locked theme spec (colors, fonts)

frontend-design/
  SKILL.md                      — Frontend design principles
  react-frontend.md             — React/Vite stack rules

docs/
  README.md             — System overview, features, build, limitations
  VIVA_WALKTHROUGH.md   — 5-min demo, algorithm justifications, Qs/As
  PROJECT_PLAN.md       — This file

backend/
  app.py, requirements.txt       — Legacy FastAPI (reference only, not used)

emer.cpp                        — Original Win32 desktop app (legacy)

CMakeLists.txt          — Top-level build config
```

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| 2-day timeline | Incomplete features, rushed integration. | Used Claude-Code for 60% of coding; prebuilt React + Vite skill; vendored all deps via FetchContent (no env setup). Followed 11-task checklist strictly. |
| C++ HTTP server unfamiliar | Debugging, latency, crashes. | Originally cpp-httplib (single header, extensive docs). Switched to hand-rolled WinSock adapter when MinGW std::thread proved unavailable. Kept `main.cpp` clean and under 500 lines (printable, debuggable at viva). Same REST contract, fewer dependencies. |
| Frontend looking generic | Low marks for presentation; doesn't signal quality. | Locked Indian Insite Editorial theme at day-one; frontend-design skill enforced aesthetic discipline. Result: editorial, memorable, not dashboard-generic. |
| Graph data realism | Evaluator asks "where did you get this?" | Fabricated but named (real Pune neighborhoods + approx coords). Faster than downloading OSM, sufficient for demo. Document this choice in README. |
| Bellman-Ford as "redundant Dijkstra" | Evaluator: "Why include it? It's slower." | Priority corridors (negative weight bonus) justify it completely. Show this at viva: toggle corridors on, see Dijkstra fail, BF succeed. No ambiguity. |
| 10 algorithms still feels like list-picking | Evaluator: "Justify why these 10, not others?" | Pre-emptively documented exclusions (Fibonacci heap, persistent seg-tree, Yen's k-shortest) with reasoning in PROJECT_PLAN.md. At viva: "We chose 10 to cover 4 families (shortest path, MST, critical structures, assignment) with depth, not breadth. Deliberate constraint." |
| Graph too small / too simple | "This isn't realistic." | 60 nodes, 200 edges, bridges designed pedagogically. Not production (true Pune has 2M people, millions of road segments), but real enough for algorithms course. Explicitly out of scope: "Scaling to 10,000 nodes would use Dijkstra-per-node + caching or k-d trees instead of Floyd-Warshall." |

## 12. Division of Work (Suggested 4-Student Split)

**Student A: C++ Core + Tests**  
Implement algorithms.cpp (10 algorithms), graph.cpp (data structure), seed.cpp (area/edge arrays). Write simple unit tests (e.g., run Dijkstra on 5-node graph, verify path). Ensure all O(log n) operations use STL containers correctly.

**Student B: Database + HTTP Server**  
Implement database.cpp (SQLite schema, CRUD), server/main.cpp (20 endpoints). Map C++ objects to JSON. Handle GET /api/incidents, POST /api/incidents/create, GET /api/graph/*, POST /api/assignment/*, GET /api/lab/*. Test endpoints with curl / Postman. Ensure CORS headers.

**Student C: React Frontend Architecture + Lab + Dispatcher Pages**  
Scaffold Vite project, install deps, set up React Router + TanStack Query + Zustand. Build Navbar, Footer, theme tokens. Implement Algorithm Lab (controls, map, stat cards, all four algorithms running live). Implement Dispatcher (incident queue, team roster, Greedy/Hungarian/MCMF buttons, cost matrix heatmap, comparison).

**Student D: Resilience + Reporter + Analytics + Documentation**  
Implement Resilience page (MST, bridges, APs, edge removal simulation). Implement Reporter (incident intake form). Implement Analytics (metrics, charts). Write README (overview, build, features, limitations). Write VIVA_WALKTHROUGH.md (demo flow, algorithm justifications, exam Qs). Polish docs/ folder.

**Integration:** Pair programming on API contracts (Student B + C on endpoint design), integration test runs (all together), viva rehearsal (walk through demo, Q&A).

## 13. What's Shipped vs. Out of Scope

**Shipped:**
- 10 algorithms (Dijkstra, A*, Bellman-Ford, Floyd-Warshall, Kruskal, Tarjan bridges/APs, connectivity, Greedy dispatch, Hungarian, MCMF).
- 5 React pages (Lab, Dispatcher, Resilience, Reporter, Analytics).
- 60-node Pune graph, ~200 edges, SQLite persistence.
- REST API, ~20 endpoints.
- Two documentation files (README.md, VIVA_WALKTHROUGH.md).
- Locked editorial design theme (Indian Insite).

**Explicitly Out of Scope (and Why):**
- **Authentication:** Open command center for demo. Adding role-based access is 2 hours' work if needed.
- **WebSockets / Real-Time Push:** Polling (TanStack Query refetch interval) is sufficient and simpler for 4 students in 2 days.
- **Mobile App:** Responsive frontend works on mobile browsers; native app out of scope.
- **Google Maps / OSM API Integration:** Fabricated graph + react-leaflet with OpenStreetMap tiles is fast and demo-equivalent. Real-time traffic layer would require API key and add complexity.
- **ML-Based Incident Classification:** Incident category is manually entered. ML is a separate course.
- **Multi-Tenancy:** Single command center, single incident history. SaaS architecture would double scope.
- **Load Testing / Capacity Planning:** 60 nodes, 4 teams, ~10 incidents is toy scale. Real system would need stress testing; doesn't apply here.
- **Persistent User Sessions / Audit Log:** Command center assumes single shift; no login history needed.

## 14. Conclusion

This project demonstrates **algorithmic depth and system engineering** as expected for a 30%-weight subject in a 2-day sprint. It is not a toy: 10 real algorithms, implemented with rigorous complexity analysis, running on a carefully crafted graph, with live side-by-side comparison. The frontend is intentional and polished, not generic. The backend is lean and debuggable — single binary, single-header HTTP library, vendored deps. The documentation is thorough (README, viva walkthrough, this plan). The viva demo is 5 minutes, scripted, reproducible, and defensible at every step.

Success criteria:
1. All 10 algorithms run correctly and produce the expected results.
2. Algorithm Lab shows Dijkstra failing on negative weights, Bellman-Ford succeeding.
3. Dispatcher compares three strategies (Greedy, Hungarian, MCMF) with real cost deltas.
4. Resilience identifies bridges and articulation points, simulates edge closure.
5. Code is clean, well-commented, and runs without errors.
6. Student team can answer viva Qs on complexity, correctness, and design trade-offs.
