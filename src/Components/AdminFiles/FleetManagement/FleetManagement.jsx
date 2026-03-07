import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Gauge,
  Plus,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const initialFleet = [
  {
    id: "TRK-221",
    type: "Box Truck",
    driver: "A. Musa",
    location: "Ikeja, Lagos",
    speed: "62 km/h",
    status: "In transit",
    maintenanceDue: "2026-03-14",
    utilization: 89,
  },
  {
    id: "TRK-109",
    type: "Flatbed",
    driver: "B. Okoro",
    location: "Kubwa, Abuja",
    speed: "0 km/h",
    status: "Idle",
    maintenanceDue: "2026-03-06",
    utilization: 72,
  },
  {
    id: "VAN-334",
    type: "Delivery Van",
    driver: "C. Sule",
    location: "Yaba, Lagos",
    speed: "38 km/h",
    status: "In transit",
    maintenanceDue: "2026-03-03",
    utilization: 93,
  },
];

const FleetManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fleet, setFleet] = useState(initialFleet);
  const [vehicleForm, setVehicleForm] = useState({
    id: "",
    type: "",
    driver: "",
  });

  const addVehicle = (event) => {
    event.preventDefault();
    if (!vehicleForm.id || !vehicleForm.type || !vehicleForm.driver) return;

    const exists = fleet.some(
      (vehicle) => vehicle.id.toLowerCase() === vehicleForm.id.trim().toLowerCase(),
    );
    if (exists) return;

    setFleet((prev) => [
      {
        id: vehicleForm.id.trim().toUpperCase(),
        type: vehicleForm.type.trim(),
        driver: vehicleForm.driver.trim(),
        location: "Not reporting",
        speed: "0 km/h",
        status: "Idle",
        maintenanceDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        utilization: 0,
      },
      ...prev,
    ]);

    setVehicleForm({ id: "", type: "", driver: "" });
  };

  const removeVehicle = (id) => {
    setFleet((prev) => prev.filter((vehicle) => vehicle.id !== id));
  };

  const maintenanceAlerts = useMemo(
    () => fleet.filter((vehicle) => new Date(vehicle.maintenanceDue) <= new Date("2026-03-10")),
    [fleet],
  );

  const avgUtilization = useMemo(() => {
    if (!fleet.length) return 0;
    const total = fleet.reduce((sum, vehicle) => sum + vehicle.utilization, 0);
    return Math.round(total / fleet.length);
  }, [fleet]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <NavBar title="Fleet Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 p-4 lg:p-8 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Operations</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Vehicle and driver control center</h1>
              <p className="mt-2 text-sm text-slate-400">
                Add and remove vehicles, monitor live movement, schedule maintenance, and track driver performance.
              </p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Fleet Size</p>
                <p className="mt-2 text-3xl font-bold text-white">{fleet.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Maintenance Alerts</p>
                <p className="mt-2 text-3xl font-bold text-amber-400">{maintenanceAlerts.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg Utilization</p>
                <p className="mt-2 text-3xl font-bold text-emerald-400">{avgUtilization}%</p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <form onSubmit={addVehicle} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Plus className="text-orange-400" size={18} />
                  <h2 className="text-lg font-semibold text-white">Adding and Removing</h2>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    value={vehicleForm.id}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, id: event.target.value }))}
                    className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Vehicle ID"
                    required
                  />
                  <input
                    value={vehicleForm.type}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, type: event.target.value }))}
                    className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Vehicle Type"
                    required
                  />
                  <input
                    value={vehicleForm.driver}
                    onChange={(event) => setVehicleForm((prev) => ({ ...prev, driver: event.target.value }))}
                    className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Assigned Driver"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <Plus size={16} />
                  Add Vehicle
                </button>

                <div className="space-y-3 pt-2">
                  {fleet.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{vehicle.id} · {vehicle.type}</p>
                        <p className="text-xs text-slate-500">Driver: {vehicle.driver}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVehicle(vehicle.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </form>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-3">
                  <Truck className="text-orange-400" size={18} />
                  <h2 className="text-lg font-semibold text-white">Vehicle Tracking and Monitoring</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {fleet.map((vehicle) => (
                    <div key={vehicle.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{vehicle.id}</p>
                        <span className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{vehicle.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">Location: {vehicle.location}</p>
                      <div className="mt-2 inline-flex items-center gap-2 text-xs text-amber-300">
                        <Gauge size={14} />
                        {vehicle.speed}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-3">
                  <CalendarClock className="text-orange-400" size={18} />
                  <h2 className="text-lg font-semibold text-white">Maintenance Scheduling and Alerts</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {maintenanceAlerts.length === 0 ? (
                    <p className="text-sm text-slate-500">No upcoming maintenance alerts.</p>
                  ) : (
                    maintenanceAlerts.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
                      >
                        <div className="flex items-center gap-2 text-amber-300">
                          <AlertTriangle size={15} />
                          <p className="text-sm font-semibold">{vehicle.id} maintenance due</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">Due date: {vehicle.maintenanceDue}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-3">
                  <UserRound className="text-orange-400" size={18} />
                  <h2 className="text-lg font-semibold text-white">Driver Management and Performance Tracking</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {fleet.map((vehicle) => (
                    <div key={`${vehicle.id}-driver`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{vehicle.driver}</p>
                        <span className="text-xs text-emerald-300">{vehicle.utilization}% utilization</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Vehicle: {vehicle.id} · Status: {vehicle.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FleetManagement;
