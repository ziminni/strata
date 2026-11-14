from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from .data import CROPS, LOGTYPES, PLAN_IDS, PROV

Scenario = Literal["now", "ssp245", "ssp585"]
PostType = Literal["update", "question", "advice", "warning", "harvest"]


class Weights(BaseModel):
    soil: int = Field(4, ge=0, le=5)
    water: int = Field(3, ge=0, le=5)
    inc: int = Field(5, ge=0, le=5)
    res: int = Field(4, ge=0, le=5)
    simp: int = Field(3, ge=0, le=5)


class Farm(BaseModel):
    name: str = Field("", max_length=80)
    prov: str = "Nueva Ecija"
    mun: str = "Science City of Muñoz"
    area: float = Field(2, gt=0, le=1000)
    water: Literal["canal", "limited", "rainfed"] = "canal"
    tex: Literal["clay", "clayloam", "loam", "sandy"] = "clayloam"
    drain: Literal["poor", "mod", "good"] = "mod"
    ph: float = Field(5.9, ge=4, le=9)
    om: float = Field(1.6, ge=0.2, le=8)
    wet: Literal["rice"] = "rice"
    dry: Literal["rice", "fallow", "monggo", "sibuyas", "mais"] = "rice"
    straw: Literal["burn", "remove", "incorporate"] = "burn"
    budget: float = Field(3.5, ge=1, le=5)
    labor: float = Field(3.5, ge=1, le=5)
    w: Weights = Field(default_factory=Weights)
    adopted: Optional[str] = None

    @field_validator("prov")
    @classmethod
    def known_province(cls, v: str) -> str:
        if v not in PROV:
            raise ValueError("Unknown province")
        return v

    @field_validator("adopted")
    @classmethod
    def known_plan(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PLAN_IDS:
            raise ValueError("Unknown plan")
        return v

    @model_validator(mode="after")
    def municipality_in_province(self) -> "Farm":
        if self.mun not in PROV[self.prov]["mun"]:
            self.mun = PROV[self.prov]["mun"][0]
        return self


class LogIn(BaseModel):
    date: date
    type: str
    crop: str
    amount: str = Field("", max_length=200)
    cost: float = Field(0, ge=0)
    yield_kg: float = Field(0, ge=0)
    notes: str = Field("", max_length=2000)
    visibility: Literal["private", "community"] = "private"

    @field_validator("type")
    @classmethod
    def known_type(cls, v: str) -> str:
        if v not in LOGTYPES:
            raise ValueError("Unknown log type")
        return v

    @field_validator("crop")
    @classmethod
    def known_crop(cls, v: str) -> str:
        if v not in CROPS or v == "fallow":
            raise ValueError("Unknown crop")
        return v


class PostIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    type: PostType = "update"
    crop: str = ""

    @field_validator("crop")
    @classmethod
    def known_crop(cls, v: str) -> str:
        if v and v not in CROPS:
            raise ValueError("Unknown crop")
        return v


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class SensorReading(BaseModel):
    water_level_cm: float
    soil_moisture_pct: float
    soil_temp_c: float


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, max_length=40)
    language: Literal["English", "Filipino", "Taglish"] = "English"
    sensor: Optional[SensorReading] = None
    season_now: Optional[str] = Field(None, max_length=200)
