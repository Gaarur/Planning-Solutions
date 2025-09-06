
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from optimizer import BeatPlanningOptimizer, AdvancedBeatPlanningOptimizer
from middleware import add_cors_middleware


app = FastAPI()
add_cors_middleware(app)


class BasicOptimizeRequest(BaseModel):
    total_weekly_distance_km: float = Field(..., example=1000)
    max_daily_distance_km: float = Field(..., example=100)
    working_days_per_week: int = Field(..., example=5)
    working_hours_per_day: int = Field(..., example=8)

class AdvancedOptimizeRequest(BaseModel):
    routes: List[Dict[str, Any]]
    constraints: Dict[str, Any]

@app.post("/optimize_workers_basic")
def optimize_workers_basic(req: BasicOptimizeRequest):
    print(f"[Optimizer] Starting basic optimization...")
    print(f"Total weekly distance: {req.total_weekly_distance_km} km")
    print(f"Constraints: max_daily_distance_km={req.max_daily_distance_km}, working_days_per_week={req.working_days_per_week}, working_hours_per_day={req.working_hours_per_day}")
    optimizer = BeatPlanningOptimizer()
    result = optimizer.calculate_minimum_workers_basic(
        total_weekly_distance_km=req.total_weekly_distance_km,
        max_daily_distance_km=req.max_daily_distance_km,
        working_days_per_week=req.working_days_per_week,
        working_hours_per_day=req.working_hours_per_day
    )
    print(f"Minimum workers needed: {result['min_workers']}")
    print(f"Result: {result}")
    print(f"[Optimizer] Basic optimization complete.\n")
    return result

@app.post("/optimize_workers_advanced")
def optimize_workers_advanced(req: AdvancedOptimizeRequest):
    print(f"[Optimizer] Starting advanced optimization...")
    print(f"Number of routes: {len(req.routes)}")
    print(f"Constraints: {req.constraints}")
    for idx, route in enumerate(req.routes):
        print(f"Route {idx+1}: Salesperson {route.get('salespersonName', '')} (ID: {route.get('salespersonId', '')}), Stops: {len(route.get('stops', []))}")
    optimizer = AdvancedBeatPlanningOptimizer()
    result = optimizer.compare_algorithms(req.routes, req.constraints)
    print(f"Best algorithm: {result['comparison_summary']['best_algorithm']}")
    print(f"Worker counts by algorithm: {result['comparison_summary']['worker_counts']}")
    print(f"Full results for best algorithm: {result[result['comparison_summary']['best_algorithm']]}")
    print(f"[Optimizer] Advanced optimization complete.\n")
    return result
