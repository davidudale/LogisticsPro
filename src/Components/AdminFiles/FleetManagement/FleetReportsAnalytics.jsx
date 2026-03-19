import React, { useState } from "react";
import {
  BarChart3,
  ChartColumnIncreasing,
  Clock3,
  TrendingUp,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const reportStats = [
  { label: "On-Time Delivery", value: "91%", tone: "text-emerald-400", icon: Clock3 },
  { label: "Utilization Trend", value: "+7%", tone: "text-orange-300", icon: TrendingUp },
  { label: "Reports Generated", value: "18", tone: "text-white", icon: ChartColumnIncreasing },
];

const performanceItems = [
  {
    title: "Fleet Output Tracking",
    detail: "Measure fleet performance by route, truck class, and driver assignment pattern.",
  },
  {
    title: "Delivery Service Review",
    detail: "Compare completion quality, turnaround speed, and on-time delivery performance.",
  },
  {
    title: "Utilization Signals",
    detail: "Review how effectively fleet capacity is being used across current operations.",
  },
];

const trendItems = [
  {
    title: "Downtime Trend Analysis",
    detail: "Track service interruptions and recurring patterns that affect output over time.",
  },
  {
    title: "Completion Rate Movement",
    detail: "Compare current delivery performance against previous reporting periods.",
  },
  {
    title: "Planning Forecast Signals",
    detail: "Use historical trend movement to support route, maintenance, and fleet planning decisions.",
  },
];

const scorecardItems = [
  {
    title: "Dispatch KPIs",
    detail: "Surface metrics that help dispatch teams review service performance and route execution.",
  },
  {
    title: "Maintenance KPIs",
    detail: "Monitor downtime, service closure pace, and readiness across active fleet units.",
  },
  {
    title: "Leadership Scorecards",
    detail: "Present high-level scorecards that summarize utilization, delivery, and cost performance.",
  },
];

const actionItems = [
  {
    title: "Generate Weekly Pack",
    detail: "Prepare recurring leadership reports for capacity, service, and downtime.",
  },
  {
    title: "Inspect KPI Variance",
    detail: "Drill into trends that moved sharply against target in the latest period.",
  },
  {
    title: "Share Department Views",
    detail: "Tailor reports for dispatch, fleet maintenance, and finance stakeholders.",
  },
];

const FleetReportsAnalytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("performance");

  const tabs = [
    { id: "performance", label: "Performance Reporting", icon: BarChart3 },
    { id: "trends", label: "Trend Analysis", icon: TrendingUp },
    { id: "scorecards", label: "Operational Scorecards", icon: ChartColumnIncreasing },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Reporting & Analytics" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <BarChart3 size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Management</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Reporting & Analytics</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Generate fleet performance insights across uptime, delivery execution, efficiency, and operational cost trends.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              {reportStats.map(({ label, value, tone, icon: Icon }) => (
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

            {activeTab === "performance" ? (
              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <h2 className="text-lg font-semibold text-white">Performance Reporting</h2>
                  <div className="mt-4 space-y-3">
                    {performanceItems.map((item) => (
                      <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                            <BarChart3 size={17} />
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

            {activeTab === "trends" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Trend Analysis</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {trendItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                          <TrendingUp size={17} />
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

            {activeTab === "scorecards" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Operational Scorecards</h2>
                <div className="mt-4 space-y-3">
                  {scorecardItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-slate-900/80 text-emerald-300">
                          <ChartColumnIncreasing size={17} />
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

export default FleetReportsAnalytics;
