import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, dayCount, estimate, fmtDate, money } from "../lib/api";
import DayView from "../components/DayView";

export default function TripView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [trip, setTrip] = useState(null);
  const [itin, setItin] = useState(null);
  const [active, setActive] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = (t) => { setTrip(t); setItin(t.itinerary); setDirty(false); };

  useEffect(() => { api.getTrip(id).then(load).catch((e) => setError(e.message)); }, [id]);

  const est = useMemo(() => estimate(itin), [itin]);
  if (error && !trip) return <p className="error" role="alert">{error}</p>;
  if (!trip || !itin) return <p className="sub">Loading trip…</p>;

  const days = itin.days || [];
  const day = days[Math.min(active, days.length - 1)];
  const over = est > trip.budget;

  const edit = (idx, nextDay) => {
    setItin({ ...itin, days: days.map((d, i) => (i === idx ? nextDay : d)) });
    setDirty(true);
  };

  async function run(label, fn) {
    setError(""); setBusy(label);
    try { await fn(); } catch (e) { setError(e.message); }
    setBusy("");
  }

  const save = () => run("save", async () => load(await api.updateTrip(id, { itinerary: itin })));

  const regen = (scope) => run(scope, async () => {
    if (dirty) await api.updateTrip(id, { itinerary: itin });
    load(await api.regenerate(id, { scope, day: scope === "day" ? day.day : null, instructions: note }));
    setNote("");
  });

  const share = () => run("share", async () => {
    const t = await api.updateTrip(id, { is_public: !trip.is_public });
    setTrip(t);
    if (t.is_public) await navigator.clipboard?.writeText(`${location.origin}/shared/${id}`);
  });

  const remove = async () => {
    if (!confirm("Delete this trip? This can't be undone.")) return;
    await api.deleteTrip(id);
    nav("/");
  };

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/" className="link">All trips</Link>
          <h1>{trip.title}</h1>
          <p className="sub">{trip.destination} · {fmtDate(trip.start_date)} to {fmtDate(trip.end_date)} · {dayCount(trip.start_date, trip.end_date)} days · {trip.travelers} {trip.travelers === 1 ? "traveler" : "travelers"}</p>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={share} disabled={!!busy}>{trip.is_public ? "Stop sharing" : "Share link"}</button>
          <button className="btn ghost" onClick={() => window.print()}>Print</button>
          <button className="btn" onClick={save} disabled={!dirty || !!busy}>{busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
        </div>
      </div>

      {trip.is_public && <p className="notice">Anyone with this link can view the trip: {location.origin}/shared/{id} (copied)</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {itin.summary && <p className="summary">{itin.summary}</p>}

      <section className="budget" aria-label="Budget">
        <div><b>{money(est, trip.currency)}</b> estimated of {money(trip.budget, trip.currency)}</div>
        <div className={`bar ${over ? "over" : ""}`}><i style={{ width: Math.min(100, (est / trip.budget) * 100) + "%" }} /></div>
        <p className="sub">{over ? `${money(est - trip.budget, trip.currency)} over budget. Edit stops or regenerate to bring it down.` : `${money(trip.budget - est, trip.currency)} left to spend.`}</p>
      </section>

      <div className="split">
        <aside className="days">
          <ul>
            {days.map((d, i) => {
              const cost = (d.activities || []).reduce((s, a) => s + Number(a.cost_estimate || 0), 0);
              return (
                <li key={d.day}>
                  <button className={i === active ? "on" : ""} onClick={() => setActive(i)}>
                    <b>Day {d.day}</b>
                    <span>{d.date && fmtDate(d.date)} · {money(cost, trip.currency)}</span>
                    <em>{d.theme}</em>
                  </button>
                </li>
              );
            })}
          </ul>

          {itin.accommodation && (
            <div className="side-card">
              <h4>Where you'll stay</h4>
              <p><b>{itin.accommodation.name}</b></p>
              <p>{itin.accommodation.area}</p>
              <p>{money(itin.accommodation.price_per_night, trip.currency)} per night</p>
              <p className="sub">{itin.accommodation.why}</p>
            </div>
          )}
          {itin.tips?.length > 0 && (
            <div className="side-card">
              <h4>Good to know</h4>
              <ul className="tips">{itin.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
        </aside>

        <section>
          {day && (
            <>
              <h2 className="day-title">Day {day.day}: {day.theme}</h2>
              <DayView day={day} currency={trip.currency} editable onChange={(n) => edit(active, n)} />

              <div className="regen">
                <label>Change something about this trip
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="More vegetarian food, fewer museums, start later…" />
                </label>
                <div className="row">
                  <button className="btn ghost" disabled={!!busy} onClick={() => regen("day")}>{busy === "day" ? "Rewriting day…" : `Regenerate day ${day.day}`}</button>
                  <button className="btn ghost" disabled={!!busy} onClick={() => regen("all")}>{busy === "all" ? "Rebuilding trip…" : "Regenerate whole trip"}</button>
                  <button className="btn danger" onClick={remove}>Delete trip</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
