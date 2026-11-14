from datetime import date

from fastapi import APIRouter

from .. import db
from ..data import PROV, SCEN
from ..engine.climate import clim_summary
from ..engine.rotation import active_plan, build_segs, evaluate_plan, ranked_view
from ..schemas import Scenario

router = APIRouter(prefix="/api", tags=["analysis"])


@router.get("/climate")
def get_climate(scenario: Scenario = "now"):
    farm = db.get_farm()
    p = PROV[farm.prov]
    return {
        "scenario": scenario,
        "label": SCEN[scenario]["label"],
        "province": {"name": farm.prov, "mun": farm.mun, "lat": p["lat"], "lon": p["lon"]},
        "summary": clim_summary(farm.prov, scenario),
        "baseline": clim_summary(farm.prov, "now"),
    }


@router.get("/plans")
def get_plans(scenario: Scenario = "ssp245"):
    return ranked_view(db.get_farm(), scenario)


@router.get("/season")
def get_season():
    """Crop segments of the plan in the farm's calendar, around the current year."""
    farm = db.get_farm()
    plan = active_plan(farm)
    y = date.today().year
    segs = [s for year in range(y - 2, y + 2) for s in build_segs(plan, year)]
    return {
        "plan": {"id": plan["id"], "name": plan["name"], "adopted": bool(farm.adopted)},
        "segs": segs,
        "soil_score": evaluate_plan(farm, plan, "now")["soil"],
    }
