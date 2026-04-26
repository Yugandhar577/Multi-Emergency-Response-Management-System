cmake_minimum_required(VERSION 3.16)
project(emergency_response CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_C_STANDARD 11)

if(MSVC)
  add_compile_options(/W3 /utf-8 /EHsc)
  add_definitions(-D_CRT_SECURE_NO_WARNINGS)
else()
  add_compile_options(-Wall -Wextra -Wpedantic -Wno-unused-parameter)
endif()

set(THIRD_PARTY_DIR ${CMAKE_CURRENT_SOURCE_DIR}/frontend/third_party)

# nlohmann/json and SQLite are vendored so the backend builds offline.
add_library(nlohmann_json_headers INTERFACE)
target_include_directories(nlohmann_json_headers INTERFACE
  ${THIRD_PARTY_DIR}/json/single_include
)
add_library(nlohmann_json::nlohmann_json ALIAS nlohmann_json_headers)

add_library(sqlite3 STATIC ${THIRD_PARTY_DIR}/sqlite-amalgamation/sqlite3.c)
target_include_directories(sqlite3 PUBLIC ${THIRD_PARTY_DIR}/sqlite-amalgamation)
target_compile_definitions(sqlite3 PUBLIC SQLITE_THREADSAFE=1 SQLITE_ENABLE_RTREE=1)
if(UNIX)
  target_link_libraries(sqlite3 PUBLIC pthread dl m)
endif()

add_subdirectory(core)
add_subdirectory(server)

enable_testing()
add_subdirectory(core/tests)
