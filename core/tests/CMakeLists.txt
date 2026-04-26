add_executable(core_tests test_algorithms.cpp)
target_link_libraries(core_tests PRIVATE emergency_core)
add_test(NAME core_tests COMMAND core_tests)
