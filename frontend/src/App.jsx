import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewTrip from "./pages/NewTrip";
import TripView from "./pages/TripView";
import Shared from "./pages/Shared";

function Private({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="center-note">Loading…</div>;
  return session ? <Layout>{children}</Layout> : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/shared/:id" element={<Shared />} />
      <Route path="/" element={<Private><Dashboard /></Private>} />
      <Route path="/new" element={<Private><NewTrip /></Private>} />
      <Route path="/trips/:id" element={<Private><TripView /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
