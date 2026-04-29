#pragma once

#include <cstdint>
#include <limits>
#include <string>
#include <vector>

namespace emergency {

constexpr int INF = std::numeric_limits<int>::max() / 4;
constexpr double DINF = 1e15;

struct Area {
    int id = 0;
    std::string name;
    double lat = 0.0;
    double lng = 0.0;
};

struct Edge {
    int u = 0;
    int v = 0;
    int weight = 0;          // base weight (units ~ minutes)
    int bonus = 0;           // negative bonus for priority corridor (so effective = weight + bonus)
    bool priority_corridor = false;
};

enum class IncidentStatus : int {
    Pending = 0,
    Assigned = 1,
    Handled = 2,
    EnRoute = 3,
    OnScene = 4
};

enum class IncidentCategory : int {
    Medical = 0,
    Fire = 1,
    Police = 2,
    Disaster = 3,
    Hazmat = 4
};

struct Incident {
    int id = 0;
    int area_id = 0;
    IncidentCategory category = IncidentCategory::Medical;
    int severity = 5;        // 1..10
    long long created_at = 0;
    long long resolved_at = 0;
    IncidentStatus status = IncidentStatus::Pending;
    std::string assigned_team;
    std::string reporter;
    std::string description;
    int eta_units = -1;
};

struct Team {
    int id = 0;
    std::string name;
    int home_area_id = 0;
    IncidentCategory specialty = IncidentCategory::Medical;
    int capacity = 1;        // units (vehicles) available
    int available_units = 1;
    int handled_count = 0;
    double total_response_time = 0.0;
};

struct PathResult {
    int total_weight = INF;
    int hops = 0;
    std::vector<int> path;       // area ids in order
    long long elapsed_us = 0;
    bool feasible = false;
    std::string note;            // e.g. "negative cycle detected"
    int relaxations = 0;         // educational metric
};

struct AssignmentPlan {
    struct Pair {
        int incident_id;
        int team_id;
        int cost;                 // route weight
        std::vector<int> path;    // area-id path team -> incident
    };
    std::vector<Pair> pairs;
    long long total_cost = 0;
    long long elapsed_us = 0;
    std::string strategy;
};

}  // namespace emergency
