import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">Wayfarer</Link>
        <nav>
          <NavLink to="/" end>My trips</NavLink>
          <NavLink to="/new">Plan a trip</NavLink>
        </nav>
        <div className="who">
          <span>{user?.email}</span>
          <button className="btn ghost sm" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
