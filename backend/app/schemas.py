from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class TripPrefs(BaseModel):
    title: str | None = None
    destination: str = Field(min_length=2, max_length=120)
    start_date: date
    end_date: date
    budget: float = Field(gt=0)
    currency: str = "INR"
    travelers: int = Field(default=1, ge=1, le=30)
    trip_type: Literal["solo", "couple", "group"] = "solo"
    pace: Literal["relaxed", "balanced", "packed"] = "balanced"
    style: Literal["budget", "mid-range", "premium"] = "mid-range"
    interests: list[str] = []
    notes: str = ""

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date.")
        if (self.end_date - self.start_date).days > 13:
            raise ValueError("Trips are limited to 14 days.")
        return self


class TripUpdate(BaseModel):
    title: str | None = None
    itinerary: dict | None = None
    is_public: bool | None = None


class RegenerateReq(BaseModel):
    scope: Literal["all", "day"] = "all"
    day: int | None = None
    instructions: str = ""
