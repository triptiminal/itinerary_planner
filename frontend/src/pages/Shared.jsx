import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, estimate, fmtDate, money } from "../lib/api";
import DayView from "../components/DayView";

export default function Shared() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api.shared(id).then(setTrip).catch((e) => setError(e.message)); }, [id]);

  if (error) return <div className="center-note"><p className="error">{error}</p><Link to="/" className="link">Go to Wayfarer</Link></div>;
  if (!trip) return <div className="center-note">Loading…</div>;

  return (
    <div className="shell">
      <header className="topbar"><Link to="/" className="brand">Wayfarer</Link></header>
      <main className="page">
        <h1>{trip.title}</h1>
        <p className="sub">{trip.destination} · {fmtDate(trip.start_date)} to {fmtDate(trip.end_date)} · about {money(estimate(trip.itinerary), trip.currency)}</p>
        {trip.itinerary.summary && <p className="summary">{trip.itinerary.summary}</p>}
        {trip.itinerary.days.map((d) => (
          <section key={d.day}>
            <h2 className="day-title">Day {d.day}: {d.theme}</h2>
            <DayView day={d} currency={trip.currency} />
          </section>
        ))}
      </main>
    </div>
  );
}
