import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowBigLeftIcon } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";

const roleOptions = [
  { value: "opsuser", label: "OPSUSER" },
  { value: "opsmanager", label: "OPSMANAGER" },
  { value: "accounts", label: "ACCOUNTS" },
  { value: "driver", label: "Driver" },
  { value: "admin", label: "ADMIN" },
];

const Register = () => {
  const navigate = useNavigate();
  const { signup, logout } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "opsuser",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      await logout();
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
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

      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 space-y-8 glass-effect rounded-sm">
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

        <form className="space-y-2" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Assign Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2 text-sm text-white focus:border-orange-500 rounded-sm"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 rounded-sm transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 rounded-sm transition-colors"
              placeholder="user@logisticspro.com"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 rounded-sm transition-colors"
              placeholder="********"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full bg-slate-900/50 border border-slate-700 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 rounded-sm transition-colors"
              placeholder="********"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-10 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] rounded-sm disabled:opacity-70"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="font-medium text-orange-500 hover:text-orange-400">Sign in</Link>
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full px-10 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest transition-all rounded-sm"
          type="button"
        >
          <ArrowBigLeftIcon className="inline-block mr-2" size={20} />
          Back to Homepage
        </button>
      </div>
    </div>
  );
};

export default Register;
