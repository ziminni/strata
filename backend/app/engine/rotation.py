"""Rotation-plan scoring: soil health, water, income, resilience and ease (relative 0–100)."""
import math
from datetime import date, timedelta
from typing import List, Optional

from ..data import CROPS, PLANS, WS
from ..schemas import Farm
from .climate import climate
from .util import avg, clamp, js_round

IRRIGATION_MM = {"canal": 900, "limited": 350, "rainfed": 0}
REFERENCE_YEAR = 2026  # wet season used when scoring plans


def _d(year: int, month0: int, day: int) -> date:
    return date(year, month0 + 1, day)


def _month(start: date, k: int) -> int:
    return (start + timedelta(days=k)).month - 1


def build_segs(plan: dict, year: int) -> List[dict]:
    """Wet-season rice plus the plan's dry-season crops, starting in `year`."""
    segs = [{"crop": WS["crop"], "start": _d(year, WS["m"], WS["d"])}]
    for crop, m, day in plan["segs"]:
        if crop == "fallow":
            continue
        segs.append({"crop": crop, "start": _d(year if m >= WS["m"] else year + 1, m, day)})
    for s in segs:
        s["end"] = s["start"] + timedelta(days=CROPS[s["crop"]]["days"])
    return segs


def current_plan(farm: Farm) -> dict:
    dry = farm.dry
    return {
        "id": "current",
        "name": "Your current practice: Palay → " + ("fallow" if dry == "fallow" else CROPS[dry]["fil"]),
        "segs": [] if dry == "fallow" else [[dry, 11 if dry == "rice" else 10, 1 if dry == "rice" else 15]],
        "current": True,
    }


def active_plan(farm: Farm) -> dict:
    if farm.adopted:
        for p in PLANS:
            if p["id"] == farm.adopted:
                return p
    return current_plan(farm)


def eval_crop(farm: Farm, crop: str, start: date, clim: dict) -> dict:
    c = CROPS[crop]
    months = [_month(start, k) for k in range(0, c["days"], 10)]
    mset = list(dict.fromkeys(months))
    rain = sum(clim["P"][m] * 0.7 * (months.count(m) / 3) for m in mset)
    need = c["water"]
    deficit = max(0.0, need - rain)

    # flowering window: 55–75% of the cycle
    flowering = []
    k = math.floor(c["days"] * 0.55)
    while k < c["days"] * 0.75:
        flowering.append(_month(start, k))
        k += 7
    peak = max(clim["X"][m] for m in flowering)
    heat = 1.0
    if peak > 33.5:
        heat = max(0.35, 1 - (peak - 33.5) * 0.09 * (5.5 - c["heat"]) / 4)

    soil = 1.0
    if c["upland"] and farm.drain == "poor":
        soil *= 0.72
    elif c["upland"] and farm.drain == "mod" and farm.tex == "clay":
        soil *= 0.85
    if c["upland"] and farm.tex == "sandy" and crop not in ("mani", "kamote", "pakwan"):
        soil *= 0.92
    if farm.ph < c["ph"][0]:
        soil *= max(0.6, 1 - (c["ph"][0] - farm.ph) * 0.25)
    if farm.ph > c["ph"][1]:
        soil *= max(0.7, 1 - (farm.ph - c["ph"][1]) * 0.2)
    if crop == "bawang" and farm.prov != "Aurora":
        soil *= 0.8  # garlic prefers cooler, drier Ilocos nights
    return {"crop": crop, "need": need, "rain": rain, "deficit": deficit, "heat": heat, "soil": soil, "peak": peak}


def evaluate_plan(farm: Farm, plan: dict, scen: str) -> dict:
    clim = climate(farm.prov, scen)
    segs = build_segs(plan, REFERENCE_YEAR)
    avail = IRRIGATION_MM[farm.water]

    ds = [eval_crop(farm, s["crop"], s["start"], clim) for s in segs[1:]]
    irrig = short = 0.0
    for e in ds:
        use = min(e["deficit"], avail)
        avail -= use
        irrig += use
        e["short"] = e["deficit"] - use
        short += e["short"]
        c = CROPS[e["crop"]]
        wf = max(0.0, 1 - (e["short"] / e["need"]) * (1.25 - 0.18 * c["drought"])) if e["deficit"] > 0 else 1.0
        e["water"] = wf
        e["suit"] = max(0.0, wf * e["heat"] * e["soil"])

    crops = [s["crop"] for s in segs]
    cover = set()
    for s in segs:
        for k in range(0, CROPS[s["crop"]]["days"], 5):
            cover.add(_month(s["start"], k))
    covered = len(cover)
    legume = any(CROPS[c]["legume"] for c in crops)
    gm = "sesbania" in crops
    fams = len({CROPS[c]["fam"] for c in crops})
    cont_rice = len([c for c in crops if c in ("rice", "awd")]) >= 2
    is_current = bool(plan.get("current"))
    straw = farm.straw if is_current else "incorporate"

    soil = (18 + (14 if legume else 0) + (10 if gm else 0)
            + (8 if straw == "incorporate" else 2 if straw == "remove" else -6)
            + covered * 2.3 + (fams - 1) * 7 - (12 if cont_rice else 0))
    if farm.om < 1.5 and legume:
        soil += 4
    soil = clamp(soil)

    need_all = sum(e["need"] for e in ds) or 1
    water = clamp(100 * (1 - irrig / 1050) - 60 * (short / need_all))
    inc = clamp((3 + sum(CROPS[e["crop"]]["value"] * e["suit"] * (0 if CROPS[e["crop"]].get("cover") else 1) for e in ds)
                 - (0.25 if gm else 0) + (0.2 if legume and not is_current else 0)) / 10 * 100)

    # resilience: how much suitability holds under the worst scenario + tolerance + diversity
    worst = climate(farm.prov, "ssp585")
    irr_all = IRRIGATION_MM[farm.water]

    def kept_one(s: dict) -> float:
        e = eval_crop(farm, s["crop"], s["start"], worst)
        wf = max(0.0, 1 - max(0.0, e["deficit"] - irr_all) / e["need"]) if e["deficit"] > 0 else 1.0
        return e["heat"] * e["soil"] * wf

    kept = avg(kept_one(s) for s in segs[1:]) or 0.5
    tol = avg((CROPS[e["crop"]]["drought"] + CROPS[e["crop"]]["heat"]) / 10 for e in ds) or 0.4
    res = clamp(100 * (0.42 * kept + 0.3 * tol + 0.28 * min(1, (fams - 1) / 2)))

    max_cap = max([CROPS[e["crop"]]["capital"] for e in ds] + [2])
    max_lab = max([CROPS[e["crop"]]["labor"] for e in ds] + [2])
    simp = clamp(100 - max(0, max_cap - farm.budget) * 16 - max(0, max_lab - farm.labor) * 13
                 - (len(segs) - 1) * 7 - max_cap * 3)

    W = farm.w
    wsum = (W.soil + W.water + W.inc + W.res + W.simp) or 1
    total = (soil * W.soil + water * W.water + inc * W.inc + res * W.res + simp * W.simp) / wsum
    return {"plan": plan, "segs": segs, "ds": ds, "soil": soil, "water": water, "inc": inc, "res": res,
            "simp": simp, "total": total, "irrig": irrig, "short": short, "covered": covered,
            "bare": 12 - covered, "legume": legume, "gm": gm, "fams": fams, "straw": straw}


def rank_plans(farm: Farm, scen: str):
    cur = evaluate_plan(farm, current_plan(farm), scen)
    ranked = sorted((evaluate_plan(farm, p, scen) for p in PLANS), key=lambda r: r["total"], reverse=True)
    return cur, ranked


def reasons(farm: Farm, r: dict, cur: Optional[dict] = None) -> List[dict]:
    """Plain-language explanations; `warn` marks risks."""
    out = []

    def ok(t: str) -> None:
        out.append({"text": t, "warn": False})

    def warn(t: str) -> None:
        out.append({"text": t, "warn": True})

    if r["legume"]:
        names = list(dict.fromkeys(CROPS[s["crop"]]["fil"] for s in r["segs"] if CROPS[s["crop"]]["legume"]))
        ok(f"Adds nitrogen to your soil with {' and '.join(names)}, so your next palay needs less fertilizer.")
    if r["gm"]:
        ok("Sesbania green manure is plowed in before wet-season palay, which feeds the soil and adds organic matter.")
    ok(f"Living roots cover the field {r['covered']} of 12 months"
       + (f" (bare for about {r['bare']} months)" if r["bare"] >= 3 else "") + ".")
    if r["straw"] == "incorporate" and cur and farm.straw != "incorporate":
        ok("Plow the rice straw back in instead of burning it: it returns nutrients and organic matter.")
    if r["irrig"] > 0:
        cmp = ""
        if cur:
            diff = cur["irrig"] - r["irrig"]
            cmp = f" ({js_round(diff)} mm less than now)" if diff > 0 else " (similar to now)"
        ok(f"Needs about {js_round(r['irrig'])} mm of irrigation in the dry season{cmp}.")
    else:
        ok("Grows on leftover soil moisture and dry-season rain alone, so no irrigation is needed.")
    for e in r["ds"]:
        fil = CROPS[e["crop"]]["fil"]
        if e["short"] > 40:
            warn(f"{fil}: about {js_round(e['short'])} mm short of water with your irrigation, which is a yield risk.")
        if e["heat"] < 0.85:
            warn(f"{fil} flowers when afternoons reach about {js_round(e['peak'])} °C: heat stress risk; plant early.")
        if e["soil"] < 0.85:
            warn(f"{fil} prefers well-drained soil or a different pH than yours; use raised beds or lime as needed.")
    if max([CROPS[e["crop"]]["capital"] for e in r["ds"]] + [0]) > farm.budget:
        warn("Needs more capital than your budget setting. Ask about DA or Landbank production loans.")
    return out[:7]


def plan_view(farm: Farm, r: dict, cur: Optional[dict] = None) -> dict:
    """JSON-friendly view of an evaluated plan."""
    p = r["plan"]
    return {
        "id": p["id"], "name": p["name"], "current": bool(p.get("current")),
        "total": r["total"], "soil": r["soil"], "water": r["water"], "inc": r["inc"], "res": r["res"], "simp": r["simp"],
        "irrig": r["irrig"], "short": r["short"], "covered": r["covered"], "bare": r["bare"],
        "legume": r["legume"], "gm": r["gm"],
        "segs": r["segs"],
        "ds": [{k: e[k] for k in ("crop", "heat", "soil", "short", "suit", "peak")} for e in r["ds"]],
        "reasons": reasons(farm, r, cur),
    }


def ranked_view(farm: Farm, scen: str) -> dict:
    cur, ranked = rank_plans(farm, scen)
    return {"scenario": scen, "current": plan_view(farm, cur), "plans": [plan_view(farm, r, cur) for r in ranked]}
