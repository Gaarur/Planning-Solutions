
from fastapi import FastAPI, Form
from fastapi.responses import JSONResponse
from middleware import add_cors_middleware
import os
from runner import EnhancedBeatPlanningOptimizer

app = FastAPI()
add_cors_middleware(app)

@app.get("/")
def root():
    return {"message": "Test API is running"}

@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.post("/demo")
def run_demo(
    scenario: int = Form(1)
):
    """
    Run demo beat planning scenarios.
    scenario=1: Relaxed constraints
    scenario=2: Tight constraints
    """
    # Demo CSV content
    csv_content = """node,lat,long,node_type\ndepot_north,28.7041,77.1025,starting_point\ndepot_south,28.5355,77.3910,starting_point\nstore_001,28.6139,77.2090,store\nstore_002,28.6219,77.2419,store\nstore_003,28.5355,77.2466,store\nstore_004,28.5244,77.1855,store\nstore_005,28.6792,77.2069,store"""
    demo_file = "demo_locations.csv"
    with open(demo_file, "w") as f:
        f.write(csv_content)
    optimizer = EnhancedBeatPlanningOptimizer(demo_file)
    if scenario == 1:
        solution = optimizer.solve_beat_planning(
            num_salespeople=4,
            daily_working_hours=8,
            max_daily_distance_km=200
        )
    else:
        solution = optimizer.solve_beat_planning(
            num_salespeople=2,
            daily_working_hours=5,
            max_daily_distance_km=80
        )
    os.remove(demo_file)
    if solution:
        return JSONResponse(content=solution)
    else:
        return JSONResponse(content={"error": "No solution found"}, status_code=400)
