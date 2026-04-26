#pragma once

#include "graph.hpp"
#include "types.hpp"

#include <memory>
#include <string>
#include <vector>

struct sqlite3;

namespace emergency {

class Database {
public:
    explicit Database(const std::string& path);
    ~Database();

    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;

    // First-time seed if tables empty — uses seed::build_pune_graph() / seed_teams() / seed_incidents().
    void initialize_schema_and_seed();

    // Reads
    Graph load_graph();
    std::vector<Team> load_teams();
    std::vector<Incident> load_incidents();
    std::vector<Incident> load_incidents_by_status(IncidentStatus status);

    // Writes
    int  insert_incident(const Incident& e);
    void update_incident_status(int id, IncidentStatus status, const std::string& assigned_team, int eta_units);
    void mark_incident_handled(int id, long long resolved_at);
    void update_team_availability(int team_id, int available_units);
    void increment_team_handled(int team_id, double response_time_units);

    // Reseed: drops existing rows in incidents and re-creates the demo set.
    void reset_incidents();

private:
    void exec(const char* sql);
    sqlite3* db_ = nullptr;
};

}  // namespace emergency
