# Multi-Emergency Response Decision-Support System

An AADSA course project that demonstrates how graph algorithms and optimization methods can support emergency response decisions. The system is presented as a command-center workflow first, with an algorithm laboratory that explains the data structures and algorithms behind each visible decision.

## Demo Story

The project should be demoed as one connected flow:

1. **Dashboard** - view the current operational picture.
2. **Report Incident** - create a citizen incident report.
3. **Dispatch Teams** - compare Greedy, Hungarian, and Min-Cost Max-Flow assignment strategies.
4. **Active Incidents** - track the incident lifecycle from pending to handled.
5. **Resilience Analysis** - find weak roads and areas using MST, bridges, articulation points, and edge-closure simulation.
6. **Algorithm Lab** - explain why each algorithm exists and discuss complexity.

This framing makes the project a decision-support system, not a loose collection of algorithm demos.

## What Is Included

- C++17 backend with REST endpoints and SQLite persistence.
- React 18 frontend with an operations console and algorithm laboratory.
- 60-node Pune-inspired road graph with real neighborhood names and fabricated teaching weights.
- Algorithms: Dijkstra, A*, Bellman-Ford, Floyd-Warshall, Kruskal MST, Tarjan bridges/articulation points, connectivity analysis, Greedy dispatch, Hungarian matching, and Min-Cost Max-Flow.
- Documentation for viva explanation and reproducible local demo.

## Run Commands

### Backend

```powershell
.\build-manual\emergency_server.exe 8080 build-manual\emergency_demo.db
```

Smoke test:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/health
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

## Architecture

```text
React frontend (operations + lab)
        |
        | REST JSON
        v
C++17 WinSock HTTP backend
        |
        +-- Core graph/optimization algorithms
        +-- SQLite database seeded with areas, roads, teams, incidents
```

The backend stays deliberately compact for a course demo: one executable, one local SQLite database, and a clear REST contract.

## Main API Endpoints

- `GET /api/health`
- `GET /api/areas`
- `GET /api/edges`
- `GET /api/teams`
- `GET /api/incidents`
- `POST /api/incidents`
- `POST /api/incidents/{id}/status`
- `POST /api/route/compare`
- `GET /api/graph/mst`
- `GET /api/graph/critical`
- `POST /api/graph/connectivity`
- `POST /api/dispatch/compare`

## What To Say In Viva

**Problem:** Emergency response teams need quick routing, fair assignment, and awareness of fragile infrastructure.

**Algorithm families:** Shortest paths handle route planning, matching/flow handles team assignment, MST and Tarjan handle resilience, and heaps support efficient priority operations.

**Architecture:** React presents the workflow, C++ runs the algorithms and API, SQLite stores graph and incident data.

**Limitations:** The Pune graph is a teaching graph, not live traffic data. There is no authentication or real-time WebSocket layer. The goal is algorithmic depth and a working demo, not production deployment.

## Verification

- Frontend: `npm run build`
- Core algorithms: `.\build-manual\test_algorithms.exe`
- Backend smoke test: `GET /api/health`
