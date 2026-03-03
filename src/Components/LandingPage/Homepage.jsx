import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Globe2,
  Moon,
  Route,
  ShieldCheck,
  Sun,
  Truck,
  Warehouse,
} from "lucide-react";

const Homepage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("lp-theme") || "dark",
  );
  const [businessForm, setBusinessForm] = useState({
    isBusinessShipper: "yes",
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    country: "Nigeria",
    phoneNumber: "",
    internationalShipping: false,
    shippingFrequency: "",
  });

  const onGetStarted = () => navigate("/login");

  useEffect(() => {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("lp-theme", nextTheme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"));

  const onBusinessFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setBusinessForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onBusinessFormSubmit = (event) => {
    event.preventDefault();
  };
  const heroImage =
    "https://images.unsplash.com/photo-1695222833131-54ee679ae8e5?q=80&w=841&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const warehouseImage =
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000";

  return (
    <div className="min-h-screen lp-page-bg">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(245,158,11,0.10),_transparent_50%)]" />

      <nav className="fixed top-0 z-50 w-full backdrop-blur lp-nav">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
              <Truck size={20} />
            </div>
            <div className="text-lg font-bold tracking-tight">
              LogisticsPro<span className="text-amber-400">.</span>
            </div>
          </div>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-400 md:flex">
            <a href="#capabilities" className="hover:text-white transition-colors">
              Track
            </a>
            <a href="#network" className="hover:text-white transition-colors">
              Ship
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Customer Service
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button onClick={onGetStarted} className="lp-button-primary">
              Customer Portal Login
            </button>
          </div>
        </div>
      </nav>

      <section className="relative pt-40 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
                Precision logistics platform
              </div>
              <h1 className="mt-6 text-md font-black tracking-tight text-white sm:text-6xl">
                Orchestrate deliveries with <span className="text-amber-600">real-time control.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-400">
                LogisticsPro unifies fleet tracking, dispatch, warehouse flow, and
                performance analytics into one operational command center.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={onGetStarted}
                  className="lp-button-primary flex items-center gap-2"
                >
                  Track your Shipment
                  <ArrowRight size={16} />
                </button>
                <button className="lp-button-secondary">
                  Request a demo
                </button>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-6 text-sm text-slate-400 sm:grid-cols-4">
                {[
                  { label: "On-time rate", value: "98.7%" },
                  { label: "Avg. route savings", value: "21%" },
                  { label: "Live dispatch", value: "24/7" },
                  { label: "Regions covered", value: "37" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs uppercase tracking-wide">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-800">
                <img
                  src={heroImage}
                  alt="Container truck on a highway"
                  className="h-56 w-full object-cover"
                />
              </div>
              <div className="lp-panel rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                    Live Ops
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase text-emerald-400">
                    On route
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {["Lagos to Ogun", "Abuja to Kaduna", "Port Harcourt to Enugu"].map(
                    (route) => (
                      <div
                        key={route}
                        className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{route}</p>
                          <p className="text-xs text-slate-500">ETA 02:14</p>
                        </div>
                        <Route className="text-amber-400" size={18} />
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-300">
                    AI Recommendation
                  </p>
                  <p className="text-sm text-slate-100">
                    Reroute fleet 12B to avoid storm cell near Kaduna.
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 rounded-3xl bg-slate-900/80 p-6 text-slate-100 shadow-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Fleet health
                </p>
                <p className="mt-2 text-3xl font-black text-white">A+</p>
                <p className="text-xs text-slate-400">Maintenance compliance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="py-24 border-t border-slate-800/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-3">
            <div>
              <h2 className="text-3xl font-bold text-white">Operations, unified.</h2>
              <p className="mt-4 text-slate-400">
                From order intake to last-mile proof, every step is coordinated
                through a single operational layer.
              </p>
            </div>
            {["Dispatch + Routing", "Warehouse Visibility", "Customer Experience"].map(
              (title) => (
                <div
                  key={title}
                  className="lp-panel p-6"
                >
                  <div className="mb-4 h-10 w-10 rounded-xl bg-amber-500/15 text-amber-400 grid place-items-center">
                    <BarChart3 size={18} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Real-time orchestration, proactive alerts, and clear SLAs for
                    every shipment.
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section id="network" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div className="lp-panel rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white">Services Available</h3>
              <p className="mt-4 text-slate-400">
                Monitor hubs, lanes, and cross-docks with predictive demand
                planning and automated exception handling.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {[
                  "Road Freight",
                  "⁠Rail Freight",
                  
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-400" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-panel rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Warehouse sync</h3>
                <Warehouse className="text-amber-400" />
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
                <img
                  src={warehouseImage}
                  alt="Warehouse storage aisles"
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="mt-4 text-slate-400">
                Dock scheduling, slot optimization, and real-time inventory status
                aligned with dispatch operations.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Throughput
                  </p>
                  <p className="text-xl font-bold text-white">+18%</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Dwell time
                  </p>
                  <p className="text-xl font-bold text-white">-27%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="py-24 border-y border-slate-800/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-3">
            <div>
              <h3 className="text-2xl font-bold text-white">Secure by design</h3>
              <p className="mt-4 text-slate-400">
                Operational data and customer information protected end-to-end.
              </p>
            </div>
            <div className="lp-panel p-6">
              <ShieldCheck className="text-emerald-400" />
              <h4 className="mt-4 text-lg font-semibold text-white">Compliance</h4>
              <p className="mt-2 text-sm text-slate-400">
                Audit trails, role-based access, and retention policies built in.
              </p>
            </div>
            <div className="lp-panel p-6">
              <Globe2 className="text-amber-400" />
              <h4 className="mt-4 text-lg font-semibold text-white">Continuity</h4>
              <p className="mt-2 text-sm text-slate-400">
                Multi-region resiliency and proactive anomaly detection.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-900 p-10 text-center">
            <h3 className="text-3xl font-bold text-white">Lead the next delivery cycle.</h3>
            <p className="mt-4 text-slate-300">
              Activate LogisticsPro and keep every shipment within SLA.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <button onClick={onGetStarted} className="lp-button-primary">
                Start now
              </button>
              <button className="lp-button-secondary">
                Talk to sales
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-md border border-slate-300 bg-[#e6e6e6] p-6 sm:p-8 shadow-xl">
            <h3 className="text-3xl font-black text-slate-900">
              Open a LogisticsPro Business Account for Shipping Operations
            </h3>
            <p className="mt-4 text-sm text-slate-900">Are you a business shipper?</p>

            <form onSubmit={onBusinessFormSubmit} className="mt-6 space-y-4">
              <div className="flex items-center gap-6 text-sm text-slate-900">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isBusinessShipper"
                    value="yes"
                    checked={businessForm.isBusinessShipper === "yes"}
                    onChange={onBusinessFormChange}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isBusinessShipper"
                    value="no"
                    checked={businessForm.isBusinessShipper === "no"}
                    onChange={onBusinessFormChange}
                  />
                  No
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-900 sm:col-span-2">
                  Company Name*
                  <input
                    type="text"
                    name="companyName"
                    value={businessForm.companyName}
                    onChange={onBusinessFormChange}
                    required
                    className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                  />
                </label>
                <label className="text-sm text-slate-900">
                  First Name*
                  <input
                    type="text"
                    name="firstName"
                    value={businessForm.firstName}
                    onChange={onBusinessFormChange}
                    required
                    className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                  />
                </label>
                <label className="text-sm text-slate-900">
                  Last Name*
                  <input
                    type="text"
                    name="lastName"
                    value={businessForm.lastName}
                    onChange={onBusinessFormChange}
                    required
                    className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                  />
                </label>
                <label className="text-sm text-slate-900 sm:col-span-2">
                  Email Address*
                  <input
                    type="email"
                    name="email"
                    value={businessForm.email}
                    onChange={onBusinessFormChange}
                    required
                    className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                  />
                </label>
                <label className="text-sm text-slate-900 sm:col-span-2">
                  Address*
                  <input
                    type="text"
                    name="address"
                    value={businessForm.address}
                    onChange={onBusinessFormChange}
                    required
                    className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                  />
                </label>
                <label className="text-sm text-slate-900">
                  City*
                  <input
                    type="text"
                    name="city"
                    value={businessForm.city}
                    onChange={onBusinessFormChange}
                    required
                    className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                  />
                </label>
                <label className="text-sm text-slate-900">
                  Country*
                  <input
                    type="text"
                    name="country"
                    value={businessForm.country}
                    onChange={onBusinessFormChange}
                    required
                    className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                  />
                </label>
                <label className="text-sm text-slate-900 sm:col-span-2">
                  Phone Number*
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={businessForm.phoneNumber}
                    onChange={onBusinessFormChange}
                    required
                    className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                  />
                </label>
              </div>

              <p className="text-xs text-slate-800">
                * If you are outside Nigeria, go to this{" "}
                <a href="#" className="text-red-700 underline">
                  page
                </a>
              </p>

              <label className="flex items-center gap-2 text-sm text-slate-900">
                <input
                  type="checkbox"
                  name="internationalShipping"
                  checked={businessForm.internationalShipping}
                  onChange={onBusinessFormChange}
                />
                Do you ship internationally?
              </label>

              <label className="block text-sm text-slate-900">
                How often do you ship?
                <select
                  name="shippingFrequency"
                  value={businessForm.shippingFrequency}
                  onChange={onBusinessFormChange}
                  className="mt-1 w-full rounded-none border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600"
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="occasionally">Occasionally</option>
                </select>
              </label>

              <button
                type="submit"
                className="rounded-none bg-[#ffcc00] px-6 py-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-900 hover:bg-[#e3b700]"
              >
                Open Business Account
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs uppercase tracking-[0.3em] text-slate-500 md:flex-row">
          <span>LogisticsPro</span>
          <span>Operational intelligence for modern fleets</span>
          <span>&copy; 2024 LogisticsPro</span>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
