import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  Clock3,
  MapPinned,
  Plus,
  Route,
  TrafficCone,
} from "lucide-react";
import { toast } from "react-toastify";
import { app } from "../../Auth/firebase";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const db = getFirestore(app);
const ROUTES_COLLECTION = "fleet_routes";
const DRIVERS_COLLECTION = "fleet_drivers";
const VEHICLES_COLLECTION = "fleet_vehicles";

const sampleOptimizationItems = [
  { title: "Mode", detail: "Road Transport" },
  { title: "Estimated Time", detail: "2-3 days" },
  { title: "Distance", detail: "Approx. 700 km" },
];

const routeTemplate = {
  routeName: "Lagos (Apapa) - Enugu",
  route: "Lagos (Apapa) to Enugu State (Enugu City)",
  mode: "Road Transport",
  path: ["Lagos (Apapa)", "Owerri", "Aba", "Enugu"],
  stops: [
    { name: "Owerri", purpose: "Rest & Inspection" },
    { name: "Aba", purpose: "Fuel Stop" },
  ],
  estimatedTime: "2-3 days",
  distance: "Approx. 700 km",
};

const routeMaintenanceItems = [
  "Creating the route template with stops and details",
  "Assigning drivers and vehicles",
  "Tracking GPS updates and status changes",
  "Updating clients on ETAs",
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

const emptyRouteForm = {
  routeName: "",
  route: "",
  mode: "Road Transport",
  path: "",
  stops: "",
  estimatedTime: "",
  distance: "",
  assignedDriver: "",
  assignedVehicle: "",
  gpsStatus: "",
  etaUpdate: "",
};

const parseStops = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, purpose] = item.split("|").map((part) => part.trim());
      return { name: name || "Stop", purpose: purpose || "Checkpoint" };
    });

const formatTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const RouteManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("optimization");
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeForm, setRouteForm] = useState(emptyRouteForm);
  const [routes, setRoutes] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [busyState, setBusyState] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, ROUTES_COLLECTION),
      (snapshot) => {
        const nextRoutes = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort(
            (left, right) =>
              formatTimestampValue(right.updatedAt || right.createdAt)
              - formatTimestampValue(left.updatedAt || left.createdAt),
          );
        setRoutes(nextRoutes);
      },
      (error) => {
        toast.error(error?.message || "Failed to load saved routes.");
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, DRIVERS_COLLECTION),
      (snapshot) => {
        const nextDrivers = snapshot.docs
          .map((item) => item.data()?.fullName?.trim())
          .filter(Boolean)
          .sort((left, right) => left.localeCompare(right));
        setDriverOptions(nextDrivers);
      },
      (error) => {
        toast.error(error?.message || "Failed to load driver options.");
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, VEHICLES_COLLECTION),
      (snapshot) => {
        const nextVehicles = snapshot.docs
          .map((item) => {
            const data = item.data();
            return (data.id || "").trim().toUpperCase();
          })
          .filter(Boolean)
          .sort((left, right) => left.localeCompare(right));
        setVehicleOptions(nextVehicles);
      },
      (error) => {
        toast.error(error?.message || "Failed to load vehicle options.");
      },
    );

    return () => unsubscribe();
  }, []);

  const routeStats = useMemo(
    () => [
      { label: "Active Routes", value: String(routes.length), tone: "text-white", icon: Route },
      { label: "Delayed Corridors", value: "6", tone: "text-amber-400", icon: TrafficCone },
      { label: "ETA Accuracy", value: "92%", tone: "text-emerald-400", icon: Clock3 },
    ],
    [routes.length],
  );

  const tabs = [
    { id: "optimization", label: "Lane Optimization", icon: Route },
    { id: "traffic", label: "Traffic Watch", icon: TrafficCone },
    { id: "stops", label: "Stop Planning", icon: MapPinned },
  ];

  const closeRouteModal = () => {
    if (busyState === "save-route") {
      return;
    }
    setIsRouteModalOpen(false);
    setRouteForm(emptyRouteForm);
  };

  const saveRoute = async (event) => {
    event.preventDefault();
    if (
      !routeForm.routeName.trim()
      || !routeForm.route.trim()
      || !routeForm.path.trim()
      || !routeForm.estimatedTime.trim()
      || !routeForm.distance.trim()
    ) {
      toast.info("Complete the main route details before saving.");
      return;
    }

    setBusyState("save-route");
    try {
      await addDoc(collection(db, ROUTES_COLLECTION), {
        routeName: routeForm.routeName.trim(),
        route: routeForm.route.trim(),
        mode: routeForm.mode.trim() || "Road Transport",
        path: routeForm.path.split("->").map((item) => item.trim()).filter(Boolean),
        stops: parseStops(routeForm.stops),
        estimatedTime: routeForm.estimatedTime.trim(),
        distance: routeForm.distance.trim(),
        assignedDriver: routeForm.assignedDriver.trim(),
        assignedVehicle: routeForm.assignedVehicle.trim(),
        gpsStatus: routeForm.gpsStatus.trim(),
        etaUpdate: routeForm.etaUpdate.trim(),
        maintainedBy: routeMaintenanceItems,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Route saved successfully.");
      closeRouteModal();
    } catch (error) {
      toast.error(error?.message || "Failed to save route.");
    } finally {
      setBusyState("");
    }
  };

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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Lane Optimization</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Use the sample route below and create additional route templates for the fleet.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRouteModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      <Plus size={16} />
                      Add Route
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-orange-300">Sample Route For LogisticsPro Solution</p>
                    <h3 className="mt-3 text-2xl font-bold text-white">{routeTemplate.routeName}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Route</p>
                        <p className="mt-2 text-sm font-semibold text-white">{routeTemplate.route}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Route Path</p>
                        <p className="mt-2 text-sm font-semibold text-white">{routeTemplate.path.join(" -> ")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {sampleOptimizationItems.map((item) => (
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
                  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Saved Routes</h3>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        {routes.length} route{routes.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {routes.length ? (
                        routes.map((savedRoute) => (
                          <div key={savedRoute.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{savedRoute.routeName}</p>
                                <p className="mt-1 text-sm text-slate-400">{savedRoute.route}</p>
                              </div>
                              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-orange-300">
                                {savedRoute.mode || "Road Transport"}
                              </span>
                            </div>
                            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">Path</p>
                            <p className="mt-1 text-sm text-slate-300">
                              {(savedRoute.path || []).join(" -> ") || "Not provided"}
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Estimated Time</p>
                                <p className="mt-1 text-sm text-white">{savedRoute.estimatedTime || "Not specified"}</p>
                              </div>
                              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Distance</p>
                                <p className="mt-1 text-sm text-white">{savedRoute.distance || "Not specified"}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No saved routes yet. Use Add Route to create one.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <h2 className="text-lg font-semibold text-white">Key Stops And System Handling</h2>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-sm font-semibold text-white">Key Stops</p>
                      <div className="mt-3 space-y-3">
                        {routeTemplate.stops.map((stop) => (
                          <div key={stop.name} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                            <p className="text-sm font-semibold text-white">{stop.name}</p>
                            <p className="mt-1 text-sm text-slate-400">{stop.purpose}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-sm font-semibold text-white">Maintained In The System By</p>
                      <div className="mt-3 space-y-3">
                        {routeMaintenanceItems.map((item) => (
                          <div key={item} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                            <p className="text-sm text-slate-300">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
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

      {isRouteModalOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lane Optimization</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Add Route</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Create a reusable route template and save it to the fleet route library.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRouteModal}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={saveRoute} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Route Name</span>
                  <input
                    value={routeForm.routeName}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, routeName: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Lagos (Apapa) - Enugu"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Mode</span>
                  <input
                    value={routeForm.mode}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, mode: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Road Transport"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Route Description</span>
                  <input
                    value={routeForm.route}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, route: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Lagos (Apapa) to Enugu State (Enugu City)"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Route Path</span>
                  <input
                    value={routeForm.path}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, path: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Lagos (Apapa) -> Owerri -> Aba -> Enugu"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Estimated Time</span>
                  <input
                    value={routeForm.estimatedTime}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, estimatedTime: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="2-3 days"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Distance</span>
                  <input
                    value={routeForm.distance}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, distance: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Approx. 700 km"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Assigned Driver</span>
                  <select
                    value={routeForm.assignedDriver}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, assignedDriver: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Select driver</option>
                    {driverOptions.map((driver) => (
                      <option key={driver} value={driver}>
                        {driver}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Assigned Vehicle</span>
                  <select
                    value={routeForm.assignedVehicle}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, assignedVehicle: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Select vehicle</option>
                    {vehicleOptions.map((vehicleId) => (
                      <option key={vehicleId} value={vehicleId}>
                        {vehicleId}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">GPS Status</span>
                  <input
                    value={routeForm.gpsStatus}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, gpsStatus: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Tracking active"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">ETA Update</span>
                  <input
                    value={routeForm.etaUpdate}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, etaUpdate: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Client updated for 48-hour arrival"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Key Stops</span>
                  <textarea
                    value={routeForm.stops}
                    onChange={(event) => setRouteForm((prev) => ({ ...prev, stops: event.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                    placeholder={"Owerri | Rest & Inspection\nAba | Fuel Stop"}
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRouteModal}
                  disabled={busyState === "save-route"}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 hover:bg-slate-800 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyState === "save-route"}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  <Plus size={14} />
                  {busyState === "save-route" ? "Saving..." : "Save Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RouteManagement;
