import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, dayCount, estimate, fmtDate, money } from "../lib/api";

export default function Dashboard() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listTrips().then(setTrips).catch((e) => setError(e.message));
  }, []);

  async function remove(id) {
    if (!confirm("Delete this trip? This can't be undone.")) return;
    await api.deleteTrip(id);
    setTrips((t) => t.filter((x) => x.id !== id));
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (trips || []).filter((t) => t.end_date >= today).sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My trips</h1>
          {trips && <p className="sub">
            {trips.length} saved{upcoming ? ` · Next up: ${upcoming.destination}, ${fmtDate(upcoming.start_date)}` : ""}
          </p>}
        </div>
        <Link to="/new" className="btn">Plan a trip</Link>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {!trips && !error && <p className="sub">Loading your trips…</p>}

      {trips?.length === 0 && (
        <div className="empty">
          <h3>No trips yet</h3>
          <p>Pick a destination, a budget and a few interests. We'll build the days for you.</p>
          <Link to="/new" className="btn">Plan your first trip</Link>
        </div>
      )}

      <ul className="trip-list">
        {trips?.map((t) => {
          const est = estimate(t.itinerary);
          const pct = Math.min(100, Math.round((est / t.budget) * 100));
          return (
            <li key={t.id} className="trip-row">
              <Link to={`/trips/${t.id}`} className="trip-main">
                <h3>{t.title}</h3>
                <p>{t.destination} · {fmtDate(t.start_date)} to {fmtDate(t.end_date)} · {dayCount(t.start_date, t.end_date)} days · {t.travelers} {t.travelers === 1 ? "traveler" : "travelers"}</p>
              </Link>
              <div className="trip-money">
                <span>{money(est, t.currency)} of {money(t.budget, t.currency)}</span>
                <div className={`bar ${est > t.budget ? "over" : ""}`}><i style={{ width: pct + "%" }} /></div>
              </div>
              <button className="btn ghost sm" onClick={() => remove(t.id)} aria-label={`Delete ${t.title}`}>Delete</button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
