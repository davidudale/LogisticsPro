import React, { useState } from "react";
import {
  Clock3,
  MapPinned,
  Route,
  TrafficCone,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const routeStats = [
  { label: "Active Routes", value: "34", tone: "text-white", icon: Route },
  { label: "Delayed Corridors", value: "6", tone: "text-amber-400", icon: TrafficCone },
  { label: "ETA Accuracy", value: "92%", tone: "text-emerald-400", icon: Clock3 },
];

const optimizationItems = [
  {
    title: "Lane Comparison",
    detail: "Compare route options by delivery priority, road condition, and fuel usage.",
  },
  {
    title: "Dispatch Sequencing",
    detail: "Align route choice with warehouse release timing and shipment urgency.",
  },
  {
    title: "Capacity Balancing",
    detail: "Spread route demand across available fleet capacity to reduce congestion points.",
  },
];

const trafficItems = [
  {
    title: "Congestion Hotspots",
    detail: "Surface corridors with recurring slowdowns and high delay frequency.",
  },
  {
    title: "Delay Escalation",
    detail: "Review live exceptions so reroutes can happen before trucks are heavily affected.",
  },
  {
    title: "Corridor Reliability",
    detail: "Track which lanes consistently miss timing expectations due to traffic behavior.",
  },
];

const stopPlanningItems = [
  {
    title: "Pickup and Drop Sequencing",
    detail: "Sequence stops to reduce idle time and improve run completion accuracy.",
  },
  {
    title: "ETA Tightening",
    detail: "Improve forecast confidence by refining stop order and dwell-time assumptions.",
  },
  {
    title: "Regional Stop Templates",
    detail: "Standardize high-frequency route legs for faster planning and dispatch setup.",
  },
];

const actionItems = [
  {
    title: "Publish Route Plans",
    detail: "Approve and circulate route changes to dispatch, warehouse, and driver teams.",
  },
  {
    title: "Review Delay Hotspots",
    detail: "Inspect corridors with repeated exceptions and assign alternate lanes.",
  },
  {
    title: "Update Route Templates",
    detail: "Refresh standard legs for high-frequency delivery zones and linehaul trips.",
  },
];

const RouteManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("optimization");

  const tabs = [
    { id: "optimization", label: "Lane Optimization", icon: Route },
    { id: "traffic", label: "Traffic Watch", icon: TrafficCone },
    { id: "stops", label: "Stop Planning", icon: MapPinned },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Route Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <Route size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Management</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Route Management</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Plan, optimize, and monitor delivery corridors so dispatch teams can reduce delays, avoid bottlenecks, and improve route efficiency.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              {routeStats.map(({ label, value, tone, icon: Icon }) => (
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

            {activeTab === "optimization" ? (
              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <h2 className="text-lg font-semibold text-white">Lane Optimization</h2>
                  <div className="mt-4 space-y-3">
                    {optimizationItems.map((item) => (
                      <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                            <Route size={17} />
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

            {activeTab === "traffic" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Traffic Watch</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {trafficItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                          <TrafficCone size={17} />
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

            {activeTab === "stops" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Stop Planning</h2>
                <div className="mt-4 space-y-3">
                  {stopPlanningItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-slate-900/80 text-emerald-300">
                          <MapPinned size={17} />
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

export default RouteManagement;
