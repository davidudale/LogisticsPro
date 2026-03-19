import React, { useState } from "react";
import {
  BarChart3,
  Fuel,
  Gauge,
  Wallet,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const fuelStats = [
  { label: "Fuel Spend", value: "N 4.8M", tone: "text-white", icon: Wallet },
  { label: "Fleet Efficiency", value: "7.4 km/L", tone: "text-emerald-400", icon: Gauge },
  { label: "Variance Alerts", value: "4", tone: "text-amber-400", icon: BarChart3 },
];

const consumptionItems = [
  {
    title: "Fill Volume Tracking",
    detail: "Measure fueling volumes against trip distance and route activity for each unit.",
  },
  {
    title: "Load-Based Usage",
    detail: "Compare fuel drawdown with cargo weight and duty cycle to spot abnormal patterns.",
  },
  {
    title: "Depot Monitoring",
    detail: "Track consumption trends by fueling point and regional operating lane.",
  },
];

const efficiencyItems = [
  {
    title: "Vehicle Efficiency Review",
    detail: "Compare similar trucks to identify units falling below expected fuel performance.",
  },
  {
    title: "Route Efficiency Analysis",
    detail: "Review how terrain, congestion, and stop frequency affect fuel economy.",
  },
  {
    title: "Driver Influence",
    detail: "Inspect driving style and idling behavior as part of fleet efficiency scoring.",
  },
];

const spendItems = [
  {
    title: "Fuel Cost Control",
    detail: "Watch daily fueling spend by truck, route, and depot to catch overspend early.",
  },
  {
    title: "Variance Escalation",
    detail: "Surface unusual jumps in cost or fuel volume that may need investigation.",
  },
  {
    title: "Budget Refinement",
    detail: "Adjust monthly allocations using historical demand, route mix, and seasonality.",
  },
];

const actionItems = [
  {
    title: "Audit Fuel Logs",
    detail: "Review recent fueling activity and validate it against dispatched mileage.",
  },
  {
    title: "Flag Variance Cases",
    detail: "Escalate vehicles with sudden consumption changes or unusual spending spikes.",
  },
  {
    title: "Adjust Fuel Budgets",
    detail: "Refine fuel allocation using seasonality, route mix, and delivery volume trends.",
  },
];

const FuelManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("consumption");

  const tabs = [
    { id: "consumption", label: "Consumption Monitoring", icon: Fuel },
    { id: "efficiency", label: "Efficiency Review", icon: Gauge },
    { id: "spend", label: "Spend Control", icon: Wallet },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Fuel Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <Fuel size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Management</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Fuel Management</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Track fuel consumption, watch cost trends, and compare vehicle efficiency so operations teams can reduce waste across routes.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              {fuelStats.map(({ label, value, tone, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    <Icon size={18} className="text-orange-400" />
                  </div>
                  <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-2 sm:p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-orange-600 text-white"
                          : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {activeTab === "consumption" ? (
              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <h2 className="text-lg font-semibold text-white">Consumption Monitoring</h2>
                  <div className="mt-4 space-y-3">
                    {consumptionItems.map((item) => (
                      <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                            <Fuel size={17} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <h2 className="text-lg font-semibold text-white">Priority Actions</h2>
                  <div className="mt-4 space-y-3">
                    {actionItems.map((item) => (
                      <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "efficiency" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Efficiency Review</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {efficiencyItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                          <Gauge size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === "spend" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Spend Control</h2>
                <div className="mt-4 space-y-3">
                  {spendItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-slate-900/80 text-amber-300">
                          <Wallet size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FuelManagement;
