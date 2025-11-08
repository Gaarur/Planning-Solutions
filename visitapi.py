from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
import os
from datetime import datetime
from typing import Optional
from db import get_conn, init_db
import psycopg2
import psycopg2.extras

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.isdir(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.on_event("startup")
def startup():
    # ensure DB tables exist
    init_db()


@router.post("/visit/checkin")
async def checkin(
    sales_id: int = Form(...),
    lat: float = Form(...),
    long: float = Form(...),
    notes: Optional[str] = Form(None),
    assignment_id: Optional[int] = Form(None),
    photo: Optional[UploadFile] = File(None),
):
    try:
        timestamp = datetime.utcnow()
        photo_path = None
        if photo:
            filename = f"{int(datetime.utcnow().timestamp())}_{photo.filename}"
            path = os.path.join(UPLOAD_DIR, filename)
            with open(path, "wb") as f:
                f.write(await photo.read())
            photo_path = path

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO events (timestamp, sales_id, assignment_id, lat, long, notes, photo_path) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING event_id",
            (timestamp, sales_id, assignment_id, lat, long, notes, photo_path),
        )
        event_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {"status": "ok", "event_id": event_id}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@router.get("/visit/events")
def list_events(sales_id: Optional[int] = None):
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if sales_id is None:
            cur.execute("SELECT * FROM events ORDER BY timestamp DESC LIMIT 1000")
        else:
            cur.execute("SELECT * FROM events WHERE sales_id = %s ORDER BY timestamp DESC", (sales_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"events": [dict(r) for r in rows]}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
