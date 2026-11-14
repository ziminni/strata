"""SQLite persistence. Single-user for now: one farm row, its logs, and a shared community feed."""
import json
import os
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path

from .data import SAMPLE_POSTS
from .schemas import Farm

DB_PATH = Path(os.environ.get("STRATA_DB", Path(__file__).resolve().parent.parent / "strata.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS farm (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  crop TEXT NOT NULL,
  amount TEXT NOT NULL DEFAULT '',
  cost REAL NOT NULL DEFAULT 0,
  yield_kg REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  crop TEXT NOT NULL DEFAULT '',
  prov TEXT NOT NULL DEFAULT '',
  mun TEXT NOT NULL DEFAULT '',
  author_label TEXT NOT NULL,
  mine INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  sample INTEGER NOT NULL DEFAULT 0,
  helpful TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);
"""


def now_ms() -> int:
    return int(time.time() * 1000)


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with connect() as c:
        c.executescript(SCHEMA)
        if c.execute("SELECT COUNT(*) FROM posts").fetchone()[0] == 0:
            t = now_ms()
            c.executemany(
                "INSERT INTO posts (text, type, crop, prov, author_label, verified, sample, created_at)"
                " VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
                [(text, typ, crop, prov, author, int(verified), t - int(hours * 3600e3))
                 for hours, author, verified, prov, crop, typ, text in SAMPLE_POSTS],
            )


def get_farm() -> Farm:
    with connect() as c:
        row = c.execute("SELECT data FROM farm WHERE id = 1").fetchone()
    return Farm.model_validate_json(row["data"]) if row else Farm()


def save_farm(farm: Farm) -> Farm:
    with connect() as c:
        c.execute("INSERT INTO farm (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
                  (farm.model_dump_json(),))
    return farm


def list_logs(limit: int = 500) -> list:
    with connect() as c:
        rows = c.execute("SELECT * FROM logs ORDER BY date DESC, created_at DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


def add_log(log: dict) -> dict:
    with connect() as c:
        cur = c.execute(
            "INSERT INTO logs (date, type, crop, amount, cost, yield_kg, notes, visibility, created_at)"
            " VALUES (:date, :type, :crop, :amount, :cost, :yield_kg, :notes, :visibility, :created_at)",
            {**log, "created_at": now_ms()},
        )
        row = c.execute("SELECT * FROM logs WHERE id = ?", (cur.lastrowid,)).fetchone()
    return dict(row)


ME = "me"  # single local user until auth is added


def _post_view(row: sqlite3.Row) -> dict:
    helpful = json.loads(row["helpful"])
    return {
        "id": row["id"], "text": row["text"], "type": row["type"], "crop": row["crop"],
        "prov": row["prov"], "mun": row["mun"],
        "author": "You" if row["mine"] else row["author_label"],
        "mine": bool(row["mine"]), "verified": bool(row["verified"]), "sample": bool(row["sample"]),
        "helpful_count": len(helpful), "helped": ME in helpful, "created_at": row["created_at"],
    }


def list_posts(limit: int = 150) -> list:
    with connect() as c:
        rows = c.execute("SELECT * FROM posts ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return [_post_view(r) for r in rows]


def add_post(text: str, type_: str, crop: str, farm: Farm) -> dict:
    label = (farm.name.split(" ")[0] if farm.name else "Farmer") + " · " + farm.mun
    with connect() as c:
        cur = c.execute(
            "INSERT INTO posts (text, type, crop, prov, mun, author_label, mine, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
            (text, type_, crop, farm.prov, farm.mun, label, now_ms()),
        )
        row = c.execute("SELECT * FROM posts WHERE id = ?", (cur.lastrowid,)).fetchone()
    return _post_view(row)


def toggle_helpful(post_id: int):
    with connect() as c:
        row = c.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not row:
            return None
        helpful = set(json.loads(row["helpful"]))
        helpful.symmetric_difference_update({ME})
        c.execute("UPDATE posts SET helpful = ? WHERE id = ?", (json.dumps(sorted(helpful)), post_id))
        row = c.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    return _post_view(row)
