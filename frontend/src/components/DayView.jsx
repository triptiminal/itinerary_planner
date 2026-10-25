import { useState } from "react";
import { money } from "../lib/api";

export const TYPES = {
  attraction: "Sight",
  food: "Food",
  stay: "Stay",
  transport: "Transit",
};

function Stop({ act, currency, editable, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const set = (k, v) => onChange({ ...act, [k]: v });

  if (editing) {
    return (
      <li className={`stop t-${act.type}`}>
        <div className="stop-edit">
          <div className="row">
            <input aria-label="Time" type="time" value={act.time || ""} onChange={(e) => set("time", e.target.value)} />
            <select aria-label="Type" value={act.type} onChange={(e) => set("type", e.target.value)}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input aria-label="Cost" type="number" min="0" value={act.cost_estimate ?? 0}
              onChange={(e) => set("cost_estimate", Number(e.target.value))} />
          </div>
          <input aria-label="Title" value={act.title} onChange={(e) => set("title", e.target.value)} placeholder="What are you doing?" />
          <input aria-label="Location" value={act.location || ""} onChange={(e) => set("location", e.target.value)} placeholder="Where?" />
          <textarea aria-label="Notes" rows={2} value={act.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Notes" />
          <div className="row end">
            <button className="btn danger sm" onClick={onDelete}>Delete stop</button>
            <button className="btn sm" onClick={() => setEditing(false)}>Done</button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className={`stop t-${act.type}`}>
      <div className="stop-time">{act.time}</div>
      <div className="stop-body">
        <div className="stop-head">
          <h4>{act.title}</h4>
          <span className="tag">{TYPES[act.type] || act.type}</span>
        </div>
        {act.location && <p className="loc">{act.location}</p>}
        {act.description && <p>{act.description}</p>}
        <p className="meta">
          {act.duration && <span>{act.duration}</span>}
          <span>{money(act.cost_estimate, currency)}</span>
          {editable && <button className="link" onClick={() => setEditing(true)}>Edit</button>}
        </p>
      </div>
    </li>
  );
}

export default function DayView({ day, currency, editable, onChange }) {
  const acts = day.activities || [];
  const setActs = (a) => onChange({ ...day, activities: a });

  const add = () =>
    setActs([...acts, { time: "12:00", title: "New stop", type: "attraction", location: "", description: "", duration: "", cost_estimate: 0 }]);

  return (
    <div>
      <ol className="route">
        {acts.map((a, i) => (
          <Stop
            key={i}
            act={a}
            currency={currency}
            editable={editable}
            onChange={(n) => setActs(acts.map((x, j) => (j === i ? n : x)))}
            onDelete={() => setActs(acts.filter((_, j) => j !== i))}
          />
        ))}
      </ol>
      {editable && <button className="btn ghost" onClick={add}>Add a stop</button>}
    </div>
  );
}
