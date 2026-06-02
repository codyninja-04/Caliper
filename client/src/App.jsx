import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Defects from './pages/Defects';
import NCRs from './pages/NCRs';
import CAPA from './pages/CAPA';
import Suppliers from './pages/Suppliers';
import AuditLog from './pages/AuditLog';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const HEALTH_URL = API_URL.replace(/\/api\/v1\/?$/, '') + '/health';

// Render's free tier sleeps after 15 min; the first request can take ~30s.
// Ping /health on load and show a banner until the backend responds.
function ColdStartBanner() {
  const [awake, setAwake] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAwake(false), 5000);
    fetch(HEALTH_URL)
      .then(() => { clearTimeout(timer); setAwake(true); })
      .catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  if (awake) return null;
  return (
    <div className="bg-amber-500 text-white text-sm text-center py-2 px-4">
      ⏳ Backend is waking up (free-tier cold start)… this can take ~30 seconds on first load.
    </div>
  );
}

// Gate protected routes behind an authenticated session.
function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-60 flex flex-col min-h-screen">
        <ColdStartBanner />
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/defects" element={<Defects />} />
            <Route path="/ncrs" element={<NCRs />} />
            <Route path="/capa" element={<CAPA />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/audit" element={<AuditLog />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
