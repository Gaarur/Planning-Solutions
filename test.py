# Quick demo test script
import pandas as pd
import io

# Sample usage with the demo data
def test_demo():
    # Create the CSV content in memory for testing
    csv_content = """node,lat,long,node_type
depot_north,28.7041,77.1025,starting_point
depot_south,28.5355,77.3910,starting_point
store_001,28.6139,77.2090,store
store_002,28.6219,77.2419,store
store_003,28.5355,77.2466,store
store_004,28.5244,77.1855,store
store_005,28.6792,77.2069,store"""
    
    # Save to file and test
    with open('demo_locations.csv', 'w') as f:
        f.write(csv_content)
    
    # Initialize optimizer
    from runner import EnhancedBeatPlanningOptimizer
    
    optimizer = EnhancedBeatPlanningOptimizer('demo_locations.csv')
    
    print("=== DEMO SCENARIO 1: Relaxed Constraints ===")
    solution1 = optimizer.solve_beat_planning(
        num_salespeople=4,
        daily_working_hours=8,
        max_daily_distance_km=200
    )
    optimizer.print_solution(solution1)
    
    print("\n=== DEMO SCENARIO 2: Tight Constraints ===")
    solution2 = optimizer.solve_beat_planning(
        num_salespeople=2,
        daily_working_hours=5,
        max_daily_distance_km=80
    )
    optimizer.print_solution(solution2)
    
    # Export results
    if solution1:
        optimizer.export_routes_to_csv(solution1, 'demo_routes_relaxed.csv')
    if solution2:
        optimizer.export_routes_to_csv(solution2, 'demo_routes_tight.csv')

# Expected outcomes:
print("""
EXPECTED RESULTS:

SCENARIO 1 (Relaxed): 
- Should cover 45-50 stores (90-100%)
- 4 salespeople with balanced routes
- Routes of 40-60km each

SCENARIO 2 (Tight):
- Should cover 20-30 stores (40-60%)
- 2 salespeople with shorter routes  
- 20+ uncovered stores with suggestions
- Routes under 80km each
""")

if __name__ == "__main__":
    test_demo()