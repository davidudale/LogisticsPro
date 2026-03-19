import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const AdminSectionPage = ({
  title,
  eyebrow,
  description,
  heroIcon: HeroIcon,
  statCards = [],
  focusAreas = [],
  actionCards = [],
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title={title} onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <HeroIcon size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              {statCards.map(({ label, value, tone = "text-white", icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    {Icon ? <Icon size={18} className="text-orange-400" /> : null}
                  </div>
                  <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Current Focus Areas</h2>
                <div className="mt-4 space-y-3">
                  {focusAreas.map(({ title: itemTitle, detail, icon: Icon }) => (
                    <div key={itemTitle} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                          <Icon size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{itemTitle}</p>
                          <p className="mt-1 text-sm text-slate-400">{detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Operational Actions</h2>
                <div className="mt-4 space-y-3">
                  {actionCards.map(({ title: itemTitle, detail }) => (
                    <div key={itemTitle} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{itemTitle}</p>
                          <p className="mt-1 text-sm text-slate-400">{detail}</p>
                        </div>
                        <ArrowRight size={16} className="mt-1 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="text-lg font-semibold text-white">Workflow Coverage</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {focusAreas.map(({ title: itemTitle, detail }) => (
                  <div key={`${itemTitle}-coverage`} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">{itemTitle}</p>
                      <p className="mt-1 text-sm text-slate-400">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSectionPage;
