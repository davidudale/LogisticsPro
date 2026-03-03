import React, { useState } from "react";
import { Activity, Package, Truck, Warehouse } from "lucide-react";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stats = [
    { label: "Dispatch Queue", value: "38", icon: Package },
    { label: "Vehicles Ready", value: "24", icon: Truck },
    { label: "Warehouse Tasks", value: "17", icon: Warehouse },
    { label: "SLA Health", value: "98%", icon: Activity },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <NavBar title="Staff Console" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 p-4 lg:p-8 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Operations Console</h1>
              <p className="text-slate-400 text-sm mt-1">
                Coordinate dispatch, warehousing, and exception handling from one view.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all"
                  >
                    <div className="p-2 w-fit bg-slate-950 rounded-lg border border-slate-800 group-hover:border-orange-500/50 transition-colors">
                      <Icon className="text-orange-500" size={18} />
                    </div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-tight mt-4">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
