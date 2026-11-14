from fastapi import APIRouter

from .. import db
from ..data import CROPS, LOGTYPES
from ..schemas import LogIn

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("")
def list_logs():
    return db.list_logs()


@router.post("", status_code=201)
def create_log(log: LogIn):
    data = log.model_dump()
    data["date"] = log.date.isoformat()
    saved = db.add_log(data)
    if log.visibility == "community":
        parts = [LOGTYPES[log.type], CROPS[log.crop]["fil"]]
        if log.amount:
            parts.append(log.amount)
        if log.yield_kg:
            parts.append(f"{log.yield_kg:g} kg")
        text = (" · ".join(parts) + "\n" + log.notes).strip()
        post_type = ("harvest" if log.type == "harvest"
                     else "warning" if log.type in ("observation", "weather") else "update")
        db.add_post(text, post_type, log.crop, db.get_farm())
    return saved
