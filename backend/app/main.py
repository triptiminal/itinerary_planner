from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import ai
from .auth import current_user
from .config import settings
from .db import db
from .schemas import RegenerateReq, TripPrefs, TripUpdate

app = FastAPI(title="Travel Itinerary Planner API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_trip(trip_id: str, user_id: str) -> dict:
    res = db.table("trips").select("*").eq("id", trip_id).eq("user_id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Trip not found.")
    return res.data[0]


def _generate_or_fail(fn, *args):
    try:
        return fn(*args)
    except Exception as e:
        raise HTTPException(502, f"Could not generate the itinerary: {e}")


@app.get("/api/health")
def health():
    return {"ok": True, "ai": bool(settings.gemini_api_key)}


@app.get("/api/trips")
def list_trips(user=Depends(current_user)):
    res = (
        db.table("trips")
        .select("id,title,destination,start_date,end_date,budget,currency,travelers,trip_type,is_public,itinerary,created_at")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


@app.post("/api/trips/generate")
def create_trip(prefs: TripPrefs, user=Depends(current_user)):
    row = prefs.model_dump(mode="json")
    row["title"] = row["title"] or f"{prefs.destination} trip"
    itinerary = _generate_or_fail(ai.generate_itinerary, row)
    row.update(user_id=user["id"], itinerary=itinerary)
    res = db.table("trips").insert(row).execute()
    return res.data[0]


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: str, user=Depends(current_user)):
    return _get_trip(trip_id, user["id"])


@app.put("/api/trips/{trip_id}")
def update_trip(trip_id: str, body: TripUpdate, user=Depends(current_user)):
    trip = _get_trip(trip_id, user["id"])
    patch = body.model_dump(exclude_none=True)
    if "itinerary" in patch:
        patch["itinerary"] = ai.recalc(trip, patch["itinerary"])
    if not patch:
        return trip
    res = db.table("trips").update(patch).eq("id", trip_id).eq("user_id", user["id"]).execute()
    return res.data[0]


@app.post("/api/trips/{trip_id}/regenerate")
def regenerate(trip_id: str, body: RegenerateReq, user=Depends(current_user)):
    trip = _get_trip(trip_id, user["id"])
    if body.scope == "day":
        total = len(trip["itinerary"]["days"])
        if not body.day or not 1 <= body.day <= total:
            raise HTTPException(422, "Pick a valid day to regenerate.")
        itinerary = _generate_or_fail(ai.regenerate_day, trip, body.day, body.instructions)
    else:
        itinerary = _generate_or_fail(ai.generate_itinerary, trip, body.instructions)
    res = db.table("trips").update({"itinerary": itinerary}).eq("id", trip_id).eq("user_id", user["id"]).execute()
    return res.data[0]


@app.delete("/api/trips/{trip_id}", status_code=204)
def delete_trip(trip_id: str, user=Depends(current_user)):
    _get_trip(trip_id, user["id"])
    db.table("trips").delete().eq("id", trip_id).eq("user_id", user["id"]).execute()


@app.get("/api/shared/{trip_id}")
def shared_trip(trip_id: str):
    res = (
        db.table("trips")
        .select("title,destination,start_date,end_date,budget,currency,travelers,trip_type,itinerary")
        .eq("id", trip_id)
        .eq("is_public", True)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "This trip isn't shared.")
    return res.data[0]
