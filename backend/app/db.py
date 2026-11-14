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
  comments TEXT NOT NULL DEFAULT '[]',
  image TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
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
        # Migrate columns if existing db lacks them
        cols = {r["name"] for r in c.execute("PRAGMA table_info(posts)").fetchall()}
        if "comments" not in cols:
            c.execute("ALTER TABLE posts ADD COLUMN comments TEXT NOT NULL DEFAULT '[]'")
        if "image" not in cols:
            c.execute("ALTER TABLE posts ADD COLUMN image TEXT NOT NULL DEFAULT ''")
        if "images" not in cols:
            c.execute("ALTER TABLE posts ADD COLUMN images TEXT NOT NULL DEFAULT '[]'")

        if c.execute("SELECT COUNT(*) FROM posts").fetchone()[0] == 0:
            t = now_ms()
            for sp in SAMPLE_POSTS:
                if isinstance(sp, dict):
                    comments_json = json.dumps([
                        {"id": cm.get("id", now_ms()), "author": cm["author"], "location": cm.get("location", ""),
                         "text": cm["text"], "created_at": t - int(cm.get("hours", 1) * 3600e3)}
                        for cm in sp.get("comments", [])
                    ])
                    helpful_json = json.dumps([f"farmer_{k}" for k in range(sp.get("helpful_count", 0))])
                    c.execute(
                        "INSERT INTO posts (text, type, crop, prov, mun, author_label, verified, sample, helpful, comments, image, created_at)"
                        " VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)",
                        (sp["text"], sp["type"], sp.get("crop", ""), sp.get("prov", ""), sp.get("mun", ""),
                         sp["author"], int(sp.get("verified", False)), helpful_json, comments_json, sp.get("image", ""),
                         t - int(sp["hours"] * 3600e3)),
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
    helpful = json.loads(row["helpful"] or "[]")
    comments = json.loads(row["comments"] or "[]") if "comments" in row.keys() else []
    image = row["image"] if "image" in row.keys() else ""
    images = json.loads(row["images"] or "[]") if "images" in row.keys() else []
    if not images and image:
        images = [image]
    return {
        "id": row["id"], "text": row["text"], "type": row["type"], "crop": row["crop"],
        "prov": row["prov"], "mun": row["mun"],
        "author": "You" if row["mine"] else row["author_label"],
        "mine": bool(row["mine"]), "verified": bool(row["verified"]), "sample": bool(row["sample"]),
        "helpful_count": len(helpful), "helped": ME in helpful, "comments": comments,
        "image": images[0] if images else image,
        "images": images,
        "created_at": row["created_at"],
    }


def list_posts(limit: int = 150) -> list:
    with connect() as c:
        rows = c.execute("SELECT * FROM posts ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return [_post_view(r) for r in rows]


def add_post(text: str, type_: str, crop: str, farm: Farm, image: str = "", images: list = None, mun: str = "", prov: str = "") -> dict:
    post_mun = mun or farm.mun
    post_prov = prov or farm.prov
    label = (farm.name.split(" ")[0] if farm.name else "Farmer") + " · " + post_mun
    img_list = images[:5] if images else ([image] if image else [])
    main_img = img_list[0] if img_list else image
    with connect() as c:
        cur = c.execute(
            "INSERT INTO posts (text, type, crop, prov, mun, author_label, mine, helpful, comments, image, images, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, 1, '[]', '[]', ?, ?, ?)",
            (text, type_, crop, post_prov, post_mun, label, main_img, json.dumps(img_list), now_ms()),
        )
        row = c.execute("SELECT * FROM posts WHERE id = ?", (cur.lastrowid,)).fetchone()
    return _post_view(row)


def add_comment(post_id: int, text: str, farm: Farm) -> dict:
    author = farm.name.split(" ")[0] if farm.name else "You"
    loc = f"{farm.mun}, {farm.prov}" if farm.mun else farm.prov
    new_comment = {
        "id": now_ms(),
        "author": author,
        "location": loc,
        "text": text,
        "created_at": now_ms(),
    }
    with connect() as c:
        row = c.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not row:
            return None
        comments = json.loads(row["comments"] or "[]")
        comments.append(new_comment)
        c.execute("UPDATE posts SET comments = ? WHERE id = ?", (json.dumps(comments), post_id))
        row = c.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
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
