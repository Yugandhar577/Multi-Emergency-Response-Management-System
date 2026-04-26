// Emergency Response HTTP server.
// MinGW on this machine does not provide std::thread, so this file uses a tiny
// single-threaded WinSock adapter instead of cpp-httplib. The REST contract stays
// the same for the React frontend.

#include "core/algorithms.hpp"
#include "core/database.hpp"
#include "core/graph.hpp"
#include "core/seed.hpp"
#include "core/types.hpp"

#include <nlohmann/json.hpp>

#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0601
#endif
#include <winsock2.h>
#include <ws2tcpip.h>

#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>

using json = nlohmann::json;
using namespace emergency;

struct HttpRequest {
    std::string method;
    std::string target;
    std::string path;
    std::map<std::string, std::string> query;
    std::string body;
};

struct HttpResponse {
    int status = 200;
    std::string content_type = "application/json";
    std::string body = "{}";
};

struct AppState {
    Database db;
    Graph graph;
    bool fw_cached_corridors = false;
    bool fw_cached_valid = false;
    algo::FloydWarshallTable fw_table;

    explicit AppState(const std::string& db_path) : db(db_path) {
        db.initialize_schema_and_seed();
        graph = db.load_graph();
    }

    algo::FloydWarshallTable get_fw(bool corridors) {
        if (!fw_cached_valid || fw_cached_corridors != corridors) {
            fw_table = algo::floyd_warshall(graph, corridors);
            fw_cached_corridors = corridors;
            fw_cached_valid = true;
        }
        return fw_table;
    }
};

static json area_to_json(const Area& a) {
    return {{"id", a.id}, {"name", a.name}, {"lat", a.lat}, {"lng", a.lng}};
}

static json edge_to_json(int idx, const Edge& e) {
    return {{"id", idx}, {"u", e.u}, {"v", e.v},
            {"weight", e.weight}, {"bonus", e.bonus}, {"priority", e.priority_corridor}};
}

static json team_to_json(const Team& t) {
    return {{"id", t.id}, {"name", t.name}, {"home_area_id", t.home_area_id},
            {"specialty", static_cast<int>(t.specialty)},
            {"capacity", t.capacity}, {"available_units", t.available_units},
            {"handled_count", t.handled_count}, {"total_response_time", t.total_response_time}};
}

static json incident_to_json(const Incident& e) {
    return {{"id", e.id}, {"area_id", e.area_id},
            {"category", static_cast<int>(e.category)},
            {"severity", e.severity},
            {"created_at", e.created_at},
            {"resolved_at", e.resolved_at},
            {"status", static_cast<int>(e.status)},
            {"assigned_team", e.assigned_team},
            {"reporter", e.reporter},
            {"description", e.description},
            {"eta_units", e.eta_units}};
}

static json path_result_to_json(const PathResult& r, const std::string& algo_name) {
    return {{"algorithm", algo_name},
            {"feasible", r.feasible},
            {"total_weight", r.feasible ? r.total_weight : -1},
            {"hops", r.hops},
            {"path", r.path},
            {"elapsed_us", r.elapsed_us},
            {"relaxations", r.relaxations},
            {"note", r.note}};
}

static json plan_to_json(const AssignmentPlan& p) {
    json out;
    out["strategy"] = p.strategy;
    out["total_cost"] = p.total_cost;
    out["elapsed_us"] = p.elapsed_us;
    out["pairs"] = json::array();
    for (const auto& pr : p.pairs) {
        out["pairs"].push_back({{"incident_id", pr.incident_id},
                                {"team_id", pr.team_id},
                                {"cost", pr.cost},
                                {"path", pr.path}});
    }
    return out;
}

static std::map<std::string, std::string> parse_query(const std::string& qs) {
    std::map<std::string, std::string> out;
    std::stringstream ss(qs);
    std::string pair;
    while (std::getline(ss, pair, '&')) {
        auto eq = pair.find('=');
        if (eq == std::string::npos) out[pair] = "";
        else out[pair.substr(0, eq)] = pair.substr(eq + 1);
    }
    return out;
}

static void split_target(HttpRequest& req) {
    auto q = req.target.find('?');
    if (q == std::string::npos) {
        req.path = req.target;
    } else {
        req.path = req.target.substr(0, q);
        req.query = parse_query(req.target.substr(q + 1));
    }
}

static bool parse_route_body(const HttpRequest& req, int& src, int& dst, bool& priority, std::string& err) {
    try {
        auto j = json::parse(req.body.empty() ? "{}" : req.body);
        src = j.value("source", -1);
        dst = j.value("destination", -1);
        priority = j.value("priority_corridors", false);
        if (src < 0 || dst < 0) {
            err = "missing source/destination";
            return false;
        }
        return true;
    } catch (const std::exception& e) {
        err = std::string("bad json: ") + e.what();
        return false;
    }
}

static HttpResponse json_response(const json& j, int status = 200) {
    HttpResponse res;
    res.status = status;
    res.body = j.dump();
    return res;
}

static HttpResponse route_request(const HttpRequest& req, AppState& app) {
    try {
        if (req.method == "OPTIONS") {
            HttpResponse res;
            res.status = 204;
            res.body.clear();
            return res;
        }

        if (req.method == "GET" && req.path == "/api/health") {
            return json_response({{"status", "ok"}, {"service", "emergency-response"}});
        }

        if (req.method == "GET" && req.path == "/api/areas") {
            json arr = json::array();
            for (const auto& a : app.graph.areas()) arr.push_back(area_to_json(a));
            return json_response(arr);
        }

        if (req.method == "GET" && req.path == "/api/edges") {
            json arr = json::array();
            for (int i = 0; i < (int)app.graph.edges().size(); ++i) {
                arr.push_back(edge_to_json(i, app.graph.edges()[i]));
            }
            return json_response(arr);
        }

        if (req.method == "GET" && req.path == "/api/teams") {
            json arr = json::array();
            for (const auto& t : app.db.load_teams()) arr.push_back(team_to_json(t));
            return json_response(arr);
        }

        if (req.method == "GET" && req.path == "/api/incidents") {
            std::vector<Incident> rows;
            auto it = req.query.find("status");
            if (it != req.query.end()) rows = app.db.load_incidents_by_status(static_cast<IncidentStatus>(std::stoi(it->second)));
            else rows = app.db.load_incidents();
            json arr = json::array();
            for (const auto& e : rows) arr.push_back(incident_to_json(e));
            return json_response(arr);
        }

        if (req.method == "POST" && req.path == "/api/incidents") {
            auto j = json::parse(req.body.empty() ? "{}" : req.body);
            Incident e;
            e.area_id = j.value("area_id", -1);
            e.category = static_cast<IncidentCategory>(j.value("category", 0));
            e.severity = j.value("severity", 5);
            e.reporter = j.value("reporter", std::string("Anonymous"));
            e.description = j.value("description", std::string(""));
            e.created_at = static_cast<long long>(std::time(nullptr));
            e.status = IncidentStatus::Pending;
            int id = app.db.insert_incident(e);
            return json_response({{"id", id}, {"status", "created"}});
        }

        const std::string handle_prefix = "/api/incidents/";
        const std::string handle_suffix = "/handle";
        if (req.method == "POST" && req.path.find(handle_prefix) == 0 &&
            req.path.size() > handle_prefix.size() + handle_suffix.size() &&
            req.path.rfind(handle_suffix) == req.path.size() - handle_suffix.size()) {
            std::string id_text = req.path.substr(handle_prefix.size(),
                req.path.size() - handle_prefix.size() - handle_suffix.size());
            int id = std::stoi(id_text);
            app.db.mark_incident_handled(id, static_cast<long long>(std::time(nullptr)));
            return json_response({{"id", id}, {"status", "handled"}});
        }

        if (req.method == "POST" && req.path.find("/api/route/") == 0) {
            std::string which = req.path.substr(std::string("/api/route/").size());
            int src = -1, dst = -1;
            bool prio = false;
            std::string err;
            if (!parse_route_body(req, src, dst, prio, err)) return json_response({{"error", err}}, 400);

            PathResult r;
            if (which == "dijkstra") r = algo::dijkstra(app.graph, src, dst, prio);
            else if (which == "astar") r = algo::astar(app.graph, src, dst, prio);
            else if (which == "bellman_ford") r = algo::bellman_ford(app.graph, src, dst, prio);
            else if (which == "floyd_warshall") r = algo::fw_query(app.get_fw(prio), src, dst);
            else if (which == "compare") {
                json out;
                out["source"] = src;
                out["destination"] = dst;
                out["priority_corridors"] = prio;
                out["results"] = json::array();
                out["results"].push_back(path_result_to_json(algo::dijkstra(app.graph, src, dst, prio), "dijkstra"));
                out["results"].push_back(path_result_to_json(algo::astar(app.graph, src, dst, prio), "astar"));
                out["results"].push_back(path_result_to_json(algo::bellman_ford(app.graph, src, dst, prio), "bellman_ford"));
                out["results"].push_back(path_result_to_json(algo::fw_query(app.get_fw(prio), src, dst), "floyd_warshall"));
                return json_response(out);
            } else {
                return json_response({{"error", "unknown route algorithm"}}, 404);
            }
            return json_response(path_result_to_json(r, which));
        }

        if (req.method == "GET" && req.path == "/api/graph/mst") {
            auto m = algo::kruskal_mst(app.graph);
            json out;
            out["total_weight"] = m.total_weight;
            out["elapsed_us"] = m.elapsed_us;
            out["edges"] = json::array();
            for (int idx : m.chosen_edge_indices) {
                const Edge& e = app.graph.edges()[idx];
                out["edges"].push_back({{"id", idx}, {"u", e.u}, {"v", e.v}, {"weight", e.weight}});
            }
            return json_response(out);
        }

        if (req.method == "GET" && req.path == "/api/graph/critical") {
            auto crit = algo::tarjan_bridges_articulations(app.graph);
            json out;
            out["bridges"] = json::array();
            for (int idx : crit.bridge_edge_indices) {
                const Edge& e = app.graph.edges()[idx];
                out["bridges"].push_back({{"id", idx}, {"u", e.u}, {"v", e.v}, {"weight", e.weight}});
            }
            out["articulation_areas"] = crit.articulation_areas;
            out["elapsed_us"] = crit.elapsed_us;
            return json_response(out);
        }

        if (req.method == "POST" && req.path == "/api/graph/connectivity") {
            auto j = json::parse(req.body.empty() ? "{}" : req.body);
            int removed = j.value("removed_edge_id", -1);
            auto rep = algo::connectivity_with_edge_removed(app.graph, removed);
            return json_response({{"component_count", rep.component_count},
                                  {"component_id", rep.component_id},
                                  {"isolated_areas", rep.isolated_areas},
                                  {"elapsed_us", rep.elapsed_us}});
        }

        if (req.method == "POST" && req.path.find("/api/dispatch/") == 0) {
            std::string strat = req.path.substr(std::string("/api/dispatch/").size());
            bool prio = false;
            if (!req.body.empty()) {
                auto j = json::parse(req.body);
                prio = j.value("priority_corridors", false);
            }
            auto teams = app.db.load_teams();
            auto pending = app.db.load_incidents_by_status(IncidentStatus::Pending);
            auto cm = algo::build_cost_matrix(app.graph, teams, pending, prio);

            if (strat == "compare") {
                json out;
                out["strategies"] = json::array();
                out["strategies"].push_back(plan_to_json(algo::greedy_nearest(app.graph, teams, pending, prio)));
                out["strategies"].push_back(plan_to_json(algo::hungarian(cm, teams, pending)));
                out["strategies"].push_back(plan_to_json(algo::min_cost_max_flow(cm, teams, pending)));
                return json_response(out);
            }

            AssignmentPlan plan;
            if (strat == "greedy") plan = algo::greedy_nearest(app.graph, teams, pending, prio);
            else if (strat == "hungarian") plan = algo::hungarian(cm, teams, pending);
            else if (strat == "mcmf") plan = algo::min_cost_max_flow(cm, teams, pending);
            else return json_response({{"error", "unknown dispatch strategy"}}, 404);
            return json_response(plan_to_json(plan));
        }

        if (req.method == "POST" && req.path == "/api/admin/reset") {
            app.db.reset_incidents();
            for (const auto& e : seed::seed_incidents()) app.db.insert_incident(e);
            return json_response({{"status", "reset"}});
        }

        return json_response({{"error", "not found"}, {"path", req.path}}, 404);
    } catch (const std::exception& e) {
        return json_response({{"error", e.what()}}, 400);
    }
}

static std::string reason_phrase(int status) {
    switch (status) {
        case 200: return "OK";
        case 204: return "No Content";
        case 400: return "Bad Request";
        case 404: return "Not Found";
        case 500: return "Internal Server Error";
        default: return "OK";
    }
}

static std::string serialize_response(const HttpResponse& res) {
    std::ostringstream out;
    out << "HTTP/1.1 " << res.status << " " << reason_phrase(res.status) << "\r\n";
    out << "Access-Control-Allow-Origin: *\r\n";
    out << "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
    out << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
    out << "Content-Type: " << res.content_type << "\r\n";
    out << "Content-Length: " << res.body.size() << "\r\n";
    out << "Connection: close\r\n\r\n";
    out << res.body;
    return out.str();
}

static bool parse_http_request(const std::string& raw, HttpRequest& req) {
    auto header_end = raw.find("\r\n\r\n");
    if (header_end == std::string::npos) return false;
    std::istringstream stream(raw.substr(0, header_end));
    std::string version;
    stream >> req.method >> req.target >> version;
    if (req.method.empty() || req.target.empty()) return false;
    req.body = raw.substr(header_end + 4);
    split_target(req);
    return true;
}

static std::string read_request(SOCKET client) {
    std::string raw;
    char buf[4096];
    int content_length = -1;
    size_t header_end = std::string::npos;

    while (true) {
        int n = recv(client, buf, sizeof(buf), 0);
        if (n <= 0) break;
        raw.append(buf, buf + n);
        header_end = raw.find("\r\n\r\n");
        if (header_end != std::string::npos && content_length < 0) {
            std::string headers = raw.substr(0, header_end);
            std::istringstream hs(headers);
            std::string line;
            while (std::getline(hs, line)) {
                if (!line.empty() && line.back() == '\r') line.pop_back();
                std::string key = "Content-Length:";
                if (line.size() >= key.size() && line.substr(0, key.size()) == key) {
                    content_length = std::atoi(line.substr(key.size()).c_str());
                }
            }
            if (content_length < 0) content_length = 0;
        }
        if (header_end != std::string::npos &&
            raw.size() >= header_end + 4 + static_cast<size_t>(content_length)) {
            break;
        }
    }
    return raw;
}

static int run_server(AppState& app, int port) {
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        std::fprintf(stderr, "fatal: WSAStartup failed\n");
        return 1;
    }

    SOCKET server = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server == INVALID_SOCKET) {
        std::fprintf(stderr, "fatal: socket failed\n");
        WSACleanup();
        return 1;
    }

    BOOL yes = TRUE;
    setsockopt(server, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char*>(&yes), sizeof(yes));

    sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(static_cast<unsigned short>(port));

    if (bind(server, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) == SOCKET_ERROR ||
        listen(server, SOMAXCONN) == SOCKET_ERROR) {
        std::fprintf(stderr, "fatal: bind/listen failed on port %d\n", port);
        closesocket(server);
        WSACleanup();
        return 1;
    }

    std::printf("Emergency Response API listening on http://127.0.0.1:%d\n", port);
    std::printf("GET /api/health for a smoke test.\n");

    while (true) {
        SOCKET client = accept(server, nullptr, nullptr);
        if (client == INVALID_SOCKET) continue;

        std::string raw = read_request(client);
        HttpRequest req;
        HttpResponse res;
        if (parse_http_request(raw, req)) res = route_request(req, app);
        else res = json_response({{"error", "bad request"}}, 400);

        std::string wire = serialize_response(res);
        send(client, wire.c_str(), static_cast<int>(wire.size()), 0);
        closesocket(client);
    }
}

int main(int argc, char** argv) {
    int port = 8080;
    std::string db_path = "emergency.db";
    if (argc >= 2) port = std::atoi(argv[1]);
    if (argc >= 3) db_path = argv[2];

    try {
        AppState app(db_path);
        return run_server(app, port);
    } catch (const std::exception& e) {
        std::fprintf(stderr, "fatal: %s\n", e.what());
        return 1;
    }
}
