import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowBigLeftIcon, Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user?.role) {
      navigate(`/${user.role}`);
    }
  }, [authLoading, navigate, user?.role]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white rounded-md">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=1974&auto=format&fit=crop"
          alt="Night logistics yard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/80" />
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 space-y-8 glass-effect rounded-md">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-5 bg-gradient-to-br from-orange-500 to-orange-700 rounded-sm flex items-center justify-center transform rotate-45">
              <div className="w-4 h-4 bg-white rounded-full -rotate-45" />
            </div>
            <span className="text-2xl font-syncopate font-bold tracking-tighter text-white capitalize">
              LogisticsPro <span className="text-orange-500">.</span>
            </span>
          </div>
          <h2 className="text-l text-slate-300">Secure Operations Portal</h2>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 rounded-sm transition-colors disabled:opacity-50"
              placeholder="user@logisticspro.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              disabled={loading}
              className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 rounded-sm transition-colors disabled:opacity-50"
              placeholder="********"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-10 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] rounded-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Need access? <Link to="/register" className="font-medium text-orange-500 hover:text-orange-400">Request an account</Link>
        </p>

        <button
          onClick={() => navigate("/")}
          disabled={loading}
          className="w-full px-10 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center disabled:opacity-50"
          type="button"
        >
          <ArrowBigLeftIcon className="mr-2" size={20} />
          Back to Homepage
        </button>
      </div>
    </div>
  );
};

export default Login;
