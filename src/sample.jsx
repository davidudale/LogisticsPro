import { useMemo, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Truck,
  UserRound,
  ShieldCheck,
  Building2,
  LogOut,
  LogIn,
} from "lucide-react";
import { useAuth } from "./Components/Auth/AuthContext.jsx";
import "./App.css";

const roleMeta = {
  customer: {
    title: "Customer Dashboard",
    icon: UserRound,
    tone: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  },
  driver: {
    title: "Driver Dashboard",
    icon: Truck,
    tone: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  staff: {
    title: "Staff Dashboard",
    icon: Building2,
    tone: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  },
  admin: {
    title: "Admin Dashboard",
    icon: ShieldCheck,
    tone: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
};

const getRoleHomePath = (role) => `/${role || "customer"}`;

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-300">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <Outlet />;
};

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user?.role) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      const target = location.state?.from?.pathname || "/";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-slate-800 bg-slate-900/60 rounded-2xl p-6 space-y-4"
      >
        <h1 className="text-xl font-bold">LogisticPro Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-500"
          required
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 px-4 py-2 font-semibold flex items-center justify-center gap-2"
        >
          <LogIn size={16} />
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const meta = roleMeta[role] || roleMeta.customer;
  const Icon = meta.icon;
  const [busy, setBusy] = useState(false);

  const initials = useMemo(() => {
    const name = user?.displayName || user?.email || "User";
    return name.slice(0, 1).toUpperCase();
  }, [user?.displayName, user?.email]);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl border grid place-items-center ${meta.tone}`}>
              <Icon size={18} />
            </div>
            <div>
              <h1 className="font-bold">{meta.title}</h1>
              <p className="text-xs text-slate-400">Signed in as {user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-slate-800 grid place-items-center text-sm font-bold">
              {initials}
            </span>
            <button
              onClick={handleLogout}
              disabled={busy}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2"
            >
              <LogOut size={15} />
              {busy ? "Signing out..." : "Logout"}
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-slate-300">
            This is the dedicated <span className="font-semibold text-white">{role}</span> workspace.
          </p>
        </section>
      </div>
    </div>
  );
};

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(user.role)} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
        <Route path="/customer" element={<DashboardLayout role="customer" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
        <Route path="/driver" element={<DashboardLayout role="driver" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
        <Route path="/staff" element={<DashboardLayout role="staff" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<DashboardLayout role="admin" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;








     {/* Navigation */}
       <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="text-emerald-500 w-8 h-8" />
            <span className="font-serif italic text-2xl font-bold tracking-tight">
              LogisticsPro<span className="text-emerald-500">.</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#solutions" className="hover:text-white transition-colors">
              Solutions
            </a>
            <a
              href="#intelligence"
              className="hover:text-white transition-colors"
            >
              AI Intelligence
            </a>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-emerald-500 text-black rounded-full font-bold text-sm hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95"
          >
            Launch Dashboard
          </button>
        </div>
      </nav