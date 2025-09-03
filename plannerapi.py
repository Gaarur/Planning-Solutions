


from fastapi import FastAPI, UploadFile, File, Form
from salespersonapi import router as salesperson_router
from fastapi.responses import JSONResponse, PlainTextResponse
from middleware import add_cors_middleware
import pandas as pd
from planner import BeatPlanningOptimizer
import os



app = FastAPI()
add_cors_middleware(app)
app.include_router(salesperson_router)

@app.get("/")
def root():
    return {"message": "Beat Planning API is running"}

# Endpoint: create_data_model
@app.post("/create_data_model")
async def create_data_model(
    locations_file: UploadFile = File(...),
    assignments_file: UploadFile = File(None),
    num_salespeople: int = Form(...),
    daily_working_hours: int = Form(4),
    max_daily_distance_km: int = Form(30),
    store_visit_time_minutes: int = Form(15)
):
    locations_path = f"temp_{locations_file.filename}"
    with open(locations_path, "wb") as f:
        f.write(await locations_file.read())
    assignments_path = None
    if assignments_file:
        assignments_path = f"temp_{assignments_file.filename}"
        with open(assignments_path, "wb") as f:
            f.write(await assignments_file.read())
    optimizer = BeatPlanningOptimizer(locations_path, assignments_path)
    data_model = optimizer.create_data_model(
        num_salespeople=num_salespeople,
        daily_working_hours=daily_working_hours,
        max_daily_distance_km=max_daily_distance_km,
        store_visit_time_minutes=store_visit_time_minutes
    )
    os.remove(locations_path)
    if assignments_path:
        os.remove(assignments_path)
    return JSONResponse(content=data_model)

# Endpoint: solve_beat_planning
@app.post("/solve_beat_planning")
async def solve_beat_planning(
    locations_file: UploadFile = File(...),
    assignments_file: UploadFile = File(None),
    num_salespeople: int = Form(...),
    daily_working_hours: int = Form(8),
    max_daily_distance_km: int = Form(200),
    target_stores_per_day: int = Form(None)
):
    locations_path = f"temp_{locations_file.filename}"
    with open(locations_path, "wb") as f:
        f.write(await locations_file.read())
    assignments_path = None
    if assignments_file:
        assignments_path = f"temp_{assignments_file.filename}"
        with open(assignments_path, "wb") as f:
            f.write(await assignments_file.read())
    optimizer = BeatPlanningOptimizer(locations_path, assignments_path)
    try:
        solution = optimizer.solve_beat_planning(
            num_salespeople=num_salespeople,
            target_stores_per_day=target_stores_per_day,
            daily_working_hours=daily_working_hours,
            max_daily_distance_km=max_daily_distance_km
        )
    except ValueError as ve:
        os.remove(locations_path)
        if assignments_path:
            os.remove(assignments_path)
        return JSONResponse(content={"error": str(ve)}, status_code=400)
    os.remove(locations_path)
    if assignments_path:
        os.remove(assignments_path)
    print("Returned to UI:", solution)
    if solution:
        return JSONResponse(content=solution)
    else:
        return JSONResponse(content={"error": "No solution found"}, status_code=400)

# Endpoint: print_solution (returns plain text)
@app.post("/print_solution")
async def print_solution(
    locations_file: UploadFile = File(...),
    assignments_file: UploadFile = File(None),
    num_salespeople: int = Form(...),
    daily_working_hours: int = Form(8),
    max_daily_distance_km: int = Form(200)
):
    locations_path = f"temp_{locations_file.filename}"
    with open(locations_path, "wb") as f:
        f.write(await locations_file.read())
    assignments_path = None
    if assignments_file:
        assignments_path = f"temp_{assignments_file.filename}"
        with open(assignments_path, "wb") as f:
            f.write(await assignments_file.read())
    optimizer = BeatPlanningOptimizer(locations_path, assignments_path)
    solution = optimizer.solve_beat_planning(
        num_salespeople=num_salespeople,
        daily_working_hours=daily_working_hours,
        max_daily_distance_km=max_daily_distance_km
    )
    from io import StringIO
    import sys
    old_stdout = sys.stdout
    sys.stdout = mystdout = StringIO()
    optimizer.print_solution(solution)
    sys.stdout = old_stdout
    os.remove(locations_path)
    if assignments_path:
        os.remove(assignments_path)
    return PlainTextResponse(mystdout.getvalue())

# Endpoint: create_sample_assignments
@app.post("/create_sample_assignments")
async def create_sample_assignments(
    locations_file: UploadFile = File(...),
    num_salespeople: int = Form(...)
):
    locations_path = f"temp_{locations_file.filename}"
    with open(locations_path, "wb") as f:
        f.write(await locations_file.read())
    optimizer = BeatPlanningOptimizer(locations_path)
    assignments_df = optimizer.create_sample_assignments(num_salespeople)
    os.remove(locations_path)
    return JSONResponse(content=assignments_df.to_dict(orient="records"))
