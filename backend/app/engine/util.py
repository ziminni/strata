import math
from typing import Iterable


def js_round(x: float) -> int:
    """Round half up, like JavaScript's Math.round (Python's round() is banker's rounding)."""
    return math.floor(x + 0.5)


def clamp(v: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, v))


def avg(values: Iterable[float]) -> float:
    vals = list(values)
    return sum(vals) / len(vals) if vals else 0.0
