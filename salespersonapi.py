from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
import os
import csv

router = APIRouter()

@router.post("/enroll_salesperson")
async def enroll_salesperson(
    salesperson_id: str = Body(...),
    starting_point: str = Body(...)
):
    assignments_path = "assignments.csv"
    file_exists = os.path.isfile(assignments_path)
    try:
        with open(assignments_path, "a", newline="") as csvfile:
            writer = csv.writer(csvfile)
            if not file_exists:
                writer.writerow(["salesperson_id", "starting_point"])
            writer.writerow([salesperson_id, starting_point])
        return {"message": "Salesperson enrolled successfully."}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
