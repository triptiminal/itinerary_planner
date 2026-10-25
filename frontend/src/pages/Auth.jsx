import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { session } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  if (session) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn.call(supabase.auth, { email, password });
    setBusy(false);
    if (error) return setMsg({ bad: true, text: error.message });
    if (mode === "signup" && !data.session)
      setMsg({ text: "Check your email to confirm your account, then sign in." });
  }

  return (
    <div className="auth">
      <section className="auth-art" aria-hidden="true">
        <h1>Wayfarer</h1>
        <p>Tell us where, when and what you love. Get a day-by-day plan with costs, in seconds.</p>
        <svg viewBox="0 0 300 120" className="auth-route">
          <path d="M10 100 C 60 20, 110 110, 160 60 S 250 10, 290 40" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
          <circle cx="10" cy="100" r="7" fill="currentColor" />
          <circle cx="160" cy="60" r="7" fill="currentColor" />
          <circle cx="290" cy="40" r="7" fill="currentColor" />
        </svg>
      </section>
      <form className="auth-form" onSubmit={submit}>
        <h2>{mode === "signin" ? "Sign in" : "Create your account"}</h2>
        <label>Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>Password
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        </label>
        {msg && <p className={msg.bad ? "error" : "notice"} role="alert">{msg.text}</p>}
        <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        <button type="button" className="link" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
