import React, { useState } from "react";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen lp-page-bg">
      <NavBar title="Staff Console" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-5xl lp-panel p-8">
            <p className="mt-3 text-slate-400">
              Manage operations, resolve exceptions, and coordinate warehouses.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
