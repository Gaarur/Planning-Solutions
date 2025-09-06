import math
from typing import List, Dict, Any

# ---- Basic Optimizer ----
class BeatPlanningOptimizer:
    """
    Basic optimizer: calculates minimum number of workers using route totals and constraints.
    """
    def calculate_minimum_workers_basic(self, total_weekly_distance_km, max_daily_distance_km=100, working_days_per_week=5, working_hours_per_day=8):
        max_weekly_distance_per_worker_km = max_daily_distance_km * working_days_per_week
        min_workers = math.ceil(total_weekly_distance_km / max_weekly_distance_per_worker_km)
        total_capacity_km = min_workers * max_weekly_distance_per_worker_km
        utilization_rate = (total_weekly_distance_km / total_capacity_km) * 100 if total_capacity_km else 0
        total_weekly_hours = min_workers * working_days_per_week * working_hours_per_day
        return {
            'min_workers': min_workers,
            'total_weekly_distance_km': total_weekly_distance_km,
            'max_weekly_distance_per_worker_km': max_weekly_distance_per_worker_km,
            'total_capacity_km': total_capacity_km,
            'utilization_rate': round(utilization_rate, 2),
            'total_weekly_hours': total_weekly_hours,
            'excess_capacity_km': total_capacity_km - total_weekly_distance_km,
            'constraints_used': {
                'max_daily_distance_km': max_daily_distance_km,
                'working_days_per_week': working_days_per_week,
                'working_hours_per_day': working_hours_per_day
            }
        }

# ---- Advanced Multi-Algorithm Optimizer ----
class AdvancedBeatPlanningOptimizer:
    """
    Multiple algorithms: basic, greedy bin-packing, constraint satisfaction, LP, bin packing.
    """
    def basic_algorithm(self, routes: List[Dict], constraints: Dict) -> Dict:
        total_distance_km = sum(r.get('metrics', {}).get('distance_km', 0) for r in routes)
        max_weekly_distance_km = constraints['max_daily_distance_km'] * constraints['working_days_per_week']
        min_workers = math.ceil(total_distance_km / max_weekly_distance_km)
        return {
            'algorithm': 'basic',
            'min_workers': min_workers,
            'total_distance_km': total_distance_km,
            'max_weekly_capacity_km': max_weekly_distance_km * min_workers,
            'utilization': (total_distance_km / (max_weekly_distance_km * min_workers)) * 100 if min_workers else 0,
        }

    def greedy_algorithm(self, routes: List[Dict], constraints: Dict) -> Dict:
        sorted_routes = sorted(routes, key=lambda x: x.get('metrics', {}).get('distance_km', 0), reverse=True)
        max_weekly_capacity_km = constraints['max_daily_distance_km'] * constraints['working_days_per_week']
        workers = []
        for route in sorted_routes:
            route_distance = route.get('metrics', {}).get('distance_km', 0)
            assigned = False
            for i, worker_load in enumerate(workers):
                if worker_load + route_distance <= max_weekly_capacity_km:
                    workers[i] += route_distance
                    assigned = True
                    break
            if not assigned:
                workers.append(route_distance)
        total_distance_km = sum(r.get('metrics', {}).get('distance_km', 0) for r in routes)
        total_capacity_km = len(workers) * max_weekly_capacity_km
        return {
            'algorithm': 'greedy',
            'min_workers': len(workers),
            'worker_loads_km': workers,
            'total_distance_km': total_distance_km,
            'total_capacity_km': total_capacity_km,
            'utilization': (total_distance_km / total_capacity_km) * 100 if total_capacity_km else 0
        }

    def constraint_satisfaction_algorithm(self, routes: List[Dict], constraints: Dict) -> Dict:
        max_weekly_distance_km = constraints['max_daily_distance_km'] * constraints['working_days_per_week']
        max_weekly_hours = constraints['working_hours_per_day'] * constraints['working_days_per_week']
        total_distance_km = sum(r.get('metrics', {}).get('distance_km', 0) for r in routes)
        total_time_hours = sum(r.get('metrics', {}).get('eta_minutes', 0) / 60 for r in routes)
        workers_by_distance = math.ceil(total_distance_km / max_weekly_distance_km)
        workers_by_time = math.ceil(total_time_hours / max_weekly_hours) if total_time_hours > 0 else 0
        min_workers = max(workers_by_distance, workers_by_time)
        binding_constraint = 'distance' if workers_by_distance >= workers_by_time else 'time'
        return {
            'algorithm': 'constraint_satisfaction',
            'min_workers': min_workers,
            'binding_constraint': binding_constraint,
            'workers_by_distance': workers_by_distance,
            'workers_by_time': workers_by_time,
            'total_distance_km': total_distance_km,
            'total_time_hours': total_time_hours,
            'utilization': (total_distance_km / (max_weekly_distance_km * min_workers)) * 100 if min_workers else 0
        }

    def linear_programming_approach(self, routes: List[Dict], constraints: Dict) -> Dict:
        total_distance_km = sum(r.get('metrics', {}).get('distance_km', 0) for r in routes)
        total_time_hours = sum(r.get('metrics', {}).get('eta_minutes', 0) / 60 for r in routes)
        max_weekly_distance_km = constraints['max_daily_distance_km'] * constraints['working_days_per_week']
        max_weekly_hours = constraints['working_hours_per_day'] * constraints['working_days_per_week']
        min_workers_distance = math.ceil(total_distance_km / max_weekly_distance_km)
        min_workers_time = math.ceil(total_time_hours / max_weekly_hours) if total_time_hours > 0 else 0
        optimal_workers = max(min_workers_distance, min_workers_time)
        return {
            'algorithm': 'linear_programming',
            'optimal_workers': optimal_workers,
            'constraints_analysis': {
                'distance_constraint': {'required_workers': min_workers_distance},
                'time_constraint': {'required_workers': min_workers_time},
            },
            'utilization': (total_distance_km / (max_weekly_distance_km * optimal_workers)) * 100 if optimal_workers else 0
        }

    def bin_packing_algorithm(self, routes: List[Dict], constraints: Dict) -> Dict:
        max_weekly_capacity_km = constraints['max_daily_distance_km'] * constraints['working_days_per_week']
        items = sorted([r.get('metrics', {}).get('distance_km', 0) for r in routes], reverse=True)
        bins = []
        for item in items:
            placed = False
            for i, bin_load in enumerate(bins):
                if bin_load + item <= max_weekly_capacity_km:
                    bins[i] += item
                    placed = True
                    break
            if not placed:
                bins.append(item)
        total_distance_km = sum(items)
        total_capacity_km = len(bins) * max_weekly_capacity_km
        return {
            'algorithm': 'bin_packing',
            'min_workers': len(bins),
            'bin_loads_km': bins,
            'total_distance_km': total_distance_km,
            'total_capacity_km': total_capacity_km,
            'utilization': (total_distance_km / total_capacity_km) * 100 if total_capacity_km else 0
        }

    def compare_algorithms(self, routes: List[Dict], constraints: Dict) -> Dict:
        results = {}
        results['basic'] = self.basic_algorithm(routes, constraints)
        results['greedy'] = self.greedy_algorithm(routes, constraints)
        results['constraint_satisfaction'] = self.constraint_satisfaction_algorithm(routes, constraints)
        results['linear_programming'] = self.linear_programming_approach(routes, constraints)
        results['bin_packing'] = self.bin_packing_algorithm(routes, constraints)
        worker_counts = {k: v.get('min_workers', v.get('optimal_workers', float('inf'))) for k, v in results.items()}
        best_algo = min(worker_counts, key=worker_counts.get)
        results['comparison_summary'] = {
            'best_algorithm': best_algo,
            'worker_counts': worker_counts
        }
        return results

# ---- Example Usage ----
if __name__ == "__main__":
    # Sample constraints
    constraints = {
        'max_daily_distance_km': 100,
        'working_days_per_week': 5,
        'working_hours_per_day': 8
    }
    
    # Sample route data
    routes = [
        {'route_id': 'R001', 'distance_km': 85, 'time_hours': 6.5},
        {'route_id': 'R002', 'distance_km': 120, 'time_hours': 8.0},
        {'route_id': 'R003', 'distance_km': 95, 'time_hours': 7.2},
        {'route_id': 'R004', 'distance_km': 110, 'time_hours': 7.8},
        {'route_id': 'R005', 'distance_km': 75, 'time_hours': 5.5},
        {'route_id': 'R006', 'distance_km': 90, 'time_hours': 6.8},
        {'route_id': 'R007', 'distance_km': 105, 'time_hours': 7.5},
        {'route_id': 'R008', 'distance_km': 80, 'time_hours': 6.0},
        {'route_id': 'R009', 'distance_km': 100, 'time_hours': 7.0},
        {'route_id': 'R010', 'distance_km': 115, 'time_hours': 8.2}
    ]

    # Basic minimum worker calculation
    basic_optimizer = BeatPlanningOptimizer()
    total_weekly_distance_km = sum(r['distance_km'] for r in routes)
    basic_result = basic_optimizer.calculate_minimum_workers_basic(
        total_weekly_distance_km=total_weekly_distance_km,
        max_daily_distance_km=constraints['max_daily_distance_km'],
        working_days_per_week=constraints['working_days_per_week'],
        working_hours_per_day=constraints['working_hours_per_day']
    )
    print("Basic minimum workers:", basic_result['min_workers'])

    # Advanced algorithm comparison
    advanced_optimizer = AdvancedBeatPlanningOptimizer()
    compare_results = advanced_optimizer.compare_algorithms(routes, constraints)
    print("Best algorithm:", compare_results['comparison_summary']['best_algorithm'])
    print("Worker counts by algorithm:", compare_results['comparison_summary']['worker_counts'])
    print("Full results for best algorithm:", compare_results[compare_results['comparison_summary']['best_algorithm']])
