import React, { useState } from "react";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";

const Drivers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen lp-page-bg">
      <NavBar title="Driver Hub" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-5xl lp-panel p-8">
            <p className="mt-3 text-slate-400">
              View assignments, route guidance, and delivery status updates.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Drivers;
