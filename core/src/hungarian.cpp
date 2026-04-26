#include "core/algorithms.hpp"

#include <algorithm>
#include <chrono>
#include <vector>

namespace emergency::algo {

// O(n^3) Hungarian (Jonker-Volgenant style with potentials). Solves min-cost
// perfect assignment on a square cost matrix. We pad rectangular team x incident
// to a square matrix with INF dummy rows/cols, then ignore dummy assignments.
//
// Reference: classic competitive-programming variant — well-tested.
AssignmentPlan hungarian(const CostMatrix& m,
                         const std::vector<Team>& teams,
                         const std::vector<Incident>& pending) {
    AssignmentPlan plan;
    plan.strategy = "hungarian";
    auto t0 = std::chrono::steady_clock::now();

    int n_teams = m.n_teams;
    int n_inc = m.n_incidents;
    if (n_teams == 0 || n_inc == 0) {
        plan.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                              std::chrono::steady_clock::now() - t0).count();
        return plan;
    }

    // We expand teams by their available_units so a team with 2 units can take 2 incidents.
    std::vector<int> row_team_index;  // for each expanded row, which team index
    for (int i = 0; i < n_teams; ++i) {
        for (int u = 0; u < std::max(1, teams[i].available_units); ++u) {
            row_team_index.push_back(i);
        }
    }
    int n_rows = (int)row_team_index.size();

    int N = std::max(n_rows, n_inc);

    // Build cost a[1..N][1..N], 1-indexed for the classic implementation.
    const int BIG = INF / 4;
    std::vector<std::vector<int>> a(N + 1, std::vector<int>(N + 1, BIG));
    for (int i = 0; i < N; ++i) {
        for (int j = 0; j < N; ++j) {
            int c = BIG;
            if (i < n_rows && j < n_inc) {
                int t = row_team_index[i];
                int v = m.cost[t][j];
                if (v < INF) c = v;
            } else if (j >= n_inc) {
                c = 0;  // real/dummy rows can remain unused via dummy incident columns
            } else if (i >= n_rows) {
                c = BIG;  // avoid assigning real incidents to dummy teams when capacity exists
            }
            a[i + 1][j + 1] = c;
        }
    }

    std::vector<int> u(N + 1, 0), v(N + 1, 0), p(N + 1, 0), way(N + 1, 0);
    for (int i = 1; i <= N; ++i) {
        p[0] = i;
        int j0 = 0;
        std::vector<int> minv(N + 1, BIG);
        std::vector<bool> used(N + 1, false);
        do {
            used[j0] = true;
            int i0 = p[j0];
            int delta = BIG;
            int j1 = 0;
            for (int j = 1; j <= N; ++j) {
                if (used[j]) continue;
                int cur = a[i0][j] - u[i0] - v[j];
                if (cur < minv[j]) {
                    minv[j] = cur;
                    way[j] = j0;
                }
                if (minv[j] < delta) {
                    delta = minv[j];
                    j1 = j;
                }
            }
            for (int j = 0; j <= N; ++j) {
                if (used[j]) {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }
            j0 = j1;
        } while (p[j0] != 0);
        do {
            int j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
        } while (j0);
    }

    // p[j] = i means row i is matched to column j.
    std::vector<int> assigned_col_for_row(N + 1, 0);
    for (int j = 1; j <= N; ++j) assigned_col_for_row[p[j]] = j;

    // Track which units each real team has used so we can reconstruct paths correctly.
    for (int row = 0; row < n_rows; ++row) {
        int col = assigned_col_for_row[row + 1] - 1;
        if (col < 0 || col >= n_inc) continue;
        int team_idx = row_team_index[row];
        if (m.cost[team_idx][col] >= INF) continue;
        AssignmentPlan::Pair pair;
        pair.incident_id = pending[col].id;
        pair.team_id = teams[team_idx].id;
        pair.cost = m.cost[team_idx][col];
        pair.path = m.path[team_idx][col];
        plan.pairs.push_back(pair);
        plan.total_cost += pair.cost;
    }

    plan.elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                          std::chrono::steady_clock::now() - t0).count();
    return plan;
}

}  // namespace emergency::algo
