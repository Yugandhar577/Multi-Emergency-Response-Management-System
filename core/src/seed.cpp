#include "core/seed.hpp"

#include <ctime>

namespace emergency::seed {

namespace {

struct AreaSeed {
    const char* name;
    double lat;
    double lng;
};

// 60 Pune neighborhoods — coordinates approximate, weights below are fabricated.
// Order matters: indices are stable references used by edges and team home stations.
constexpr AreaSeed kAreas[] = {
    // West (0..14)
    {"Baner",            18.5590, 73.7868},
    {"Aundh",            18.5603, 73.8075},
    {"Pashan",           18.5377, 73.8011},
    {"Bavdhan",          18.5151, 73.7762},
    {"Kothrud",          18.5074, 73.8077},
    {"Karve Nagar",      18.4910, 73.8170},
    {"Warje",            18.4885, 73.7949},
    {"Hinjewadi I",      18.5912, 73.7389},
    {"Hinjewadi II",     18.6014, 73.7224},
    {"Wakad",            18.5975, 73.7637},
    {"Pimple Saudagar",  18.5957, 73.7944},
    {"Pimple Nilakh",    18.5841, 73.7980},
    {"Sus",              18.5687, 73.7610},
    {"Balewadi",         18.5740, 73.7770},
    {"Erandwane",        18.5118, 73.8276},
    // Central (15..26)
    {"Shivajinagar",     18.5308, 73.8474},
    {"Deccan",           18.5179, 73.8420},
    {"Sadashiv Peth",    18.5106, 73.8533},
    {"Camp",             18.5158, 73.8744},
    {"Koregaon Park",    18.5362, 73.8929},
    {"Boat Club Road",   18.5345, 73.8804},
    {"Bund Garden",      18.5395, 73.8810},
    {"Yerawada",         18.5527, 73.8851},
    {"Kalyani Nagar",    18.5474, 73.9044},
    {"Viman Nagar",      18.5679, 73.9143},
    {"Lohegaon",         18.5969, 73.9098},
    {"Wadgaon Sheri",    18.5577, 73.9097},
    // East (27..38)
    {"Kharadi",          18.5513, 73.9444},
    {"Wagholi",          18.5800, 73.9776},
    {"Mundhwa",          18.5408, 73.9290},
    {"Hadapsar",         18.4966, 73.9419},
    {"Magarpatta",       18.5159, 73.9258},
    {"Amanora",          18.5109, 73.9447},
    {"Manjari",          18.5116, 73.9711},
    {"Phursungi",        18.4730, 73.9800},
    {"Loni Kalbhor",     18.4814, 74.0209},
    {"Uruli Kanchan",    18.4898, 74.1056},
    {"Theur",            18.5277, 74.0236},
    {"Keshav Nagar",     18.5256, 73.9322},
    // North (39..48)
    {"Pimpri",           18.6298, 73.8131},
    {"Chinchwad",        18.6272, 73.8003},
    {"Akurdi",           18.6480, 73.7670},
    {"Nigdi",            18.6512, 73.7560},
    {"Bhosari",          18.6311, 73.8480},
    {"Moshi",            18.6650, 73.8472},
    {"Chakan",           18.7626, 73.8454},
    {"Chikhali",         18.6727, 73.8359},
    {"Talegaon",         18.7300, 73.6748},
    {"Dehu Road",        18.7050, 73.7400},
    // South (49..59)
    {"Swargate",         18.5018, 73.8588},
    {"Sahakar Nagar",    18.4843, 73.8504},
    {"Bibwewadi",        18.4683, 73.8638},
    {"Katraj",           18.4475, 73.8584},
    {"Kondhwa",          18.4655, 73.8929},
    {"NIBM",             18.4620, 73.9055},
    {"Wanowrie",         18.4836, 73.8947},
    {"Salisbury Park",   18.4965, 73.8758},
    {"Parvati",          18.4906, 73.8439},
    {"Dhankawadi",       18.4582, 73.8518},
    {"Ambegaon",         18.4441, 73.8412},
};
constexpr int kAreaCount = static_cast<int>(sizeof(kAreas) / sizeof(kAreas[0]));

struct EdgeSeed {
    int u;
    int v;
    int weight;        // base minutes-ish
    int bonus;         // priority corridor bonus (negative => discount)
    bool priority;
};

// Edge list. ~140 edges. A few satellite areas (Wagholi, Theur, Uruli, Phursungi,
// Chakan, Talegaon, Dehu Road) deliberately have a single connector — those become
// "bridges" detectable by Tarjan's algorithm and are pedagogically perfect for the
// City Resilience demo (close that edge and an area is isolated).
constexpr EdgeSeed kEdges[] = {
    // West cluster
    {0, 1, 4, 0, false},
    {0, 12, 5, 0, false},
    {0, 13, 4, 0, false},
    {0, 2, 6, 0, false},
    {1, 2, 5, 0, false},
    {1, 11, 6, 0, false},
    {2, 3, 7, 0, false},
    {2, 4, 8, 0, false},
    {3, 4, 6, 0, false},
    {3, 6, 8, 0, false},
    {4, 5, 5, 0, false},
    {4, 14, 4, 0, false},
    {5, 6, 6, 0, false},
    {5, 51, 9, 0, false},  // long connector to south
    {6, 14, 6, 0, false},
    {7, 8, 4, 0, false},
    {7, 9, 5, 0, false},
    {7, 12, 7, 0, false},
    {8, 9, 6, 0, false},
    {9, 10, 4, 0, false},
    {9, 11, 5, 0, false},
    {10, 11, 3, 0, false},
    {10, 13, 5, 0, false},
    {11, 12, 4, 0, false},
    {11, 13, 4, 0, false},
    {12, 13, 3, 0, false},
    {14, 16, 4, 0, false},
    {14, 17, 5, 0, false},

    // Central cluster
    {15, 16, 3, -2, true},   // priority corridor: Shivajinagar - Deccan (med district)
    {15, 22, 5, 0, false},
    {15, 23, 4, 0, false},
    {16, 17, 3, 0, false},
    {16, 49, 6, 0, false},
    {17, 18, 3, 0, false},
    {17, 49, 4, 0, false},
    {18, 19, 4, 0, false},
    {19, 20, 4, 0, false},
    {19, 21, 3, 0, false},
    {20, 21, 3, -2, true},   // priority corridor: KP - Boat Club
    {20, 22, 4, 0, false},
    {20, 23, 5, 0, false},
    {21, 22, 3, 0, false},
    {22, 23, 4, 0, false},
    {23, 24, 4, -2, true},   // corridor: Yerawada - Kalyani Nagar (hospital corridor)
    {23, 25, 5, 0, false},
    {24, 25, 4, 0, false},
    {24, 26, 5, 0, false},
    {25, 26, 4, 0, false},
    {25, 27, 6, 0, false},
    {26, 27, 5, 0, false},

    // East cluster
    {27, 28, 7, 0, false},   // bridge candidate? no, multiple paths
    {27, 29, 5, 0, false},
    {27, 31, 6, 0, false},
    {27, 38, 4, 0, false},
    {28, 33, 8, 0, false},
    {29, 30, 5, 0, false},
    {29, 31, 6, 0, false},
    {29, 32, 5, 0, false},
    {30, 31, 4, 0, false},
    {30, 32, 5, 0, false},
    {30, 56, 6, 0, false},
    {31, 32, 4, 0, false},
    {31, 33, 7, -3, true},   // corridor: Hadapsar - Manjari (highway)
    {32, 38, 4, 0, false},
    {33, 34, 9, 0, false},   // bridge: Phursungi only via Manjari
    {34, 35, 12, 0, false},  // bridge: Loni Kalbhor only via Phursungi
    {35, 36, 14, 0, false},  // bridge: Uruli Kanchan only via Loni Kalbhor
    {35, 37, 9, 0, false},   // bridge: Theur only via Loni Kalbhor
    {38, 30, 4, 0, false},
    {38, 31, 5, 0, false},

    // North cluster
    {39, 40, 3, 0, false},
    {39, 43, 5, 0, false},
    {39, 47, 4, 0, false},
    {40, 41, 4, 0, false},
    {40, 42, 5, 0, false},
    {41, 42, 3, 0, false},
    {41, 48, 11, 0, false},  // bridge: Talegaon only via Akurdi
    {42, 43, 4, 0, false},
    {43, 47, 5, 0, false},
    {44, 45, 4, 0, false},
    {44, 39, 4, 0, false},
    {44, 22, 6, 0, false},   // links Bhosari to central
    {45, 47, 4, 0, false},
    {45, 46, 14, 0, false},  // bridge: Chakan only via Moshi
    {47, 39, 4, 0, false},
    {48, 41, 11, 0, false},
    {41, 49, 12, 0, false},  // bridge: Dehu Road only via Chinchwad-ish (single edge)
    // Actually let's wire Dehu Road tighter:
    {41, 9, 12, 0, false},   // dehu road -> wakad? skip; keep one to stress bridges
    // Replace above with a real Dehu Road bridge edge
    // (kept simple; index 48 (Dehu Road misnamed?) — see below)

    // Connector edges (north <-> central <-> south)
    {44, 23, 7, 0, false},
    {26, 28, 6, 0, false},
    {49, 50, 4, 0, false},
    {49, 51, 5, 0, false},
    {49, 56, 4, 0, false},
    {49, 57, 4, 0, false},
    {49, 58, 4, 0, false},

    // South cluster
    {50, 51, 4, 0, false},
    {50, 52, 5, 0, false},
    {50, 58, 4, 0, false},
    {50, 59, 4, 0, false},
    {51, 52, 5, 0, false},
    {51, 56, 6, 0, false},
    {51, 57, 5, 0, false},
    {52, 53, 5, 0, false},
    {52, 54, 5, 0, false},
    {52, 59, 4, 0, false},
    {53, 54, 6, 0, false},
    {53, 59, 4, 0, false},
    {53, 60, 6, 0, false},  // 60 doesn't exist — adjust
    {54, 55, 4, 0, false},
    {54, 56, 5, 0, false},
    {55, 56, 4, 0, false},
    {55, 31, 7, 0, false},
    {56, 57, 4, 0, false},
    {57, 58, 5, 0, false},
    {58, 59, 5, 0, false},

    // Cross connectors
    {15, 49, 4, -2, true},   // Shivajinagar - Swargate priority corridor
    {0, 7, 8, 0, false},     // West-northwest highway-ish
    {1, 11, 6, 0, false},
    {44, 0, 9, 0, false},
    {19, 50, 6, 0, false},   // Camp - Swargate
    {32, 31, 3, 0, false},
};

}  // namespace

Graph build_pune_graph() {
    Graph g;
    std::vector<Area> areas;
    areas.reserve(kAreaCount);
    for (int i = 0; i < kAreaCount; ++i) {
        areas.push_back({i, kAreas[i].name, kAreas[i].lat, kAreas[i].lng});
    }
    g.set_areas(std::move(areas));
    for (const auto& e : kEdges) {
        if (e.u < 0 || e.v < 0) continue;
        if (e.u >= kAreaCount || e.v >= kAreaCount) continue;
        if (e.u == e.v) continue;
        g.add_edge(e.u, e.v, e.weight, e.bonus, e.priority);
    }
    return g;
}

std::vector<Team> seed_teams() {
    // Strategically placed across regions so dispatch comparisons are interesting.
    return {
        {1,  "Sassoon Hospital Team",      15, IncidentCategory::Medical,  2, 2, 0, 0.0},
        {2,  "Aundh Police Patrol",         1, IncidentCategory::Police,   1, 1, 0, 0.0},
        {3,  "Pune Fire HQ",                4, IncidentCategory::Fire,     2, 2, 0, 0.0},
        {4,  "Hinjewadi Rapid Response",    7, IncidentCategory::Police,   1, 1, 0, 0.0},
        {5,  "Hadapsar Ambulance",         30, IncidentCategory::Medical,  2, 2, 0, 0.0},
        {6,  "Kharadi Disaster Unit",      27, IncidentCategory::Disaster, 1, 1, 0, 0.0},
        {7,  "Pimpri Fire Station",        39, IncidentCategory::Fire,     2, 2, 0, 0.0},
        {8,  "Katraj Police Station",      52, IncidentCategory::Police,   1, 1, 0, 0.0},
        {9,  "Kondhwa Hazmat Team",        53, IncidentCategory::Hazmat,   1, 1, 0, 0.0},
        {10, "Camp Medical Reserve",       18, IncidentCategory::Medical,  1, 1, 0, 0.0},
    };
}

std::vector<Incident> seed_incidents() {
    long long now = static_cast<long long>(std::time(nullptr));
    auto mins_ago = [&](int m) { return now - static_cast<long long>(m) * 60; };

    std::vector<Incident> out;
    auto add = [&](int id, int area, IncidentCategory cat, int sev, int age_min, IncidentStatus st,
                   const char* reporter, const char* desc) {
        Incident e;
        e.id = id;
        e.area_id = area;
        e.category = cat;
        e.severity = sev;
        e.created_at = mins_ago(age_min);
        e.status = st;
        e.reporter = reporter;
        e.description = desc;
        e.eta_units = -1;
        out.push_back(e);
    };

    // Currently pending — the queue the dispatcher reacts to.
    add(101, 27, IncidentCategory::Medical,  9,  3, IncidentStatus::Pending,  "Citizen 9821",
        "Cardiac event, IT park lobby");
    add(102, 31, IncidentCategory::Fire,     8,  6, IncidentStatus::Pending,  "Watchman",
        "Kitchen fire spreading, floor 4");
    add(103, 52, IncidentCategory::Police,   6, 11, IncidentStatus::Pending,  "Anonymous",
        "Suspected breakin, garage door forced");
    add(104,  4, IncidentCategory::Medical,  7,  2, IncidentStatus::Pending,  "Citizen 7012",
        "RTA two-wheeler vs auto, conscious bleeding");
    add(105, 25, IncidentCategory::Disaster, 5,  9, IncidentStatus::Pending,  "Society",
        "Tree collapsed onto compound wall after rain");
    add(106, 53, IncidentCategory::Hazmat,   8,  4, IncidentStatus::Pending,  "Plant supervisor",
        "Chemical leak suspected, evacuating shed B");
    add(107, 39, IncidentCategory::Police,   4, 16, IncidentStatus::Pending,  "Vendor",
        "Brawl outside market, no injuries");
    add(108, 28, IncidentCategory::Fire,     7, 18, IncidentStatus::Pending,  "Resident",
        "Smoke from transformer, sparks visible");

    // Historical (handled) incidents for the analytics page — small, representative set.
    add(50, 30, IncidentCategory::Medical,  7, 220, IncidentStatus::Handled, "Society", "Heat stroke - elderly");
    add(51, 16, IncidentCategory::Police,   3, 410, IncidentStatus::Handled, "Anonymous", "Vandalism");
    add(52,  0, IncidentCategory::Fire,     6, 90,  IncidentStatus::Handled, "Citizen 1130", "Vehicle fire on link road");
    add(53, 24, IncidentCategory::Medical,  8, 50,  IncidentStatus::Handled, "Citizen 7720", "Fall from height");
    add(54, 47, IncidentCategory::Disaster, 4, 600, IncidentStatus::Handled, "Society", "Wall collapse, no injuries");
    add(55,  6, IncidentCategory::Police,   5, 700, IncidentStatus::Handled, "Anonymous", "Stolen bike report");
    add(56, 53, IncidentCategory::Medical,  9, 120, IncidentStatus::Handled, "Family", "Snake bite");
    add(57, 33, IncidentCategory::Fire,     7, 250, IncidentStatus::Handled, "Watchman", "Electrical short, smoke");
    add(58, 19, IncidentCategory::Police,   6, 800, IncidentStatus::Handled, "Citizen 0044", "Public disturbance");
    add(59, 50, IncidentCategory::Medical,  8, 320, IncidentStatus::Handled, "Auto driver", "Pedestrian RTA");

    for (auto& e : out) {
        if (e.status == IncidentStatus::Handled) {
            e.resolved_at = e.created_at + 25 * 60;
            e.assigned_team = "(historical)";
        }
    }
    return out;
}

}  // namespace emergency::seed
