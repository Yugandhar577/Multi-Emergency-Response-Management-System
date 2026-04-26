#include "core/database.hpp"
#include "core/seed.hpp"

#include <sqlite3.h>

#include <stdexcept>
#include <string>

namespace emergency {

namespace {

void check(int rc, sqlite3* db, const std::string& where) {
    if (rc != SQLITE_OK && rc != SQLITE_DONE && rc != SQLITE_ROW) {
        std::string msg = where + ": " + (db ? sqlite3_errmsg(db) : "?");
        throw std::runtime_error(msg);
    }
}

class Stmt {
public:
    Stmt(sqlite3* db, const char* sql) : db_(db) {
        if (sqlite3_prepare_v2(db, sql, -1, &stmt_, nullptr) != SQLITE_OK) {
            throw std::runtime_error(std::string("prepare: ") + sqlite3_errmsg(db));
        }
    }
    ~Stmt() { if (stmt_) sqlite3_finalize(stmt_); }
    Stmt(const Stmt&) = delete;
    Stmt& operator=(const Stmt&) = delete;
    sqlite3_stmt* get() { return stmt_; }
private:
    sqlite3* db_;
    sqlite3_stmt* stmt_ = nullptr;
};

}  // namespace

Database::Database(const std::string& path) {
    if (sqlite3_open(path.c_str(), &db_) != SQLITE_OK) {
        std::string msg = sqlite3_errmsg(db_);
        sqlite3_close(db_);
        db_ = nullptr;
        throw std::runtime_error("Cannot open database: " + msg);
    }
    exec("PRAGMA foreign_keys = ON;");
    exec("PRAGMA journal_mode = WAL;");
}

Database::~Database() {
    if (db_) sqlite3_close(db_);
}

void Database::exec(const char* sql) {
    char* err = nullptr;
    if (sqlite3_exec(db_, sql, nullptr, nullptr, &err) != SQLITE_OK) {
        std::string m = err ? err : "exec failed";
        sqlite3_free(err);
        throw std::runtime_error(m);
    }
}

void Database::initialize_schema_and_seed() {
    exec(
        "CREATE TABLE IF NOT EXISTS areas ("
        "  id INTEGER PRIMARY KEY,"
        "  name TEXT NOT NULL,"
        "  lat REAL NOT NULL,"
        "  lng REAL NOT NULL"
        ");"

        "CREATE TABLE IF NOT EXISTS edges ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  u INTEGER NOT NULL REFERENCES areas(id),"
        "  v INTEGER NOT NULL REFERENCES areas(id),"
        "  weight INTEGER NOT NULL,"
        "  bonus INTEGER NOT NULL DEFAULT 0,"
        "  priority INTEGER NOT NULL DEFAULT 0"
        ");"

        "CREATE TABLE IF NOT EXISTS teams ("
        "  id INTEGER PRIMARY KEY,"
        "  name TEXT NOT NULL,"
        "  home_area_id INTEGER NOT NULL REFERENCES areas(id),"
        "  specialty INTEGER NOT NULL,"
        "  capacity INTEGER NOT NULL DEFAULT 1,"
        "  available_units INTEGER NOT NULL DEFAULT 1,"
        "  handled_count INTEGER NOT NULL DEFAULT 0,"
        "  total_response_time REAL NOT NULL DEFAULT 0"
        ");"

        "CREATE TABLE IF NOT EXISTS incidents ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  area_id INTEGER NOT NULL REFERENCES areas(id),"
        "  category INTEGER NOT NULL,"
        "  severity INTEGER NOT NULL,"
        "  created_at INTEGER NOT NULL,"
        "  resolved_at INTEGER NOT NULL DEFAULT 0,"
        "  status INTEGER NOT NULL DEFAULT 0,"
        "  assigned_team TEXT NOT NULL DEFAULT '',"
        "  reporter TEXT NOT NULL DEFAULT '',"
        "  description TEXT NOT NULL DEFAULT '',"
        "  eta_units INTEGER NOT NULL DEFAULT -1"
        ");"
        "CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);"
        "CREATE INDEX IF NOT EXISTS idx_incidents_area ON incidents(area_id);"
    );

    // Seed only if areas is empty.
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "SELECT COUNT(*) FROM areas;", -1, &stmt, nullptr) != SQLITE_OK)
        throw std::runtime_error(sqlite3_errmsg(db_));
    int areas_count = 0;
    if (sqlite3_step(stmt) == SQLITE_ROW) areas_count = sqlite3_column_int(stmt, 0);
    sqlite3_finalize(stmt);
    if (areas_count > 0) return;

    Graph g = seed::build_pune_graph();
    auto teams = seed::seed_teams();
    auto incidents = seed::seed_incidents();

    exec("BEGIN;");
    {
        Stmt ins(db_, "INSERT INTO areas(id,name,lat,lng) VALUES(?,?,?,?);");
        for (const auto& a : g.areas()) {
            sqlite3_reset(ins.get());
            sqlite3_bind_int(ins.get(), 1, a.id);
            sqlite3_bind_text(ins.get(), 2, a.name.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_double(ins.get(), 3, a.lat);
            sqlite3_bind_double(ins.get(), 4, a.lng);
            if (sqlite3_step(ins.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
        }
    }
    {
        Stmt ins(db_, "INSERT INTO edges(u,v,weight,bonus,priority) VALUES(?,?,?,?,?);");
        for (const auto& e : g.edges()) {
            sqlite3_reset(ins.get());
            sqlite3_bind_int(ins.get(), 1, e.u);
            sqlite3_bind_int(ins.get(), 2, e.v);
            sqlite3_bind_int(ins.get(), 3, e.weight);
            sqlite3_bind_int(ins.get(), 4, e.bonus);
            sqlite3_bind_int(ins.get(), 5, e.priority_corridor ? 1 : 0);
            if (sqlite3_step(ins.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
        }
    }
    {
        Stmt ins(db_,
            "INSERT INTO teams(id,name,home_area_id,specialty,capacity,available_units,handled_count,total_response_time)"
            " VALUES(?,?,?,?,?,?,?,?);");
        for (const auto& t : teams) {
            sqlite3_reset(ins.get());
            sqlite3_bind_int(ins.get(), 1, t.id);
            sqlite3_bind_text(ins.get(), 2, t.name.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_int(ins.get(), 3, t.home_area_id);
            sqlite3_bind_int(ins.get(), 4, static_cast<int>(t.specialty));
            sqlite3_bind_int(ins.get(), 5, t.capacity);
            sqlite3_bind_int(ins.get(), 6, t.available_units);
            sqlite3_bind_int(ins.get(), 7, t.handled_count);
            sqlite3_bind_double(ins.get(), 8, t.total_response_time);
            if (sqlite3_step(ins.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
        }
    }
    {
        Stmt ins(db_,
            "INSERT INTO incidents(id,area_id,category,severity,created_at,resolved_at,status,assigned_team,reporter,description,eta_units)"
            " VALUES(?,?,?,?,?,?,?,?,?,?,?);");
        for (const auto& e : incidents) {
            sqlite3_reset(ins.get());
            sqlite3_bind_int(ins.get(), 1, e.id);
            sqlite3_bind_int(ins.get(), 2, e.area_id);
            sqlite3_bind_int(ins.get(), 3, static_cast<int>(e.category));
            sqlite3_bind_int(ins.get(), 4, e.severity);
            sqlite3_bind_int64(ins.get(), 5, e.created_at);
            sqlite3_bind_int64(ins.get(), 6, e.resolved_at);
            sqlite3_bind_int(ins.get(), 7, static_cast<int>(e.status));
            sqlite3_bind_text(ins.get(), 8, e.assigned_team.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(ins.get(), 9, e.reporter.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(ins.get(), 10, e.description.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_int(ins.get(), 11, e.eta_units);
            if (sqlite3_step(ins.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
        }
    }
    exec("COMMIT;");
}

Graph Database::load_graph() {
    Graph g;
    std::vector<Area> areas;

    {
        Stmt q(db_, "SELECT id,name,lat,lng FROM areas ORDER BY id;");
        while (sqlite3_step(q.get()) == SQLITE_ROW) {
            Area a;
            a.id = sqlite3_column_int(q.get(), 0);
            const unsigned char* nm = sqlite3_column_text(q.get(), 1);
            a.name = nm ? reinterpret_cast<const char*>(nm) : "";
            a.lat = sqlite3_column_double(q.get(), 2);
            a.lng = sqlite3_column_double(q.get(), 3);
            areas.push_back(a);
        }
    }
    g.set_areas(std::move(areas));

    {
        Stmt q(db_, "SELECT u,v,weight,bonus,priority FROM edges;");
        while (sqlite3_step(q.get()) == SQLITE_ROW) {
            int u = sqlite3_column_int(q.get(), 0);
            int v = sqlite3_column_int(q.get(), 1);
            int w = sqlite3_column_int(q.get(), 2);
            int b = sqlite3_column_int(q.get(), 3);
            bool p = sqlite3_column_int(q.get(), 4) != 0;
            g.add_edge(u, v, w, b, p);
        }
    }
    return g;
}

std::vector<Team> Database::load_teams() {
    Stmt q(db_, "SELECT id,name,home_area_id,specialty,capacity,available_units,handled_count,total_response_time FROM teams ORDER BY id;");
    std::vector<Team> out;
    while (sqlite3_step(q.get()) == SQLITE_ROW) {
        Team t;
        t.id = sqlite3_column_int(q.get(), 0);
        const unsigned char* nm = sqlite3_column_text(q.get(), 1);
        t.name = nm ? reinterpret_cast<const char*>(nm) : "";
        t.home_area_id = sqlite3_column_int(q.get(), 2);
        t.specialty = static_cast<IncidentCategory>(sqlite3_column_int(q.get(), 3));
        t.capacity = sqlite3_column_int(q.get(), 4);
        t.available_units = sqlite3_column_int(q.get(), 5);
        t.handled_count = sqlite3_column_int(q.get(), 6);
        t.total_response_time = sqlite3_column_double(q.get(), 7);
        out.push_back(t);
    }
    return out;
}

static Incident read_incident_row(sqlite3_stmt* s) {
    Incident e;
    e.id = sqlite3_column_int(s, 0);
    e.area_id = sqlite3_column_int(s, 1);
    e.category = static_cast<IncidentCategory>(sqlite3_column_int(s, 2));
    e.severity = sqlite3_column_int(s, 3);
    e.created_at = sqlite3_column_int64(s, 4);
    e.resolved_at = sqlite3_column_int64(s, 5);
    e.status = static_cast<IncidentStatus>(sqlite3_column_int(s, 6));
    const unsigned char* a = sqlite3_column_text(s, 7); e.assigned_team = a ? reinterpret_cast<const char*>(a) : "";
    const unsigned char* r = sqlite3_column_text(s, 8); e.reporter = r ? reinterpret_cast<const char*>(r) : "";
    const unsigned char* d = sqlite3_column_text(s, 9); e.description = d ? reinterpret_cast<const char*>(d) : "";
    e.eta_units = sqlite3_column_int(s, 10);
    return e;
}

std::vector<Incident> Database::load_incidents() {
    Stmt q(db_,
        "SELECT id,area_id,category,severity,created_at,resolved_at,status,assigned_team,reporter,description,eta_units"
        " FROM incidents ORDER BY created_at DESC;");
    std::vector<Incident> out;
    while (sqlite3_step(q.get()) == SQLITE_ROW) out.push_back(read_incident_row(q.get()));
    return out;
}

std::vector<Incident> Database::load_incidents_by_status(IncidentStatus status) {
    Stmt q(db_,
        "SELECT id,area_id,category,severity,created_at,resolved_at,status,assigned_team,reporter,description,eta_units"
        " FROM incidents WHERE status=? ORDER BY severity DESC, created_at ASC;");
    sqlite3_bind_int(q.get(), 1, static_cast<int>(status));
    std::vector<Incident> out;
    while (sqlite3_step(q.get()) == SQLITE_ROW) out.push_back(read_incident_row(q.get()));
    return out;
}

int Database::insert_incident(const Incident& e) {
    Stmt ins(db_,
        "INSERT INTO incidents(area_id,category,severity,created_at,resolved_at,status,assigned_team,reporter,description,eta_units)"
        " VALUES(?,?,?,?,?,?,?,?,?,?);");
    sqlite3_bind_int(ins.get(), 1, e.area_id);
    sqlite3_bind_int(ins.get(), 2, static_cast<int>(e.category));
    sqlite3_bind_int(ins.get(), 3, e.severity);
    sqlite3_bind_int64(ins.get(), 4, e.created_at);
    sqlite3_bind_int64(ins.get(), 5, e.resolved_at);
    sqlite3_bind_int(ins.get(), 6, static_cast<int>(e.status));
    sqlite3_bind_text(ins.get(), 7, e.assigned_team.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(ins.get(), 8, e.reporter.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(ins.get(), 9, e.description.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(ins.get(), 10, e.eta_units);
    if (sqlite3_step(ins.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
    return static_cast<int>(sqlite3_last_insert_rowid(db_));
}

void Database::update_incident_status(int id, IncidentStatus status, const std::string& assigned_team, int eta_units) {
    Stmt up(db_, "UPDATE incidents SET status=?, assigned_team=?, eta_units=? WHERE id=?;");
    sqlite3_bind_int(up.get(), 1, static_cast<int>(status));
    sqlite3_bind_text(up.get(), 2, assigned_team.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(up.get(), 3, eta_units);
    sqlite3_bind_int(up.get(), 4, id);
    if (sqlite3_step(up.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
}

void Database::mark_incident_handled(int id, long long resolved_at) {
    Stmt up(db_, "UPDATE incidents SET status=?, resolved_at=? WHERE id=?;");
    sqlite3_bind_int(up.get(), 1, static_cast<int>(IncidentStatus::Handled));
    sqlite3_bind_int64(up.get(), 2, resolved_at);
    sqlite3_bind_int(up.get(), 3, id);
    if (sqlite3_step(up.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
}

void Database::update_team_availability(int team_id, int available_units) {
    Stmt up(db_, "UPDATE teams SET available_units=? WHERE id=?;");
    sqlite3_bind_int(up.get(), 1, available_units);
    sqlite3_bind_int(up.get(), 2, team_id);
    if (sqlite3_step(up.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
}

void Database::increment_team_handled(int team_id, double response_time_units) {
    Stmt up(db_,
        "UPDATE teams SET handled_count=handled_count+1, total_response_time=total_response_time+?,"
        "                 available_units=MIN(capacity, available_units+1) WHERE id=?;");
    sqlite3_bind_double(up.get(), 1, response_time_units);
    sqlite3_bind_int(up.get(), 2, team_id);
    if (sqlite3_step(up.get()) != SQLITE_DONE) throw std::runtime_error(sqlite3_errmsg(db_));
}

void Database::reset_incidents() {
    exec("DELETE FROM incidents;");
}

}  // namespace emergency
