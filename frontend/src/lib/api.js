import { supabase } from "./supabase";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = typeof body.detail === "string" ? body.detail : body.detail?.[0]?.msg || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  listTrips: () => request("/api/trips"),
  getTrip: (id) => request(`/api/trips/${id}`),
  generate: (prefs) => request("/api/trips/generate", json("POST", prefs)),
  updateTrip: (id, patch) => request(`/api/trips/${id}`, json("PUT", patch)),
  regenerate: (id, body) => request(`/api/trips/${id}/regenerate`, json("POST", body)),
  deleteTrip: (id) => request(`/api/trips/${id}`, { method: "DELETE" }),
  shared: (id) => request(`/api/shared/${id}`),
};

export const money = (n, currency = "INR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d, opts = { day: "numeric", month: "short" }) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, opts);

export const dayCount = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

export function estimate(itin) {
  if (!itin) return 0;
  const days = itin.days || [];
  const stay = Number(itin.accommodation?.price_per_night || 0) * Math.max(days.length - 1, 0);
  const acts = days.reduce(
    (s, d) => s + (d.activities || []).reduce((t, a) => t + Number(a.cost_estimate || 0), 0),
    0
  );
  return Math.round(acts + stay);
}
