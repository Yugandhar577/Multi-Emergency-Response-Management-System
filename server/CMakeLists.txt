add_executable(emergency_server main.cpp)
target_link_libraries(emergency_server PRIVATE emergency_core nlohmann_json::nlohmann_json)

if(WIN32)
  target_link_libraries(emergency_server PRIVATE ws2_32)
  target_compile_definitions(emergency_server PRIVATE _WIN32_WINNT=0x0601)
endif()
