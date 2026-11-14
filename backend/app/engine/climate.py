"""Monthly climate for a province under a scenario (NASA POWER baseline + CMIP6-style deltas)."""
from ..data import BASE, DS_MONTHS, MON, PROV, SCEN
from .util import js_round

AURORA_NE_MONSOON = (9, 10, 11, 0, 1)


def climate(prov: str, scen: str = "now") -> dict:
    p = PROV.get(prov, PROV["Nueva Ecija"])
    s = SCEN[scen]
    T = [t + p["dt"] + s["dT"] for t in BASE["T"]]
    X = [t + p["dt"] + s["dT"] * 1.1 for t in BASE["X"]]
    P = []
    for i, r in enumerate(BASE["P"]):
        dry = i in DS_MONTHS
        v = r * (p["ds"] if dry else p["ws"])
        if prov == "Aurora" and i in AURORA_NE_MONSOON:
            v = r * p["ds"] + 120
        P.append(js_round(v * (1 + (s["dsP"] if dry else s["wsP"]) / 100)))
    return {"T": T, "X": X, "P": P}


def clim_summary(prov: str, scen: str = "now") -> dict:
    c = climate(prov, scen)
    P, X = c["P"], c["X"]
    hot = max(X)
    onset = next((i for i, v in enumerate(P) if i >= 3 and v >= 150), -1)
    return {
        "ann": sum(P),
        "ds": sum(P[i] for i in DS_MONTHS),
        "dry": len([v for v in P if v < 60]),
        "hot": hot,
        "hot_month": MON[X.index(hot)],
        "onset": MON[onset] if onset >= 0 else "—",
        "series": c,
    }
