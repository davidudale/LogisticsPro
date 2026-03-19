import React, { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Shield,
  Wrench,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const maintenanceStats = [
  { label: "Scheduled Services", value: "14", tone: "text-white", icon: CalendarClock },
  { label: "Critical Alerts", value: "3", tone: "text-rose-400", icon: AlertTriangle },
  { label: "Roadworthy Rate", value: "96%", tone: "text-emerald-400", icon: Shield },
];

const preventiveItems = [
  {
    title: "Service Interval Planning",
    detail: "Schedule recurring checks by mileage, route intensity, and vehicle class.",
  },
  {
    title: "Upcoming Maintenance Queue",
    detail: "Surface units approaching service windows before they affect dispatch commitments.",
  },
  {
    title: "Maintenance Calendar",
    detail: "Balance workshop load with upcoming operational demand and truck availability.",
  },
];

const repairItems = [
  {
    title: "Critical Fault Escalation",
    detail: "Prioritize issues that can affect safety, compliance, or delivery timelines.",
  },
  {
    title: "Repair Triage",
    detail: "Separate urgent breakdowns from routine fixes so workshop capacity stays focused.",
  },
  {
    title: "Return-to-Service Review",
    detail: "Verify repair quality and readiness before a unit goes back into rotation.",
  },
];

const workshopItems = [
  {
    title: "Bay Utilization",
    detail: "Track which units are in service and how workshop slots are being consumed.",
  },
  {
    title: "Parts and Closure Notes",
    detail: "Capture parts usage, job completion, and follow-up service requirements.",
  },
  {
    title: "Downtime Visibility",
    detail: "Estimate when vehicles leave the workshop so dispatch can plan around outages.",
  },
];

const actionItems = [
  {
    title: "Book Service Slots",
    detail: "Reserve workshop capacity for units approaching due dates or warning thresholds.",
  },
  {
    title: "Inspect Critical Units",
    detail: "Review vehicles with unresolved faults before the next dispatch cycle.",
  },
  {
    title: "Close Service Jobs",
    detail: "Capture repairs completed, parts used, and post-maintenance readiness notes.",
  },
];

const MaintenanceManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preventive");

  const tabs = [
    { id: "preventive", label: "Preventive Maintenance", icon: CalendarClock },
    { id: "repairs", label: "Repair Prioritization", icon: AlertTriangle },
    { id: "workshop", label: "Workshop Visibility", icon: Wrench },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Maintenance Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <Wrench size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Management</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Maintenance Management</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Schedule preventive service, track workshop activity, and keep vehicle health visible before breakdowns impact customer commitments.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              {maintenanceStats.map(({ label, value, tone, icon: Icon }) => (
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

            {activeTab === "preventive" ? (
              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <h2 className="text-lg font-semibold text-white">Preventive Maintenance</h2>
                  <div className="mt-4 space-y-3">
                    {preventiveItems.map((item) => (
                      <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                            <CalendarClock size={17} />
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

            {activeTab === "repairs" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Repair Prioritization</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {repairItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                          <AlertTriangle size={17} />
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

            {activeTab === "workshop" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Workshop Visibility</h2>
                <div className="mt-4 space-y-3">
                  {workshopItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-slate-900/80 text-emerald-300">
                          <Wrench size={17} />
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

export default MaintenanceManagement;
