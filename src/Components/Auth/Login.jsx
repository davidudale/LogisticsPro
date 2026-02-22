import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck } from "lucide-react";
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

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
    <div className="min-h-screen lp-page-bg flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-lg lp-panel p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-400 grid place-items-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sign in</h1>
            <p className="text-sm text-slate-400">
              Access your LogisticsPro workspace.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Email address
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
              <Mail size={18} className="text-slate-500" />
              <input
                type="email"
                name="email"
                placeholder="you@logisticspro.com"
                value={form.email}
                onChange={onChange}
                className="w-full bg-transparent text-sm text-slate-100 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Password
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
              <Lock size={18} className="text-slate-500" />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={onChange}
                className="w-full bg-transparent text-sm text-slate-100 outline-none"
                required
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="lp-button-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{" "}
          <Link to="/register" className="text-amber-300 hover:text-amber-200">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
