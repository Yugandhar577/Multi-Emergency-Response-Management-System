# Multi-Emergency Response Management System

City-scale emergency dispatch showcase for AADSA. The project combines a C++17 algorithm/API backend with a React 18 frontend to demonstrate routing, assignment, and resilience analysis on a 60-area Pune graph.

## What Is Included

- 10 algorithms: Dijkstra, A*, Bellman-Ford, Floyd-Warshall, Kruskal MST, Tarjan bridges/articulation points, edge-removal connectivity, greedy dispatch, Hungarian matching, and min-cost max-flow.
- 5 frontend views: Algorithm Lab, Dispatcher, City Resilience, Citizen Reporter, and Analytics.
- SQLite persistence seeded with areas, roads, response teams, and demo incidents.
- Offline-friendly vendored backend dependencies: SQLite and nlohmann/json.

## Verified Run Commands

### Backend

This repo includes a prebuilt working binary produced during verification:

```powershell
.\build-manual\emergency_server.exe 8080 build-manual\emergency_demo.db
```

Smoke test:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/health
```

If you need to rebuild with the MinGW compiler installed at `C:\MinGW\bin`:

```powershell
g++ -std=c++17 -D_WIN32_WINNT=0x0601 -Icore/include -Ifrontend/third_party/json/single_include -Ifrontend/third_party/sqlite-amalgamation server/main.cpp core/src/graph.cpp core/src/dijkstra.cpp core/src/astar.cpp core/src/bellman_ford.cpp core/src/floyd_warshall.cpp core/src/kruskal_mst.cpp core/src/dsu.cpp core/src/tarjan.cpp core/src/hungarian.cpp core/src/mcmf.cpp core/src/dispatch.cpp core/src/database.cpp core/src/seed.cpp build-manual/sqlite3.o -lws2_32 -o build-manual/emergency_server.exe
```

### Frontend

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173
```

Production build:

```powershell
cd frontend
npm run build
```

## Verification Completed

- `npm run build` passes.
- Core algorithm self-test passes via `build-manual/test_algorithms.exe`.
- Backend API responds on `http://127.0.0.1:8080`.
- Playwright browser smoke test loaded all 5 pages and exercised route comparison, dispatch comparison, and incident reporting with no console errors or warnings.

## Main API Endpoints

- `GET /api/health`
- `GET /api/areas`
- `GET /api/edges`
- `GET /api/teams`
- `GET /api/incidents?status=0`
- `POST /api/incidents`
- `POST /api/route/compare`
- `GET /api/graph/mst`
- `GET /api/graph/critical`
- `POST /api/graph/connectivity`
- `POST /api/dispatch/compare`

## Notes

The current Windows backend uses a compact single-threaded WinSock HTTP adapter so it builds with the available MinGW toolchain, which lacks `std::thread`. The algorithm and persistence layers remain standard C++17, and the REST contract remains the same for the frontend.
