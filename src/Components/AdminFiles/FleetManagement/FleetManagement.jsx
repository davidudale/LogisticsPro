import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Eye, Gauge, Pencil, Plus, Trash2, Truck, UserRound } from "lucide-react";
import { addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import NavBar from "../../Basics/NavBar.jsx";
import { app } from "../../Auth/firebase.js";
import Sidebar from "../../Basics/Sidebar.jsx";

const db = getFirestore(app);
const FLEET_COLLECTION = "fleet_vehicles";
const DRIVERS_COLLECTION = "fleet_drivers";

const emptyVehicleForm = { id: "", make: "", model: "", year: "", vin: "", licensePlate: "", type: "", ownershipType: "Owned", category: "Heavy-duty", capacityTonnage: "", capacityVolume: "", fuelType: "Diesel", transmission: "Automatic", registrationLicense: "", insurance: "", permits: "", inspectionCertificate: "", serviceHistory: "", nextServiceReminder: "", tyreSpec: "", tyreExpiryDate: "", driver: "", location: "", gpsTrackerId: "", speed: "", status: "Idle", maintenanceDue: "", utilization: "" };

const fieldSections = [
  { title: "Vehicle Details", fields: [["id", "Vehicle ID", "text", true], ["make", "Make"], ["model", "Model"], ["year", "Year"], ["vin", "VIN"], ["licensePlate", "License Plate"], ["type", "Vehicle Type", "text", true]] },
  { title: "Vehicle Classification", fields: [["ownershipType", "Ownership Type", "select", false, ["Owned", "Leased", "Subcontractor"]], ["category", "Category", "select", false, ["Heavy-duty", "Medium-duty", "Light-duty"]]] },
  { title: "Specifications", fields: [["capacityTonnage", "Capacity (Tonnage)"], ["capacityVolume", "Capacity (Volume)"], ["fuelType", "Fuel Type", "select", false, ["Diesel", "Petrol", "Hybrid", "Electric"]], ["transmission", "Transmission", "select", false, ["Automatic", "Manual"]]] },
  { title: "Registration Docs", fields: [["registrationLicense", "Registration License"], ["insurance", "Insurance"], ["permits", "Permits"], ["inspectionCertificate", "Inspection Certificate"]] },
  { title: "Maintenance Tracking", fields: [["serviceHistory", "Service History", "textarea"], ["nextServiceReminder", "Next Service Reminder", "date"], ["tyreSpec", "Tyre Spec"], ["tyreExpiryDate", "Tyre Expiry Date", "date"], ["maintenanceDue", "Maintenance Due", "date"]] },
  { title: "Assignment & Tracking", fields: [["driver", "Assigned Driver", "driver-select", true], ["location", "Track Location (GPS)"], ["gpsTrackerId", "GPS Tracker ID"], ["speed", "Speed e.g. 42 km/h"], ["status", "Status", "select", false, ["Idle", "In transit", "Maintenance"]], ["utilization", "Utilization %", "number"]] },
];

const mapVehicleRecord = (item) => {
  const data = item.data();
  return { firestoreId: item.id, ...emptyVehicleForm, ...data, utilization: Number(data.utilization) || 0, location: data.location || "Not reporting", speed: data.speed || "0 km/h" };
};

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatTimestamp = (record) => {
  const timestampValue = getTimestampValue(record.updatedAt || record.createdAt);
  if (!timestampValue) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampValue));
};

const FleetManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fleet, setFleet] = useState([]);
  const [activeTab, setActiveTab] = useState("vehicles");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isVehicleViewOpen, setIsVehicleViewOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicleId, setEditingVehicleId] = useState("");
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(true);
  const [busyVehicleId, setBusyVehicleId] = useState("");
  const [driverOptions, setDriverOptions] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, FLEET_COLLECTION), (snapshot) => {
      setFleet(snapshot.docs.map(mapVehicleRecord));
      setIsVehiclesLoading(false);
    }, (error) => {
      setIsVehiclesLoading(false);
      toast.error(error?.message || "Failed to load fleet vehicles.");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, DRIVERS_COLLECTION), (snapshot) => {
      const nextDriverOptions = snapshot.docs
        .map((item) => item.data()?.fullName?.trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right));
      setDriverOptions(nextDriverOptions);
    }, (error) => {
      toast.error(error?.message || "Failed to load driver options.");
    });
    return () => unsubscribe();
  }, []);

  const openAddVehicleModal = () => {
    setEditingVehicleId("");
    setVehicleForm({ ...emptyVehicleForm, maintenanceDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), nextServiceReminder: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) });
    setIsVehicleModalOpen(true);
  };

  const openEditVehicleModal = (vehicle) => {
    setEditingVehicleId(vehicle.firestoreId);
    setVehicleForm({ ...emptyVehicleForm, ...vehicle, utilization: String(vehicle.utilization ?? "") });
    setIsVehicleModalOpen(true);
  };

  const saveVehicle = async (event) => {
    event.preventDefault();
    if (!vehicleForm.id || !vehicleForm.type || !vehicleForm.driver) return;
    const normalizedId = vehicleForm.id.trim().toUpperCase();
    const duplicateExists = fleet.some((vehicle) => vehicle.id.toLowerCase() === normalizedId.toLowerCase() && vehicle.firestoreId !== editingVehicleId);
    if (duplicateExists) return toast.error("A vehicle with that ID already exists.");

    const payload = { ...vehicleForm, id: normalizedId, location: vehicleForm.location.trim() || "Not reporting", speed: vehicleForm.speed.trim() || "0 km/h", utilization: Number(vehicleForm.utilization) || 0, updatedAt: serverTimestamp() };
    setBusyVehicleId(editingVehicleId || normalizedId);
    try {
      if (editingVehicleId) {
        await updateDoc(doc(db, FLEET_COLLECTION, editingVehicleId), payload);
        toast.success("Vehicle updated.");
      } else {
        await addDoc(collection(db, FLEET_COLLECTION), { ...payload, createdAt: serverTimestamp() });
        toast.success("Vehicle added.");
      }
      setIsVehicleModalOpen(false);
      setEditingVehicleId("");
      setVehicleForm(emptyVehicleForm);
    } catch (error) {
      toast.error(error?.message || "Failed to save vehicle.");
    } finally {
      setBusyVehicleId("");
    }
  };

  const removeVehicle = async (vehicle) => {
    setBusyVehicleId(vehicle.firestoreId);
    try {
      await deleteDoc(doc(db, FLEET_COLLECTION, vehicle.firestoreId));
      if (selectedVehicle?.firestoreId === vehicle.firestoreId) {
        setSelectedVehicle(null);
        setIsVehicleViewOpen(false);
      }
      toast.success("Vehicle deleted.");
    } catch (error) {
      toast.error(error?.message || "Failed to delete vehicle.");
    } finally {
      setBusyVehicleId("");
    }
  };

  const maintenanceAlerts = useMemo(() => fleet.filter((vehicle) => vehicle.maintenanceDue && new Date(vehicle.maintenanceDue) <= new Date("2026-03-10")), [fleet]);
  const avgUtilization = useMemo(() => fleet.length ? Math.round(fleet.reduce((sum, vehicle) => sum + vehicle.utilization, 0) / fleet.length) : 0, [fleet]);
  const sortedFleet = useMemo(() => [...fleet].sort((left, right) => getTimestampValue(right.updatedAt || right.createdAt) - getTimestampValue(left.updatedAt || left.createdAt)), [fleet]);
  const sectionTabs = [{ id: "vehicles", label: "Vehicle Management", icon: Plus }, { id: "tracking", label: "Tracking & Monitoring", icon: Truck }, { id: "maintenance", label: "Maintenance", icon: CalendarClock }, { id: "drivers", label: "Driver Performance", icon: UserRound }];

  const renderField = ([key, label, kind = "text", required = false, options = []]) => {
    if (kind === "textarea") return <textarea key={key} value={vehicleForm[key]} onChange={(event) => setVehicleForm((prev) => ({ ...prev, [key]: event.target.value }))} className="sm:col-span-2 min-h-24 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder={label} />;
    if (kind === "driver-select") return <select key={key} value={vehicleForm[key]} onChange={(event) => setVehicleForm((prev) => ({ ...prev, [key]: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" required={required}><option value="">Select assigned driver</option>{driverOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
    if (kind === "select") return <select key={key} value={vehicleForm[key]} onChange={(event) => setVehicleForm((prev) => ({ ...prev, [key]: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
    return <input key={key} type={kind} min={kind === "number" ? "0" : undefined} max={kind === "number" ? "100" : undefined} value={vehicleForm[key]} onChange={(event) => setVehicleForm((prev) => ({ ...prev, [key]: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder={label} required={required} />;
  };

  const vehicleDetails = [
    ["Vehicle ID", selectedVehicle?.id],
    ["Type", selectedVehicle?.type],
    ["Make / Model / Year", [selectedVehicle?.make, selectedVehicle?.model, selectedVehicle?.year].filter(Boolean).join(" / ")],
    ["VIN", selectedVehicle?.vin],
    ["License Plate", selectedVehicle?.licensePlate],
    ["Ownership / Category", [selectedVehicle?.ownershipType, selectedVehicle?.category].filter(Boolean).join(" / ")],
    ["Capacity", [selectedVehicle?.capacityTonnage && `${selectedVehicle.capacityTonnage} tons`, selectedVehicle?.capacityVolume].filter(Boolean).join(" / ")],
    ["Fuel / Transmission", [selectedVehicle?.fuelType, selectedVehicle?.transmission].filter(Boolean).join(" / ")],
    ["Driver", selectedVehicle?.driver],
    ["Status", selectedVehicle?.status],
    ["Location", selectedVehicle?.location],
    ["Speed", selectedVehicle?.speed],
    ["Maintenance Due", selectedVehicle?.maintenanceDue],
    ["Next Service Reminder", selectedVehicle?.nextServiceReminder],
    ["Tyre Spec / Expiry", [selectedVehicle?.tyreSpec, selectedVehicle?.tyreExpiryDate].filter(Boolean).join(" / ")],
    ["Registration Docs", [selectedVehicle?.registrationLicense, selectedVehicle?.insurance, selectedVehicle?.permits, selectedVehicle?.inspectionCertificate].filter(Boolean).join(" / ")],
    ["Service History", selectedVehicle?.serviceHistory, "sm:col-span-2"],
    ["GPS Tracker ID", selectedVehicle?.gpsTrackerId],
    ["Utilization", selectedVehicle ? `${selectedVehicle.utilization}%` : "", ""],
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <NavBar title="Fleet Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 p-4 lg:p-8 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"><p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Operations</p><h1 className="mt-2 text-3xl font-bold text-white">Vehicle and driver control center</h1><p className="mt-2 text-sm text-slate-400">Add and remove vehicles, monitor live movement, schedule maintenance, and track driver performance.</p></header>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Fleet Size</p><p className="mt-2 text-3xl font-bold text-white">{fleet.length}</p></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Maintenance Alerts</p><p className="mt-2 text-3xl font-bold text-amber-400">{maintenanceAlerts.length}</p></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg Utilization</p><p className="mt-2 text-3xl font-bold text-emerald-400">{avgUtilization}%</p></div>
            </section>
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-2 sm:p-3"><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">{sectionTabs.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${isActive ? "bg-orange-600 text-white" : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"}`}><Icon size={16} /><span>{tab.label}</span></button>; })}</div></section>

            {activeTab === "vehicles" ? <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Truck className="text-orange-400" size={18} /><h2 className="text-lg font-semibold text-white">Vehicle Management</h2></div><button type="button" onClick={openAddVehicleModal} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"><Plus size={16} />Add New Vehicle</button></div>
              <div className="max-h-[65vh] overflow-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400"><th className="px-3 py-2">Vehicle ID</th><th className="px-3 py-2">Timestamp</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Driver</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Maintenance Due</th><th className="px-3 py-2">Utilization</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>
                {isVehiclesLoading ? <tr><td colSpan={9} className="px-3 py-4 text-slate-500">Loading vehicles...</td></tr> : sortedFleet.length === 0 ? <tr><td colSpan={9} className="px-3 py-4 text-slate-500">No vehicles found yet.</td></tr> : sortedFleet.map((vehicle) => <tr key={vehicle.firestoreId} className="border-t border-slate-800"><td className="px-3 py-3 font-semibold text-white">{vehicle.id}</td><td className="px-3 py-3 text-slate-400">{formatTimestamp(vehicle)}</td><td className="px-3 py-3 text-slate-300">{vehicle.type}</td><td className="px-3 py-3 text-slate-300">{vehicle.driver}</td><td className="px-3 py-3 text-slate-400">{vehicle.location}</td><td className="px-3 py-3 text-slate-300">{vehicle.status}</td><td className="px-3 py-3 text-slate-400">{vehicle.maintenanceDue || "Not set"}</td><td className="px-3 py-3 text-emerald-300">{vehicle.utilization}%</td><td className="px-3 py-3"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => openViewVehicleModal(vehicle)} className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"><Eye size={14} />View</button><button type="button" onClick={() => openEditVehicleModal(vehicle)} disabled={busyVehicleId === vehicle.firestoreId} className="inline-flex items-center gap-1 rounded-lg border border-orange-500/30 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/10 disabled:opacity-60"><Pencil size={14} />Edit</button><button type="button" onClick={() => removeVehicle(vehicle)} disabled={busyVehicleId === vehicle.firestoreId} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"><Trash2 size={14} />Delete</button></div></td></tr>)}
              </tbody></table></div>
            </section> : null}

            {activeTab === "tracking" ? <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"><div className="flex items-center gap-3"><Truck className="text-orange-400" size={18} /><h2 className="text-lg font-semibold text-white">Vehicle Tracking and Monitoring</h2></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{fleet.map((vehicle) => <div key={vehicle.firestoreId} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">{vehicle.id}</p><span className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{vehicle.status}</span></div><p className="mt-2 text-xs text-slate-400">Location: {vehicle.location}</p><div className="mt-2 inline-flex items-center gap-2 text-xs text-amber-300"><Gauge size={14} />{vehicle.speed}</div></div>)}</div></section> : null}
            {activeTab === "maintenance" ? <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"><div className="flex items-center gap-3"><CalendarClock className="text-orange-400" size={18} /><h2 className="text-lg font-semibold text-white">Maintenance Scheduling and Alerts</h2></div><div className="mt-4 space-y-3">{maintenanceAlerts.length === 0 ? <p className="text-sm text-slate-500">No upcoming maintenance alerts.</p> : maintenanceAlerts.map((vehicle) => <div key={vehicle.firestoreId} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"><div className="flex items-center gap-2 text-amber-300"><AlertTriangle size={15} /><p className="text-sm font-semibold">{vehicle.id} maintenance due</p></div><p className="mt-1 text-xs text-slate-300">Due date: {vehicle.maintenanceDue}</p></div>)}</div></section> : null}
            {activeTab === "drivers" ? <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"><div className="flex items-center gap-3"><UserRound className="text-orange-400" size={18} /><h2 className="text-lg font-semibold text-white">Driver Management and Performance Tracking</h2></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{fleet.map((vehicle) => <div key={`${vehicle.firestoreId}-driver`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">{vehicle.driver}</p><span className="text-xs text-emerald-300">{vehicle.utilization}% utilization</span></div><p className="mt-1 text-xs text-slate-400">Vehicle: {vehicle.id} · Status: {vehicle.status}</p></div>)}</div></section> : null}
          </div>
        </main>
      </div>

      {isVehicleModalOpen ? <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-white">{editingVehicleId ? "Edit Vehicle" : "Add New Vehicle"}</h3><p className="mt-1 text-sm text-slate-400">Capture the full operational profile for this fleet unit.</p></div><button type="button" onClick={() => { setIsVehicleModalOpen(false); setEditingVehicleId(""); setVehicleForm(emptyVehicleForm); }} className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Close</button></div><form onSubmit={saveVehicle} className="mt-4 max-h-[75vh] overflow-y-auto pr-1"><div className="grid gap-3 sm:grid-cols-2">{fieldSections.map((section) => <React.Fragment key={section.title}><p className="sm:col-span-2 mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{section.title}</p>{section.fields.map(renderField)}</React.Fragment>)}<button type="submit" disabled={Boolean(busyVehicleId)} className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">{busyVehicleId ? editingVehicleId ? "Saving..." : "Adding..." : editingVehicleId ? "Save Changes" : "Add Vehicle"}</button></div></form></div></div> : null}

      {isVehicleViewOpen && selectedVehicle ? <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-white">Vehicle Details</h3><p className="mt-1 text-sm text-slate-400">Review the current operational profile for this vehicle.</p></div><button type="button" onClick={() => { setIsVehicleViewOpen(false); setSelectedVehicle(null); }} className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Close</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{vehicleDetails.map(([label, value, span = "", tone = "text-white"]) => <div key={label} className={`rounded-xl border border-slate-800 bg-slate-950/60 p-4 ${span}`}><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className={`mt-2 text-sm font-semibold ${label === "Utilization" ? "text-emerald-300" : tone}`}>{value || "Not set"}</p></div>)}</div></div></div> : null}
    </div>
  );
};

export default FleetManagement;
