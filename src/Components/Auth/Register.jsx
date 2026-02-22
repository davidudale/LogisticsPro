import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ShieldCheck, Truck, Building2 } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";

const roleOptions = [
  { value: "customer", label: "Customer", icon: User },
  { value: "driver", label: "Driver", icon: Truck },
  { value: "staff", label: "Staff", icon: Building2 },
  { value: "admin", label: "Admin", icon: ShieldCheck },
];

const Register = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup(form.email, form.password, form.role, {
        fullName: form.fullName,
      });
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Registration failed.");
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
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-sm text-slate-400">
              Start managing logistics with LogisticsPro.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Full name
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
              <User size={18} className="text-slate-500" />
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={onChange}
                className="w-full bg-transparent text-sm text-slate-100 outline-none"
                required
              />
            </div>
          </div>

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
              Role
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {roleOptions.map((role) => {
                const Icon = role.icon;
                const isActive = form.role === role.value;

                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: role.value }))}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      isActive
                        ? "border-amber-400 bg-amber-500/10 text-amber-300"
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <Icon size={16} />
                    {role.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Password
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                <Lock size={18} className="text-slate-500" />
                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={form.password}
                  onChange={onChange}
                  className="w-full bg-transparent text-sm text-slate-100 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Confirm password
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                <Lock size={18} className="text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  className="w-full bg-transparent text-sm text-slate-100 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="lp-button-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-amber-300 hover:text-amber-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
