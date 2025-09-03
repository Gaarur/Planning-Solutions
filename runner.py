# ENHANCED VERSION WITH UNCOVERED STORES HANDLING
from planner import BeatPlanningOptimizer
import pandas as pd
import numpy as np
import math

class EnhancedBeatPlanningOptimizer(BeatPlanningOptimizer):
    
    def solve_beat_planning(self, num_salespeople, target_stores_per_day=None, 
                          daily_working_hours=8, max_daily_distance_km=200,
                          allow_partial_coverage=True):
        """
        Enhanced version that handles uncovered stores
        """
        
        print(f"Solving beat planning for {num_salespeople} salespeople...")
        print(f"Total stores: {self.num_stores}")
        
        # Try to solve with current constraints
        solution = super().solve_beat_planning(
            num_salespeople, target_stores_per_day, 
            daily_working_hours, max_daily_distance_km
        )
        
        if solution:
            # Check coverage and identify uncovered stores
            covered_stores = set()
            for route in solution['routes']:
                for location in route['route']:
                    if location['type'] == 'store':
                        covered_stores.add(location['node'])
            
            all_store_nodes = set(self.stores['node'].tolist())
            uncovered_nodes = all_store_nodes - covered_stores
            
            # Add uncovered stores info to solution
            solution['uncovered_stores'] = []
            for node in uncovered_nodes:
                store_info = self.stores[self.stores['node'] == node].iloc[0]
                solution['uncovered_stores'].append({
                    'node': node,
                    'lat': store_info['lat'],
                    'long': store_info['long'],
                    'reason': self._analyze_uncovered_reason(node, daily_working_hours, max_daily_distance_km)
                })
            
            solution['summary']['uncovered_count'] = len(uncovered_nodes)
            solution['summary']['coverage_percentage'] = (len(covered_stores) / len(all_store_nodes)) * 100
            
            if uncovered_nodes and not allow_partial_coverage:
                print(f"WARNING: {len(uncovered_nodes)} stores cannot be covered with current constraints!")
                return self._suggest_constraint_adjustments(solution)
            
        return solution
    
    def _analyze_uncovered_reason(self, store_node, daily_hours, max_distance_km):
        """Analyze why a store couldn't be covered"""
        store_idx = self.stores[self.stores['node'] == store_node].index[0]
        store_location_idx = store_idx + self.num_starting_points  # Adjust for starting points
        
        # Find minimum distance to any starting point
        min_distance_to_depot = float('inf')
        for depot_idx in range(self.num_starting_points):
            distance = self.distance_matrix[depot_idx][store_location_idx]
            min_distance_to_depot = min(min_distance_to_depot, distance)
        
        # Check if round trip exceeds distance constraint
        round_trip_distance = min_distance_to_depot * 2  # meters
        if round_trip_distance > max_distance_km * 1000:
            return f"Distance constraint exceeded (needs {round_trip_distance/1000:.1f} km, limit: {max_distance_km} km)"
        
        # Check if round trip exceeds time constraint
        round_trip_time = (round_trip_distance / ((40 * 1000) / 60)) + 30  # 40 kmh + 30 min service
        if round_trip_time > daily_hours * 60:
            return f"Time constraint exceeded (needs {round_trip_time/60:.1f} hours, limit: {daily_hours} hours)"
        
        return "Complex routing constraint (try increasing salespeople or relaxing constraints)"
    
    def _suggest_constraint_adjustments(self, solution):
        """Suggest how to adjust constraints to cover all stores"""
        uncovered_count = len(solution['uncovered_stores'])
        
        suggestions = {
            'current_coverage': solution['summary']['coverage_percentage'],
            'uncovered_stores': uncovered_count,
            'suggestions': []
        }
        
        # Analyze reasons for uncoverage
        distance_issues = sum(1 for store in solution['uncovered_stores'] 
                            if 'Distance constraint' in store['reason'])
        time_issues = sum(1 for store in solution['uncovered_stores'] 
                        if 'Time constraint' in store['reason'])
        
        if distance_issues > 0:
            suggestions['suggestions'].append(
                f"Increase max_daily_distance_km (currently affects {distance_issues} stores)"
            )
        
        if time_issues > 0:
            suggestions['suggestions'].append(
                f"Increase daily_working_hours (currently affects {time_issues} stores)"
            )
        
        if uncovered_count > 2:
            suggestions['suggestions'].append(
                f"Add more salespeople (currently {len(solution['routes'])}, suggest +{math.ceil(uncovered_count/3)})"
            )
        
        solution['improvement_suggestions'] = suggestions
        return solution
    
    def print_solution(self, solution):
        """Enhanced solution printing with uncovered stores"""
        if not solution:
            print("No solution to display")
            return
        
        # Print basic solution
        super().print_solution(solution)
        
        # Print uncovered stores information
        if solution.get('uncovered_stores'):
            print(f"\n⚠️  UNCOVERED STORES ({len(solution['uncovered_stores'])}):")
            print("-" * 50)
            for store in solution['uncovered_stores']:
                print(f"  {store['node']}: {store['reason']}")
        
        # Print improvement suggestions
        if solution.get('improvement_suggestions'):
            suggestions = solution['improvement_suggestions']
            print(f"\n💡 IMPROVEMENT SUGGESTIONS:")
            print("-" * 50)
            print(f"Current Coverage: {suggestions['current_coverage']:.1f}%")
            for suggestion in suggestions['suggestions']:
                print(f"  • {suggestion}")
    
    def export_routes_to_csv(self, solution, filename='beat_planning_output.csv'):
        """Export routes to CSV format"""
        if not solution:
            return
        
        rows = []
        for route in solution['routes']:
            salesperson_id = route['vehicle_id'] + 1
            route_distance = route['distance'] / 1000  # Convert to km
            route_time = route['time'] / 60  # Convert to hours
            
            for i, location in enumerate(route['route']):
                rows.append({
                    'salesperson_id': salesperson_id,
                    'sequence': i + 1,
                    'node': location['node'],
                    'lat': location['lat'],
                    'long': location['long'],
                    'type': location['type'],
                    'route_total_distance_km': route_distance,
                    'route_total_time_hours': route_time
                })
        
        df = pd.DataFrame(rows)
        df.to_csv(filename, index=False)
        print(f"Routes exported to {filename}")
        
        # Also export uncovered stores
        if solution.get('uncovered_stores'):
            uncovered_df = pd.DataFrame(solution['uncovered_stores'])
            uncovered_filename = filename.replace('.csv', '_uncovered.csv')
            uncovered_df.to_csv(uncovered_filename, index=False)
            print(f"Uncovered stores exported to {uncovered_filename}")

# Example usage with constraint handling
if __name__ == "__main__":
    optimizer = EnhancedBeatPlanningOptimizer('location.csv')
    
    # Solve with realistic constraints
    solution = optimizer.solve_beat_planning(
    num_salespeople=2,
    daily_working_hours=6,
    max_daily_distance_km=100  
)
    
    optimizer.print_solution(solution)
    
    # Export to CSV
    if solution:
        optimizer.export_routes_to_csv(solution, 'daily_beat_plan.csv')
# Expected: 60-70% coverage with suggestions