import pandas as pd
import numpy as np
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from geopy.distance import geodesic
import math

class BeatPlanningOptimizer:
    def __init__(self, csv_file_path, assignments_csv_path=None):
        """
        Initialize with CSV containing: node, lat, long, node_type
        And optional assignments CSV: salesperson_id, starting_point
        """
        self.data = pd.read_csv(csv_file_path)
        self.stores = self.data[self.data['node_type'] == 'store'].copy()
        self.starting_points = self.data[self.data['node_type'] == 'starting_point'].copy()
        
        # Create combined location list (starting points first, then stores)
        self.locations = pd.concat([self.starting_points, self.stores], ignore_index=True)
        self.num_starting_points = len(self.starting_points)
        self.num_stores = len(self.stores)
        self.total_locations = len(self.locations)
        
        # Load salesperson assignments if provided
        self.assignments = None
        if assignments_csv_path:
            self.assignments = pd.read_csv(assignments_csv_path)
            print(f"Loaded assignments for {len(self.assignments)} salespeople")
        
        # Create distance matrix
        self.distance_matrix = self._create_distance_matrix()
        self.time_matrix = self._create_time_matrix()
    
    def _create_distance_matrix(self):
        """Create distance matrix using haversine distance (in meters)"""
        matrix = np.zeros((self.total_locations, self.total_locations))
        
        for i in range(self.total_locations):
            for j in range(self.total_locations):
                if i != j:
                    coord1 = (self.locations.iloc[i]['lat'], self.locations.iloc[i]['long'])
                    coord2 = (self.locations.iloc[j]['lat'], self.locations.iloc[j]['long'])
                    # Convert km to meters
                    distance = geodesic(coord1, coord2).meters
                    matrix[i][j] = int(distance)
                else:
                    matrix[i][j] = 0
        
        return matrix.astype(int)
    
    def _create_time_matrix(self, avg_speed_kmh=40):
        """Create time matrix based on distance and average speed (in minutes)"""
        # Convert distance to time: distance(m) / speed(m/min)
        speed_mpm = (avg_speed_kmh * 1000) / 60  # meters per minute
        time_matrix = (self.distance_matrix / speed_mpm).astype(int)
        return time_matrix
    
    def create_data_model(self, num_salespeople, daily_working_hours=8, 
                         max_daily_distance_km=200, store_visit_time_minutes=30):
        """Create data model for OR-Tools"""
        
        data = {}
        # Convert numpy arrays to lists for JSON serialization
        data['distance_matrix'] = self.distance_matrix.tolist()
        data['time_matrix'] = self.time_matrix.tolist()
        data['num_vehicles'] = num_salespeople
        
        # Convert constraints to appropriate units
        data['max_distance'] = max_daily_distance_km * 1000  # meters
        data['max_time'] = daily_working_hours * 60  # minutes
        data['service_time'] = store_visit_time_minutes  # minutes per store
        
        # Handle salesperson-depot assignments
        if self.assignments is not None:
            # Use custom assignments from CSV
            data['starts'] = []
            data['ends'] = []
            
            print("Salesperson assignments:")
            for _, row in self.assignments.iterrows():
                sp_id = row['salesperson_id']
                depot_name = row['starting_point']
                
                # Find depot index
                depot_row = self.starting_points[self.starting_points['node'] == depot_name]
                if depot_row.empty:
                    raise ValueError(f"Starting point '{depot_name}' not found for salesperson {sp_id}")
                
                depot_idx = int(depot_row.index[0])
                data['starts'].append(depot_idx)
                data['ends'].append(depot_idx)
                
                print(f"  Salesperson {sp_id} -> {depot_name} (index {depot_idx})")
                
            # Ensure we have assignments for all salespeople
            if len(data['starts']) != num_salespeople:
                raise ValueError(f"Need assignments for {num_salespeople} salespeople, got {len(data['starts'])}")
                
        else:
            # Default: round-robin assignment
            print("Using default round-robin assignments:")
            if num_salespeople <= self.num_starting_points:
                data['starts'] = list(range(num_salespeople))
                data['ends'] = list(range(num_salespeople))
            else:
                data['starts'] = [i % self.num_starting_points for i in range(num_salespeople)]
                data['ends'] = [i % self.num_starting_points for i in range(num_salespeople)]
            
            for i in range(num_salespeople):
                depot_name = self.starting_points.iloc[data['starts'][i]]['node']
                print(f"  Salesperson {i+1} -> {depot_name}")
        
        return data
    
    def solve_beat_planning(self, num_salespeople, target_stores_per_day=None, 
                          daily_working_hours=8, max_daily_distance_km=200):
        """
        Solve the beat planning optimization problem
        """
        
        print(f"Solving beat planning for {num_salespeople} salespeople...")
        print(f"Total stores: {self.num_stores}")
        print(f"Starting points: {self.num_starting_points}")
        
        # Create the data model
        data = self.create_data_model(num_salespeople, daily_working_hours, max_daily_distance_km)
        
        print(f"Vehicles created: {data['num_vehicles']}")
        print(f"Starts: {data['starts']}")
        print(f"Ends: {data['ends']}")
        
        # Create the routing index manager
        # OR-Tools Python API expects plain integer lists, not NodeIndex objects
        manager = pywrapcp.RoutingIndexManager(
            self.total_locations, 
            data['num_vehicles'], 
            data['starts'], 
            data['ends']
        )
        
        # Create Routing Model
        routing = pywrapcp.RoutingModel(manager)
        
        # Create distance callback
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data['distance_matrix'][from_node][to_node]
        
        distance_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(distance_callback_index)
        
        # Add distance constraint
        routing.AddDimension(
            distance_callback_index,
            0,  # no slack
            data['max_distance'],  # maximum distance per vehicle
            True,  # start cumul to zero
            'Distance'
        )
        
        # Create time callback (including service time)
        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            service_time = data['service_time'] if to_node >= self.num_starting_points else 0
            return data['time_matrix'][from_node][to_node] + service_time
        
        time_callback_index = routing.RegisterTransitCallback(time_callback)
        
        # Add time constraint
        routing.AddDimension(
            time_callback_index,
            60,  # allow 60 minutes slack
            data['max_time'],  # maximum time per vehicle
            False,  # don't force start cumul to zero
            'Time'
        )
        
        # Allow dropping visits if constraints are too tight
        penalty = 1000000  # High penalty for unvisited stores
        for node in range(self.num_starting_points, self.total_locations):
            routing.AddDisjunction([manager.NodeToIndex(node)], penalty)
        
        # Setting first solution heuristic
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(30)
        
        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)
        
        if solution:
            return self._extract_solution(manager, routing, solution, data)
        else:
            print("No solution found!")
            return None
    
    def _extract_solution(self, manager, routing, solution, data):
        """Extract and format the solution"""
        
        results = {
            'total_distance': 0,
            'total_time': 0,
            'routes': [],
            'summary': {}
        }
        
        distance_dimension = routing.GetDimensionOrDie('Distance')
        time_dimension = routing.GetDimensionOrDie('Time')
        
        for vehicle_id in range(data['num_vehicles']):
            index = routing.Start(vehicle_id)
            route_info = {
                'vehicle_id': vehicle_id,
                'route': [],
                'distance': 0,
                'time': 0,
                'stores_visited': 0
            }
            
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                location_info = {
                    'node': self.locations.iloc[node_index]['node'],
                    'lat': self.locations.iloc[node_index]['lat'],
                    'long': self.locations.iloc[node_index]['long'],
                    'type': self.locations.iloc[node_index]['node_type']
                }
                route_info['route'].append(location_info)
                
                if location_info['type'] == 'store':
                    route_info['stores_visited'] += 1
                
                previous_index = index
                index = solution.Value(routing.NextVar(index))
            
            # Add final location (end depot)
            final_node = manager.IndexToNode(index)
            final_location = {
                'node': self.locations.iloc[final_node]['node'],
                'lat': self.locations.iloc[final_node]['lat'],
                'long': self.locations.iloc[final_node]['long'],
                'type': self.locations.iloc[final_node]['node_type']
            }
            route_info['route'].append(final_location)
            
            # Get route distance and time
            route_info['distance'] = solution.Value(distance_dimension.CumulVar(index))
            route_info['time'] = solution.Value(time_dimension.CumulVar(index))
            
            results['routes'].append(route_info)
            results['total_distance'] += route_info['distance']
            results['total_time'] += route_info['time']
        
        # Create summary
        results['summary'] = {
            'total_distance_km': results['total_distance'] / 1000,
            'total_time_hours': results['total_time'] / 60,
            'total_stores_covered': sum(route['stores_visited'] for route in results['routes']),
            'avg_distance_per_salesperson': (results['total_distance'] / 1000) / len(results['routes']),
            'avg_time_per_salesperson': (results['total_time'] / 60) / len(results['routes']),
            'coverage_percentage': (sum(route['stores_visited'] for route in results['routes']) / self.num_stores) * 100
        }
        
        return results
    
    def print_solution(self, solution):
        """Print formatted solution"""
        if not solution:
            print("No solution to display")
            return
        
        print("\n" + "="*60)
        print("BEAT PLANNING OPTIMIZATION RESULTS")
        print("="*60)
        
        # Print summary
        summary = solution['summary']
        print(f"\nSUMMARY:")
        print(f"Total Stores Covered: {summary['total_stores_covered']}/{self.num_stores} ({summary['coverage_percentage']:.1f}%)")
        print(f"Total Distance: {summary['total_distance_km']:.2f} km")
        print(f"Total Time: {summary['total_time_hours']:.2f} hours")
        print(f"Avg Distance per Salesperson: {summary['avg_distance_per_salesperson']:.2f} km")
        print(f"Avg Time per Salesperson: {summary['avg_time_per_salesperson']:.2f} hours")
        
        # Print individual routes
        print(f"\nROUTE DETAILS:")
        for route in solution['routes']:
            if len(route['route']) > 2:  # Only show routes with actual visits
                print(f"\nSalesperson {route['vehicle_id'] + 1}:")
                print(f"  Distance: {route['distance']/1000:.2f} km")
                print(f"  Time: {route['time']/60:.2f} hours")
                print(f"  Stores Visited: {route['stores_visited']}")
                print(f"  Route: ", end="")
                route_nodes = [loc['node'] for loc in route['route']]
                print(" -> ".join(map(str, route_nodes)))

    def create_sample_assignments(self, num_salespeople, output_file='assignments.csv'):
        """Create a sample assignments CSV file"""
        assignments = []
        
        # Distribute salespeople across starting points
        for i in range(num_salespeople):
            depot_idx = i % self.num_starting_points
            depot_name = self.starting_points.iloc[depot_idx]['node']
            
            assignments.append({
                'salesperson_id': i + 1,
                'starting_point': depot_name
            })
        
        assignments_df = pd.DataFrame(assignments)
        assignments_df.to_csv(output_file, index=False)
        print(f"Sample assignments created: {output_file}")
        print(assignments_df)
        return assignments_df

# Example usage
if __name__ == "__main__":
    # Method 1: Create assignments automatically
    optimizer = BeatPlanningOptimizer('locations.csv')
    
    # Generate sample assignments file
    optimizer.create_sample_assignments(4, 'my_assignments.csv')
    
    # Method 2: Use custom assignments
    optimizer_with_assignments = BeatPlanningOptimizer('locations.csv', 'my_assignments.csv')
    
    solution = optimizer_with_assignments.solve_beat_planning(
        num_salespeople=4,
        daily_working_hours=8,
        max_daily_distance_km=200
    )
    
    optimizer_with_assignments.print_solution(solution)