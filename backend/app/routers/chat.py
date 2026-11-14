"""AI farm adviser backed by Gemini, with a tool to recompute rotation plans."""
import json
import logging
import os
from datetime import date

import httpx
from fastapi import APIRouter, HTTPException

from .. import db
from ..data import CROPS, SCEN
from ..engine.climate import clim_summary
from ..engine.rotation import active_plan, rank_plans, reasons
from ..schemas import ChatRequest, Farm

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
TIMEOUT_S = 60
MAX_TOOL_ROUNDS = 3

TOOLS = [{"functionDeclarations": [{
    "name": "evaluate_plans",
    "description": "Recompute and rank this farm's rotation plans under different conditions. "
                   "Returns the top plans with relative scores (0-100) and irrigation needs.",
    "parameters": {"type": "OBJECT", "properties": {
        "water_source": {"type": "STRING", "enum": ["canal", "limited", "rainfed"],
                         "description": "Irrigation availability in the dry season"},
        "budget": {"type": "STRING", "enum": ["low", "medium", "high"]},
        "scenario": {"type": "STRING", "enum": ["now", "ssp245", "ssp585"],
                     "description": "Climate: today, 2050 moderate, 2050 high emissions"},
        "priority_focus": {"type": "STRING", "enum": ["soil", "water", "income", "resilience", "ease"],
                           "description": "Optionally make one goal the top priority"},
    }},
}]}]


def _scores(r: dict) -> dict:
    return {"name": r["plan"]["name"], "fit": round(r["total"]), "soil": round(r["soil"]), "water": round(r["water"]),
            "income": round(r["inc"]), "resilience": round(r["res"]), "ease": round(r["simp"]),
            "irrigation_mm": round(r["irrig"])}


def evaluate_plans_tool(farm: Farm, args: dict) -> dict:
    update = {}
    if args.get("water_source") in ("canal", "limited", "rainfed"):
        update["water"] = args["water_source"]
    if args.get("budget") in ("low", "medium", "high"):
        update["budget"] = {"low": 2, "medium": 3.5, "high": 5}[args["budget"]]
    key = {"soil": "soil", "water": "water", "income": "inc", "resilience": "res", "ease": "simp"}.get(args.get("priority_focus"))
    if key:
        update["w"] = farm.w.model_copy(update={key: 5})
    scen = args.get("scenario") if args.get("scenario") in SCEN else "ssp245"
    cur, ranked = rank_plans(farm.model_copy(update=update), scen)
    return {"conditions": args,
            "current_practice": {"fit": round(cur["total"]), "irrigation_mm": round(cur["irrig"])},
            "top": [{**_scores(r), "water_shortfall_mm": round(r["short"])} for r in ranked[:4]]}


def build_context(farm: Farm, req: ChatRequest) -> dict:
    cur, ranked = rank_plans(farm, "ssp245")
    cs, c5 = clim_summary(farm.prov, "now"), clim_summary(farm.prov, "ssp245")
    ctx = {
        "farm": {"name": farm.name or "(not set)", "location": f"{farm.mun}, {farm.prov}, Philippines",
                 "area_ha": farm.area, "water_source": farm.water,
                 "soil": {"texture": farm.tex, "drainage": farm.drain, "ph": farm.ph, "organic_matter_pct": farm.om},
                 "current_practice": f"wet season rice, dry season {farm.dry}, straw {farm.straw}",
                 "budget": farm.budget, "labor": farm.labor, "priorities_0to5": farm.w.model_dump()},
        "climate_now": {"annual_rain_mm": cs["ann"], "dry_season_rain_mm": cs["ds"], "hottest_month": cs["hot_month"],
                        "hottest_month_avg_max_c": round(cs["hot"], 1), "rainy_season_onset": cs["onset"],
                        "source": "NASA POWER climatology (approximate prototype values)"},
        "climate_2050_moderate": {"temp_change_c": SCEN["ssp245"]["dT"], "dry_season_rain_change_pct": SCEN["ssp245"]["dsP"],
                                  "dry_season_rain_mm": c5["ds"], "source": "NEX-GDDP-CMIP6 style change factors"},
        "today": date.today().isoformat(),
        "season_now": req.season_now or "unknown",
        "plan_in_calendar": active_plan(farm)["name"],
        "current_practice_scores": _scores(cur),
        "top_plans": [{**_scores(r),
                       "planting": [f"{CROPS[s['crop']]['en']} {s['start']:%b %d}–{s['end']:%b %d}" for s in r["segs"][1:]],
                       "risks": [x["text"] for x in reasons(farm, r, cur) if x["warn"]]} for r in ranked[:4]],
        "recent_logs": [{"date": l["date"], "type": l["type"], "crop": l["crop"], "notes": l["notes"],
                         "yield_kg": l["yield_kg"]} for l in db.list_logs(5)],
    }
    if req.sensor:
        s = req.sensor
        ctx["sensor_latest"] = {"water_level_cm": round(s.water_level_cm, 1), "soil_moisture_pct": round(s.soil_moisture_pct, 1),
                                "soil_temp_c": round(s.soil_temp_c, 1), "awd_alert": s.water_level_cm <= -15}
    return ctx


def system_prompt(lang: str, ctx: dict) -> str:
    lang_desc = "Taglish (natural mix of Tagalog and English, like Filipino farmers speak)" if lang == "Taglish" else lang
    return f"""You are Strata, a friendly farm adviser for smallholder rice farmers in Central Luzon, Philippines. You help them choose crop rotations that protect soil, save water and adapt to a changing climate.
Rules:
- Reply in {lang_desc}. Use simple words a farmer understands. Keep answers short: at most about 150 words, with a short list when useful.
- Use ONLY the numbers in the farm data below or returned by the evaluate_plans tool. Never invent prices, yields or climate figures. If something isn't in the data, say so and suggest asking the Municipal Agriculturist, PhilRice or DA.
- Plan scores are relative fit scores (0–100), not pesos or tons.
- When the farmer asks "what if" (different irrigation, budget, priorities, or climate scenario), call evaluate_plans to recompute instead of guessing.
- Give planting months, the main benefit for the soil, water needs and the main risk when recommending.
FARM DATA (JSON):
{json.dumps(ctx, ensure_ascii=False)}"""


@router.post("/chat")
async def chat(req: ChatRequest):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(503, "Set GEMINI_API_KEY before starting the backend.")

    farm = db.get_farm()
    contents = [{"role": "model" if m.role == "assistant" else "user", "parts": [{"text": m.content}]}
                for m in req.messages]
    payload = {"systemInstruction": {"parts": [{"text": system_prompt(req.language, build_context(farm, req))}]},
               "tools": TOOLS}
    tool_notes = []

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_S) as client:
            for _ in range(MAX_TOOL_ROUNDS + 1):
                res = await client.post(GEMINI_URL.format(model=GEMINI_MODEL), headers={"x-goog-api-key": key},
                                        json={**payload, "contents": contents})
                data = res.json()
                if res.status_code >= 400:
                    raise HTTPException(502, data.get("error", {}).get("message") or f"Gemini API error ({res.status_code}).")
                content = (data.get("candidates") or [{}])[0].get("content") or {}
                parts = content.get("parts") or []
                calls = [p["functionCall"] for p in parts if "functionCall" in p]
                if not calls:
                    reply = "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
                    if not reply:
                        raise HTTPException(502, "Gemini returned an empty reply.")
                    return {"reply": reply, "tool_notes": tool_notes}
                contents.append({"role": "model", **content})
                responses = []
                for call in calls:
                    args = call.get("args") or {}
                    result = (evaluate_plans_tool(farm, args) if call.get("name") == "evaluate_plans"
                              else {"error": "Unknown tool"})
                    tool_notes.append("Recalculated plans for: " + ", ".join(f"{k}={v}" for k, v in args.items()))
                    responses.append({"functionResponse": {"name": call.get("name"), "response": result}})
                contents.append({"role": "user", "parts": responses})
    except httpx.TimeoutException:
        raise HTTPException(504, "Gemini took too long to respond. Please try again.")
    except httpx.HTTPError:
        log.exception("Gemini request failed")
        raise HTTPException(502, "Unable to get a reply from Gemini.")
    raise HTTPException(502, "The adviser used too many tool calls. Please rephrase your question.")
