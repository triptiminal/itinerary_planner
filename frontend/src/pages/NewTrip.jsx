import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const INTERESTS = ["Food", "Sightseeing", "History", "Nature", "Adventure", "Nightlife", "Shopping", "Art & culture", "Beaches", "Wellness"];
const TYPES = [["solo", "Solo"], ["couple", "Couple"], ["group", "Group"]];
const PACES = [["relaxed", "Relaxed"], ["balanced", "Balanced"], ["packed", "Packed"]];
const STYLES = [["budget", "Budget"], ["mid-range", "Mid-range"], ["premium", "Premium"]];
const iso = (d) => d.toISOString().slice(0, 10);

function Seg({ label, value, onChange, options }) {
  return (
    <fieldset className="seg">
      <legend>{label}</legend>
      <div>
        {options.map(([v, l]) => (
          <button type="button" key={v} className={value === v ? "on" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
        ))}
      </div>
    </fieldset>
  );
}

export default function NewTrip() {
  const nav = useNavigate();
  const soon = new Date(Date.now() + 14 * 864e5);
  const [f, setF] = useState({
    destination: "", start_date: iso(soon), end_date: iso(new Date(soon.getTime() + 2 * 864e5)),
    budget: 30000, currency: "INR", travelers: 1, trip_type: "solo", pace: "balanced",
    style: "mid-range", interests: ["Food", "Sightseeing"], notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const pickType = (t) => setF((p) => ({ ...p, trip_type: t, travelers: t === "solo" ? 1 : t === "couple" ? 2 : Math.max(p.travelers, 3) }));
  const toggle = (i) => set("interests", f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const trip = await api.generate({ ...f, budget: Number(f.budget), travelers: Number(f.travelers) });
      nav(`/trips/${trip.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="builder" onSubmit={submit}>
      <div className="page-head"><div><h1>Plan a trip</h1><p className="sub">The more you tell us, the less you'll need to edit.</p></div></div>

      <div className="grid2">
        <label>Where are you going?
          <input required minLength={2} value={f.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Jaipur, Lisbon, Bali…" />
        </label>
        <label>Trip name (optional)
          <input value={f.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="Long weekend in Jaipur" />
        </label>
        <label>From
          <input type="date" required value={f.start_date} onChange={(e) => set("start_date", e.target.value)} />
        </label>
        <label>To
          <input type="date" required min={f.start_date} value={f.end_date} onChange={(e) => set("end_date", e.target.value)} />
        </label>
        <label>Total budget
          <input type="number" required min="1" value={f.budget} onChange={(e) => set("budget", e.target.value)} />
        </label>
        <label>Currency
          <select value={f.currency} onChange={(e) => set("currency", e.target.value)}>
            {["INR", "USD", "EUR", "GBP", "AED", "SGD", "THB"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="grid2">
        <Seg label="Who's going" value={f.trip_type} onChange={pickType} options={TYPES} />
        <label>Number of travelers
          <input type="number" min="1" max="30" value={f.travelers} onChange={(e) => set("travelers", e.target.value)} disabled={f.trip_type !== "group"} />
        </label>
        <Seg label="Pace" value={f.pace} onChange={(v) => set("pace", v)} options={PACES} />
        <Seg label="Stay and dining" value={f.style} onChange={(v) => set("style", v)} options={STYLES} />
      </div>

      <fieldset className="chips">
        <legend>What do you enjoy?</legend>
        <div>
          {INTERESTS.map((i) => (
            <button type="button" key={i} className={f.interests.includes(i) ? "on" : ""} aria-pressed={f.interests.includes(i)} onClick={() => toggle(i)}>{i}</button>
          ))}
        </div>
      </fieldset>

      <label>Anything else we should know?
        <textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Vegetarian, travelling with a toddler, want sunrise spots…" />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button className="btn lg" disabled={busy}>{busy ? "Building your itinerary…" : "Generate itinerary"}</button>
        {busy && <span className="sub">This usually takes 20 to 40 seconds.</span>}
      </div>
    </form>
  );
}
