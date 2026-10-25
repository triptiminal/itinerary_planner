import json
from datetime import date, timedelta

from google import genai
from google.genai import types

from .config import settings

SYSTEM = """You are a senior travel planner who writes realistic, well-paced itineraries.
Rules:
- Respond with ONE valid JSON object and nothing else (no markdown, no commentary).
- Use real, well-known places in the destination. Group stops that are close together to cut travel time.
- Every day has 4-6 activities in chronological order, including meals. Match the requested pace:
  relaxed = fewer, longer stops; balanced = normal; packed = more stops.
- Include transport entries (type "transport") for meaningful transfers.
- cost_estimate is the total for the WHOLE group, in the requested currency, as a number.
- Keep total cost (activities + accommodation nights) at or under the budget.
- Respect travel style (budget / mid-range / premium) in dining and stay choices.
Schema:
{
 "summary": "2 sentence overview",
 "accommodation": {"name": "", "area": "", "price_per_night": 0, "why": ""},
 "days": [{"day": 1, "date": "YYYY-MM-DD", "theme": "",
   "activities": [{"time": "09:00", "title": "", "type": "attraction|food|stay|transport",
                   "location": "", "description": "", "duration": "1h 30m", "cost_estimate": 0}]}],
 "tips": ["short practical tip"]
}"""


def n_days(trip: dict) -> int:
    s = date.fromisoformat(str(trip["start_date"]))
    e = date.fromisoformat(str(trip["end_date"]))
    return (e - s).days + 1


def _brief(trip: dict) -> str:
    return (
        f"Destination: {trip['destination']}\n"
        f"Dates: {trip['start_date']} to {trip['end_date']} ({n_days(trip)} days)\n"
        f"Travelers: {trip['travelers']} ({trip['trip_type']})\n"
        f"Total budget: {trip['budget']} {trip['currency']}\n"
        f"Pace: {trip['pace']} | Style: {trip['style']}\n"
        f"Interests: {', '.join(trip.get('interests') or []) or 'general sightseeing'}\n"
        f"Notes: {trip.get('notes') or 'none'}"
    )


def _extract_json(text: str) -> dict:
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Model did not return JSON")
    return json.loads(text[start : end + 1])


def _call(prompt: str) -> dict:
    client = genai.Client(api_key=settings.gemini_api_key)
    last_err = None
    for _ in range(2):
        try:
            response = client.models.generate_content(
                model=settings.ai_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM,
                    max_output_tokens=8000,
                ),
            )
            text = response.text
            return _extract_json(text)
        except Exception as e:  # retry once on malformed JSON or API errors
            last_err = e
    raise RuntimeError(f"Google AI returned invalid JSON or failed: {last_err}")


def recalc(trip: dict, itin: dict) -> dict:
    days = itin.get("days", [])
    nights = max(len(days) - 1, 0)
    stay = float((itin.get("accommodation") or {}).get("price_per_night") or 0)
    acts = sum(float(a.get("cost_estimate") or 0) for d in days for a in d.get("activities", []))
    itin["total_estimated_cost"] = round(acts + stay * nights)
    return itin


def generate_itinerary(trip: dict, instructions: str = "") -> dict:
    if not settings.gemini_api_key:
        return recalc(trip, _demo(trip))
    prompt = f"Create a full itinerary.\n{_brief(trip)}"
    if instructions:
        prompt += f"\nExtra requests: {instructions}"
    return recalc(trip, _call(prompt))


def regenerate_day(trip: dict, day_no: int, instructions: str = "") -> dict:
    itin = trip["itinerary"]
    if not settings.gemini_api_key:
        fresh = _demo(trip)["days"]
        new_day = fresh[min(day_no - 1, len(fresh) - 1)]
    else:
        prompt = (
            f"{_brief(trip)}\n\nCurrent itinerary:\n{json.dumps(itin)}\n\n"
            f"Rewrite ONLY day {day_no} with different activities than before, keeping the other days in mind "
            f"to avoid repeats. Extra requests: {instructions or 'none'}.\n"
            'Return JSON: {"day": {...one day object in the schema...}}'
        )
        new_day = _call(prompt)["day"]
    new_day["day"] = day_no
    itin["days"] = [new_day if d["day"] == day_no else d for d in itin["days"]]
    return recalc(trip, itin)


def _demo(trip: dict) -> dict:
    """Deterministic placeholder so the app runs before an AI key is configured."""
    dest = trip["destination"]
    start = date.fromisoformat(str(trip["start_date"]))
    days = n_days(trip)
    per_day = trip["budget"] / days
    interests = trip.get("interests") or ["sightseeing"]
    out = []
    for i in range(days):
        theme = interests[i % len(interests)].title()
        out.append(
            {
                "day": i + 1,
                "date": str(start + timedelta(days=i)),
                "theme": f"{theme} in {dest}",
                "activities": [
                    {"time": "08:30", "title": "Breakfast at a local favourite", "type": "food",
                     "location": f"Central {dest}", "description": "Start with a regional breakfast.",
                     "duration": "1h", "cost_estimate": round(per_day * 0.06)},
                    {"time": "10:00", "title": f"Top {theme.lower()} stop", "type": "attraction",
                     "location": dest, "description": "Demo data. Add a Google API key for real plans.",
                     "duration": "2h 30m", "cost_estimate": round(per_day * 0.12)},
                    {"time": "13:00", "title": "Lunch", "type": "food", "location": dest,
                     "description": "Casual lunch near the previous stop.", "duration": "1h 15m",
                     "cost_estimate": round(per_day * 0.1)},
                    {"time": "14:30", "title": "Local transfer", "type": "transport", "location": dest,
                     "description": "Taxi or metro to the next area.", "duration": "30m",
                     "cost_estimate": round(per_day * 0.04)},
                    {"time": "15:30", "title": "Neighbourhood walk and markets", "type": "attraction",
                     "location": dest, "description": "Wander, shop, people-watch.", "duration": "2h",
                     "cost_estimate": round(per_day * 0.05)},
                    {"time": "19:30", "title": "Dinner", "type": "food", "location": dest,
                     "description": "Well-reviewed dinner spot.", "duration": "1h 30m",
                     "cost_estimate": round(per_day * 0.14)},
                ],
            }
        )
    return {
        "summary": f"Demo itinerary for {dest}. Set gemini_api_key on the backend to get real, personalised plans.",
        "accommodation": {"name": f"Stay in central {dest}", "area": "City centre",
                          "price_per_night": round(per_day * 0.3), "why": "Close to most stops."},
        "days": out,
        "tips": ["This is placeholder data.", "Book popular attractions ahead of time."],
    }