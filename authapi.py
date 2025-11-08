from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
import os
import psycopg2
import psycopg2.extras
from db import get_conn, init_db
import hashlib
import hmac
import time
import jwt
from typing import Optional

JWT_SECRET = os.environ.get("JWT_SECRET", "change_this_secret")
JWT_ALGORITHM = "HS256"

router = APIRouter()


# Use Postgres (Neon) via db.py helper



def hash_password(password: str, salt: Optional[str] = None):
    if salt is None:
        salt = os.urandom(16).hex()
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return pwd_hash.hex(), salt


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    pwd_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(pwd_hash, expected_hash)


def create_token(payload: dict, expires_in: int = 60 * 60 * 24):
    to_encode = payload.copy()
    to_encode.update({"exp": int(time.time()) + expires_in})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


class RegisterIn(BaseModel):
    username: str
    password: str
    role: Optional[str] = "sales"


class LoginIn(BaseModel):
    username: str
    password: str


@router.on_event("startup")
def startup():
    # initialize Postgres tables if needed
    init_db()


@router.post("/register")
def register(data: RegisterIn):
    pwd_hash, salt = hash_password(data.password)
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, password_hash, salt, role) VALUES (%s, %s, %s, %s) RETURNING id",
            (data.username, pwd_hash, salt, data.role),
        )
        user_id = cur.fetchone()[0]
        conn.commit()
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Username already exists")
    finally:
        cur.close()
        conn.close()
    return {"id": user_id, "username": data.username, "role": data.role}


@router.post("/login")
def login(data: LoginIn):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM users WHERE username = %s", (data.username,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, row["salt"], row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": row["username"], "role": row["role"], "uid": row["id"]})
    return {"access_token": token, "token_type": "bearer"}


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    token = parts[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"username": user.get("sub"), "role": user.get("role"), "uid": user.get("uid")}
