import os

# optional dotenv import: if python-dotenv is installed, use it;
# otherwise provide a lightweight fallback to load simple KEY=VALUE .env files.
try:
    from dotenv import load_dotenv  # type: ignore
except Exception:
    def load_dotenv(path='.env'):
        try:
            with open(path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except FileNotFoundError:
            pass

load_dotenv()
import psycopg2
import psycopg2.extras

DATABASE_URL = os.getenv("DATABASE_URL")


def get_conn():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set in environment")
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def init_db():
    """Create tables if they do not exist."""
    conn = get_conn()
    cur = conn.cursor()
    # users table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT NOT NULL
        )
        """
    )
    # events table for visits
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            event_id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            sales_id INTEGER NOT NULL,
            assignment_id INTEGER,
            lat DOUBLE PRECISION,
            long DOUBLE PRECISION,
            notes TEXT,
            photo_path TEXT
        )
        """
    )
    conn.commit()
    cur.close()
    conn.close()
