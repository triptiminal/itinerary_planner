# Personalized Travel Itinerary Planner (Wayfarer)

[![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ECF8E.svg)](https://supabase.com/)
[![Google GenAI](https://img.shields.io/badge/Google%20GenAI-Gemini-8E75C4.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Skill Wallet Capstone Project**
> **Category:** Generative AI | Travel Decision Support

---

## Executive Summary & Scope

The **Personalized Travel Itinerary Planner** is a full-stack, AI-powered web application that turns a few preferences into a complete, day-by-day travel plan. Travelers enter a destination, dates, budget, travel style and interests. The platform uses prompt-engineered **Google Gemini** generation to return an itinerary with attractions, dining, accommodation and local transport, along with a running cost estimate checked against the budget.

The stack is a **React (Vite)** frontend, a **FastAPI** backend and **Supabase** for authentication and Postgres storage with row-level security. Users can generate, save, edit, regenerate (a single day or the whole trip), print and share trips through a modern SaaS-style dashboard.

The backend ships with a **demonstration fallback**. If no `GEMINI_API_KEY` is configured, the API returns a placeholder itinerary so the full UI and database flow can be tested without credentials.

---

## Kanban Epics Implementation

| Epic | Designation | Implemented Modules & Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Epic 1** | Vibe Coding Environment Setup | Monorepo layout, Vite + React app, FastAPI app, `requirements.txt`, `package.json`, `.env.example` files, Python venv workflow | Implemented |
| **Epic 2** | Supabase Database Setup | `supabase/schema.sql`: `trips` table, indexes, `updated_at` trigger, Row Level Security policies, Supabase email/password auth | Implemented |
| **Epic 3** | Preference Collection & Recommendation Engine | Smart trip builder (destination, dates, budget and currency, solo/couple/group, pace, stay style, interest chips, free-text notes) with Pydantic validation | Implemented |
| **Epic 4** | Itinerary Generation & Personalization | Gemini prompt engineering, strict JSON itinerary schema, JSON extraction with one retry, per-day and whole-trip regeneration with custom instructions, inline stop editing, cost recalculation | Implemented |
| **Epic 5** | Productization & Deployment | SaaS dashboard, budget meters, public share links, print stylesheet, responsive layout, loading and error states | Implemented |
| **Epic 6** | Deployment | Frontend on Vercel/Netlify, backend on Render/Railway, Supabase cloud (see deployment guide below) | Implemented |
| **Epic 7** | Final Testing & Documentation | This README, API reference, JSON contract, manual test checklist | Implemented |

---

## Key Modules & Capabilities

### 1. Smart Trip Builder (Epic 3)
- **Preference collection:** destination, trip name, travel dates (up to 14 days), total budget, and currency (INR, USD, EUR, GBP, AED, SGD, THB).
- **Traveler profiles:** Solo, Couple or Group. Group size is configurable up to 30.
- **Style controls:** Pace (Relaxed, Balanced, Packed), stay and dining tier (Budget, Mid-range, Premium), ten interest tags and free-text notes such as dietary needs or travelling with children.
- **Server-side validation:** Pydantic rejects reversed dates, trips longer than 14 days and non-positive budgets.

### 2. AI Itinerary Generation & Personalization (Epic 4)
- **Prompt engineering:** a system prompt enforces JSON-only output, realistic and geographically clustered stops, 4 to 6 activities per day including meals, transit entries between areas, and costs that stay within budget.
- **Structured output:** every itinerary contains a summary, an accommodation recommendation, day-wise activities (time, type, location, description, duration, cost) and practical tips.
- **Targeted regeneration:** rewrite only Day N, or the whole trip, with instructions such as "more vegetarian food" or "fewer museums". Regeneration sees the existing plan so it avoids repeats.
- **Manual editing:** change times, types, titles, locations, notes and costs, or add and delete stops. Totals update live and are recomputed server-side on save.

### 3. Itinerary Experience & Productization (Epic 5)
- **Route-style timeline:** each day renders as a transit line, with stops color-coded as Sight, Food, Stay or Transit.
- **Budget tracking:** estimated cost (activities plus accommodation nights) against budget, with an over-budget warning.
- **Dashboard:** all saved trips with dates, group size and budget bars, plus the next upcoming trip.
- **Sharing & printing:** one-click public read-only link, and a print stylesheet for a clean paper or PDF copy.

### 4. Security & Data Isolation (Epic 2)
- **Row Level Security** on the `trips` table, so users can only read and write their own rows.
- **Token validation:** the backend verifies every request's Supabase access token before touching data.
- **Ownership filtering:** every backend query filters by `user_id`, because the service-role key bypasses RLS.
- **Public sharing is opt-in:** only trips with `is_public = true` are served by the unauthenticated shared endpoint.

---

## Directory Structure

```
travel-planner/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI routes: trips CRUD, generate, regenerate, shared
│   │   ├── ai.py                 # Gemini prompts, JSON extraction, demo fallback, cost recalculation
│   │   ├── auth.py               # Supabase JWT verification dependency
│   │   ├── config.py             # Environment settings (pydantic-settings)
│   │   ├── db.py                 # Supabase client (service role)
│   │   └── schemas.py            # Pydantic request models and validation
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Top bar and navigation
│   │   │   └── DayView.jsx       # Route timeline and inline stop editor
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Supabase session provider
│   │   ├── lib/
│   │   │   ├── supabase.js       # Supabase browser client
│   │   │   └── api.js            # API client, currency/date helpers, cost estimator
│   │   ├── pages/
│   │   │   ├── Auth.jsx          # Sign in / sign up
│   │   │   ├── Dashboard.jsx     # My trips
│   │   │   ├── NewTrip.jsx       # Trip builder
│   │   │   ├── TripView.jsx      # Itinerary, editing, regeneration, sharing
│   │   │   └── Shared.jsx        # Public read-only trip
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── supabase/
│   └── schema.sql                # Table, trigger, RLS policies
└── README.md
```

---

## Quickstart Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/travel-planner.git
cd travel-planner
```

### 2. Set Up Supabase (Epic 2)
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.
3. From **Project Settings > API**, copy the **Project URL**, the **anon** key and the **service_role** key.
4. (Testing only) Under **Authentication > Providers > Email**, turn off "Confirm email" for instant sign-ups.

### 3. Run the Backend

**Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Interactive API docs are available at `http://localhost:8000/docs`.

### 4. Run the Frontend
```bash
cd frontend
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev
```
Open your browser at `http://localhost:5173`, create an account and plan your first trip.

---

## Environment Variables

### `backend/.env`
```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Optional. Leave blank to run in demo mode.
GEMINI_API_KEY=AIzaSyYourActualKeyHere
AI_MODEL=gemini-2.5-flash

CORS_ORIGINS=http://localhost:5173
```

### `frontend/.env`
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

> **Security note:** `SUPABASE_SERVICE_KEY` and `GEMINI_API_KEY` belong in the backend only. Never place them in the frontend `.env` or commit either `.env` file.

---

## Gemini API Key Configuration

The backend runs in **Demonstration Mode** without credentials and returns placeholder itineraries.

To enable live AI generation:
1. Obtain an API key from Google AI Studio (https://aistudio.google.com/).
2. Add it to `backend/.env` as `GEMINI_API_KEY`.
3. Restart the backend. `GET /api/health` should now report `"ai": true`.

To switch models, change `AI_MODEL` (for example `gemini-2.5-flash` for speed, or `gemini-2.5-pro` for richer plans).

---

## Deployment (Epic 6)

| Layer | Recommended host | Notes |
| :--- | :--- | :--- |
| Database & Auth | Supabase Cloud | Already hosted. Nothing else to deploy |
| Backend | Render | Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Frontend | Vercel | Build command: `npm run build`, output directory: `dist` |

### Backend (Render example)
1. Create a new **Web Service** from your GitHub repo, with root directory `backend`.
2. Build command: `pip install -r requirements.txt`.
3. Add the environment variables from `backend/.env`. Set `CORS_ORIGINS` to your deployed frontend URL.

### Frontend (Vercel example)
1. Import the repo with root directory `frontend`.
2. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_API_URL` (your deployed backend URL).
3. Add a `vercel.json` so deep links like `/trips/:id` and `/shared/:id` work on refresh:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
   ```
   (On Netlify, add a `_redirects` file containing `/* /index.html 200`.)

### Supabase
Under **Authentication > URL Configuration**, set the **Site URL** to your deployed frontend URL.


## API Reference

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | No | Service status and whether AI is configured |
| GET | `/api/trips` | Yes | List the current user's trips |
| POST | `/api/trips/generate` | Yes | Create a trip and generate its itinerary |
| GET | `/api/trips/{id}` | Yes | Fetch one trip |
| PUT | `/api/trips/{id}` | Yes | Save edits, rename, or toggle `is_public` |
| POST | `/api/trips/{id}/regenerate` | Yes | Body: `{ "scope": "day" \| "all", "day": 2, "instructions": "..." }` |
| DELETE | `/api/trips/{id}` | Yes | Delete a trip |
| GET | `/api/shared/{id}` | No | Read-only view of a shared trip |

---

## JSON Data Contract (Itinerary Schema)

```json
{
  "summary": "A relaxed three-day food and heritage weekend in Jaipur.",
  "accommodation": {
    "name": "Boutique haveli near Hawa Mahal",
    "area": "Pink City",
    "price_per_night": 4500,
    "why": "Walkable to the old-city sights and bazaars."
  },
  "days": [
    {
      "day": 1,
      "date": "2026-11-14",
      "theme": "Old city and heritage",
      "activities": [
        {
          "time": "09:00",
          "title": "Amber Fort",
          "type": "attraction",
          "location": "Amer, Jaipur",
          "description": "Arrive early to beat the crowds and the heat.",
          "duration": "2h 30m",
          "cost_estimate": 1200
        }
      ]
    }
  ],
  "tips": ["Book popular attractions ahead of time."],
  "total_estimated_cost": 18500
}
```

`type` is one of `attraction`, `food`, `stay`, `transport`. `cost_estimate` is the total for the whole group in the trip's currency. `total_estimated_cost` is recalculated by the backend as the sum of all activities plus the nightly rate for each night.


## Planning Disclaimer

This application is an AI-assisted planning tool. Generated itineraries, opening hours, prices and travel times are estimates and may be inaccurate or out of date. Verify bookings, entry requirements, visas, safety advisories and local conditions with official sources before you travel.

---

## Author & Credits

- **Skill Wallet Capstone Project**
- **Tech Stack:** React 18, Vite, FastAPI, Supabase (Auth + Postgres + RLS), Google Gemini, Pydantic.