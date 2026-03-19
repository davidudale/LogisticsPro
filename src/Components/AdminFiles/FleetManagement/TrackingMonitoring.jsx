import React, { useState } from "react";
import {
  Activity,
  MapPin,
  RadioTower,
  Truck,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const trackingStats = [
  { label: "Tracked Units", value: "31", tone: "text-white", icon: Truck },
  { label: "Live Signals", value: "28", tone: "text-emerald-400", icon: RadioTower },
  { label: "Exceptions Open", value: "7", tone: "text-amber-400", icon: Activity },
];

const trackingItems = [
  {
    title: "Active Vehicle Positions",
    detail: "Monitor current truck movement, route alignment, and location freshness across the network.",
  },
  {
    title: "Signal Freshness",
    detail: "Track how recently units reported position so dispatch can spot stale movements quickly.",
  },
  {
    title: "Movement Visibility",
    detail: "Keep live awareness of which vehicles are moving, stopped, or outside planned timing windows.",
  },
];

const telemetryItems = [
  {
    title: "Device Health Checks",
    detail: "Watch trackers that are offline, delayed, or intermittently reporting incomplete data.",
  },
  {
    title: "Data Quality Review",
    detail: "Inspect suspicious gaps in movement history and signal consistency across units.",
  },
  {
    title: "Hardware Escalation",
    detail: "Coordinate follow-up on trucks with recurring telemetry faults before they impact operations.",
  },
];

const exceptionItems = [
  {
    title: "Route Deviation Alerts",
    detail: "Escalate vehicles drifting from planned delivery lanes or regional movement boundaries.",
  },
  {
    title: "Unexpected Idle Windows",
    detail: "Review prolonged stoppages that could threaten delivery performance or indicate incidents.",
  },
  {
    title: "Dispatch Response Actions",
    detail: "Notify dispatch and customer teams when live exceptions need immediate follow-up.",
  },
];

const actionItems = [
  {
    title: "Review Live Map Exceptions",
    detail: "Check units that have stopped transmitting or drifted away from planned routes.",
  },
  {
    title: "Confirm Device Health",
    detail: "Inspect trucks with low telemetry quality and coordinate hardware follow-up.",
  },
  {
    title: "Escalate Delays",
    detail: "Notify dispatch and customer teams when movements threaten delivery windows.",
  },
];

const TrackingMonitoring = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tracking");

  const tabs = [
    { id: "tracking", label: "Real-Time Tracking", icon: MapPin },
    { id: "telemetry", label: "Telemetry Health", icon: RadioTower },
    { id: "exceptions", label: "Exception Handling", icon: Activity },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Tracking & Monitoring" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Management</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Tracking & Monitoring</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Keep GPS telemetry, location visibility, and vehicle status monitoring in one place for faster incident response and dispatch confidence.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              {trackingStats.map(({ label, value, tone, icon: Icon }) => (
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

            {activeTab === "tracking" ? (
              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <h2 className="text-lg font-semibold text-white">Real-Time Tracking</h2>
                  <div className="mt-4 space-y-3">
                    {trackingItems.map((item) => (
                      <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                            <MapPin size={17} />
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

            {activeTab === "telemetry" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Telemetry Health</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {telemetryItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                          <RadioTower size={17} />
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

            {activeTab === "exceptions" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Exception Handling</h2>
                <div className="mt-4 space-y-3">
                  {exceptionItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-slate-900/80 text-amber-300">
                          <Activity size={17} />
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

export default TrackingMonitoring;
