from fastapi import APIRouter

from .. import db
from ..schemas import Farm

router = APIRouter(prefix="/api/farm", tags=["farm"])


@router.get("", response_model=Farm)
def get_farm():
    return db.get_farm()


@router.put("", response_model=Farm)
def put_farm(farm: Farm):
    return db.save_farm(farm)
