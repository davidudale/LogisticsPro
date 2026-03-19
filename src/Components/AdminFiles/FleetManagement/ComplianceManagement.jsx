import React, { useState } from "react";
import {
  FileCheck2,
  Scale,
  ShieldCheck,
  Siren,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const complianceStats = [
  { label: "Valid Permits", value: "87", tone: "text-white", icon: FileCheck2 },
  { label: "Audit Readiness", value: "94%", tone: "text-emerald-400", icon: Scale },
  { label: "Urgent Renewals", value: "6", tone: "text-rose-400", icon: Siren },
];

const permitItems = [
  {
    title: "Roadworthiness Certificates",
    detail: "Watch heavy-duty and delivery units approaching certification expiry windows.",
  },
  {
    title: "Insurance Coverage",
    detail: "Confirm active fleet insurance documents are mapped to each operating vehicle.",
  },
  {
    title: "Route-Specific Permits",
    detail: "Track permits required for restricted corridors and regulated cargo movement.",
  },
];

const regulationItems = [
  {
    title: "Policy Alignment",
    detail: "Check that dispatch, maintenance, and documentation workflows reflect current transport rules.",
  },
  {
    title: "Audit Pack Readiness",
    detail: "Prepare driver, vehicle, and permit records for inspection or regulator review.",
  },
  {
    title: "Control Reviews",
    detail: "Inspect gaps between internal fleet procedures and regulatory expectations.",
  },
];

const renewalItems = [
  {
    title: "Expiring Driver Licenses",
    detail: "Prioritize renewals for drivers assigned to active and upcoming shipments.",
  },
  {
    title: "High-Risk Vehicle Documents",
    detail: "Escalate units with permits close to expiry before they affect dispatch availability.",
  },
  {
    title: "Regulation Change Notices",
    detail: "Capture new compliance changes and surface their impact to operations teams.",
  },
];

const actionItems = [
  {
    title: "Review Expiring Documents",
    detail: "Prioritize permits and licenses approaching renewal cutoffs.",
  },
  {
    title: "Prepare Audit Packs",
    detail: "Assemble vehicle, driver, and compliance records for inspection requests.",
  },
  {
    title: "Update Regulatory Notes",
    detail: "Capture new compliance rules and communicate operational impact to teams.",
  },
];

const ComplianceManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("permits");

  const tabs = [
    { id: "permits", label: "Permit Tracking", icon: FileCheck2 },
    { id: "regulations", label: "Regulatory Controls", icon: Scale },
    { id: "renewals", label: "Renewal Response", icon: Siren },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Compliance Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Management</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Compliance Management</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Manage permits, licenses, inspections, and regulatory readiness so fleet operations stay audit-ready and road-legal.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              {complianceStats.map(({ label, value, tone, icon: Icon }) => (
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

            {activeTab === "permits" ? (
              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <h2 className="text-lg font-semibold text-white">Permit Tracking</h2>
                  <div className="mt-4 space-y-3">
                    {permitItems.map((item) => (
                      <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                            <FileCheck2 size={17} />
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

            {activeTab === "regulations" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Regulatory Controls</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {regulationItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                          <Scale size={17} />
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

            {activeTab === "renewals" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Renewal Response</h2>
                <div className="mt-4 space-y-3">
                  {renewalItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-slate-900/80 text-amber-300">
                          <Siren size={17} />
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

export default ComplianceManagement;
