from fastapi import APIRouter

from ..data import CROPS, LOGTYPES, MON, PLANS, POST_TYPES, PROV, SCEN

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/meta")
def meta():
    """Reference data the UI needs to render labels, colors and pickers."""
    return {
        "months": MON,
        "provinces": {k: {"lat": v["lat"], "lon": v["lon"], "mun": v["mun"]} for k, v in PROV.items()},
        "scenarios": SCEN,
        "crops": {k: {key: c.get(key) for key in ("fil", "en", "days", "color", "legume")}
                  for k, c in CROPS.items() if k != "fallow"},
        "plans": [{"id": p["id"], "name": p["name"]} for p in PLANS],
        "log_types": LOGTYPES,
        "post_types": POST_TYPES,
    }
