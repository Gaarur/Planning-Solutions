from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
import os
import csv

router = APIRouter()

@router.post("/enroll_salesperson")
async def enroll_salesperson(
    name: str = Body(...),
    address: str = Body(...),
    phone: str = Body(...),
    starting_point: str = Body(...)
):
    assignments_path = "assignments.csv"
    enrolled_path = "enrolled.csv"
    # Auto-generate sales_id by counting rows in assignments.csv
    sales_id = 1
    if os.path.isfile(assignments_path):
        with open(assignments_path, "r", newline="") as csvfile:
            reader = csv.reader(csvfile)
            rows = list(reader)
            # Exclude header if present
            if rows and rows[0][0] == "salesperson_id":
                sales_id = len(rows)
            else:
                sales_id = len(rows) + 1
    # Save to assignments.csv
    try:
        file_exists = os.path.isfile(assignments_path)
        with open(assignments_path, "a", newline="") as csvfile:
            writer = csv.writer(csvfile)
            if not file_exists:
                writer.writerow(["salesperson_id", "starting_point"])
            writer.writerow([sales_id, starting_point])
        # Save to enrolled.csv
        enrolled_exists = os.path.isfile(enrolled_path)
        with open(enrolled_path, "a", newline="") as csvfile:
            writer = csv.writer(csvfile)
            if not enrolled_exists:
                writer.writerow(["salesperson_id", "name", "address", "phone", "starting_point"])
            writer.writerow([sales_id, name, address, phone, starting_point])
        return {"message": "Salesperson enrolled successfully.", "salesperson_id": sales_id}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
