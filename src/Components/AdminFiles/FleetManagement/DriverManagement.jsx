import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Eye,
  IdCard,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import NavBar from "../../Basics/NavBar.jsx";
import { app } from "../../Auth/firebase.js";
import Sidebar from "../../Basics/Sidebar.jsx";
import { normalizeRole, ROLE } from "../../../utils/roles.js";

const db = getFirestore(app);
const DRIVERS_COLLECTION = "fleet_drivers";
const USERS_COLLECTION = "users";

const emptyDriverForm = {
  fullName: "",
  email: "",
  phone: "",
  licenseNo: "",
  licenseExpiry: "",
  assignedTruckId: "",
  assignmentStatus: "Available",
  territory: "",
  certificationStatus: "Compliant",
  incidentStatus: "Clear",
  notes: "",
};

const tabs = [
  { id: "licenses", label: "License Monitoring", icon: IdCard },
  { id: "assignments", label: "Assignment Readiness", icon: Briefcase },
  { id: "compliance", label: "Compliance Checks", icon: ShieldCheck },
];

const mapDriverRecord = (item) => {
  const data = item.data();
  return {
    firestoreId: item.id,
    source: DRIVERS_COLLECTION,
    isFleetRecord: true,
    fullName: data.fullName || "",
    email: data.email || "",
    phone: data.phone || "",
    licenseNo: data.licenseNo || "",
    licenseExpiry: data.licenseExpiry || "",
    assignedTruckId: data.assignedTruckId || "",
    assignmentStatus: data.assignmentStatus || "Available",
    territory: data.territory || "",
    certificationStatus: data.certificationStatus || "Compliant",
    incidentStatus: data.incidentStatus || "Clear",
    notes: data.notes || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

const mapUserDriverRecord = (item) => {
  const data = item.data();
  return {
    firestoreId: item.id,
    source: USERS_COLLECTION,
    isFleetRecord: false,
    fullName: data.fullName || data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    licenseNo: data.licenseNo || "",
    licenseExpiry: data.licenseExpiry || "",
    assignedTruckId: data.assignedTruckId || data.truckId || data.vehicleId || "",
    assignmentStatus: data.assignmentStatus || "Available",
    territory: data.territory || "",
    certificationStatus: data.certificationStatus || "Compliant",
    incidentStatus: data.incidentStatus || "Clear",
    notes: data.notes || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    role: data.role || "",
  };
};

const buildDriverKey = (driver) =>
  [
    driver.email?.trim().toLowerCase(),
    driver.licenseNo?.trim().toLowerCase(),
    driver.fullName?.trim().toLowerCase(),
  ].find(Boolean) || driver.firestoreId;

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

const DriverManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("licenses");
  const [fleetDrivers, setFleetDrivers] = useState([]);
  const [userDrivers, setUserDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyDriverId, setBusyDriverId] = useState("");
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isDriverViewOpen, setIsDriverViewOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState("");
  const [editingDriverSource, setEditingDriverSource] = useState(DRIVERS_COLLECTION);
  const [driverForm, setDriverForm] = useState(emptyDriverForm);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    const unsubscribeFleetDrivers = onSnapshot(
      collection(db, DRIVERS_COLLECTION),
      (snapshot) => {
        setFleetDrivers(snapshot.docs.map(mapDriverRecord));
        setIsLoading(false);
      },
      (error) => {
        console.error("[Firestore][DriverManagement] Failed watching collection", {
          collection: DRIVERS_COLLECTION,
          error,
        });
        setIsLoading(false);
        toast.error(error?.message || "Failed to load fleet drivers.");
      },
    );

    const unsubscribeUsers = onSnapshot(
      query(collection(db, USERS_COLLECTION), where("role", "==", ROLE.DRIVER)),
      (snapshot) => {
        setUserDrivers(
          snapshot.docs
            .map(mapUserDriverRecord)
            .filter((driver) => normalizeRole(driver.role) === ROLE.DRIVER),
        );
      },
      (error) => {
        console.error("[Firestore][DriverManagement] Failed watching collection", {
          collection: USERS_COLLECTION,
          error,
        });
        toast.error(error?.message || "Failed to load driver user profiles.");
      },
    );

    return () => {
      unsubscribeFleetDrivers();
      unsubscribeUsers();
    };
  }, []);

  const drivers = useMemo(() => {
    const mergedDrivers = new Map();

    fleetDrivers.forEach((driver) => {
      mergedDrivers.set(buildDriverKey(driver), driver);
    });

    userDrivers.forEach((driver) => {
      const key = buildDriverKey(driver);
      if (!mergedDrivers.has(key)) {
        mergedDrivers.set(key, driver);
      }
    });

    return [...mergedDrivers.values()];
  }, [fleetDrivers, userDrivers]);

  const activeDrivers = useMemo(
    () => drivers.filter((driver) => driver.assignmentStatus !== "Inactive").length,
    [drivers],
  );

  const licensesExpiring = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          driver.licenseExpiry &&
          new Date(driver.licenseExpiry) <= new Date("2026-04-30"),
      ).length,
    [drivers],
  );

  const pendingAssignments = useMemo(
    () => drivers.filter((driver) => driver.assignmentStatus === "Pending Assignment").length,
    [drivers],
  );
  const sortedDrivers = useMemo(
    () => [...drivers].sort(
      (left, right) =>
        getTimestampValue(right.updatedAt || right.createdAt)
        - getTimestampValue(left.updatedAt || left.createdAt),
    ),
    [drivers],
  );

  const openAddDriverModal = () => {
    setEditingDriverId("");
    setEditingDriverSource(DRIVERS_COLLECTION);
    setDriverForm(emptyDriverForm);
    setIsDriverModalOpen(true);
  };

  const openEditDriverModal = (driver) => {
    setEditingDriverId(driver.firestoreId);
    setEditingDriverSource(driver.source || DRIVERS_COLLECTION);
    setDriverForm({ ...emptyDriverForm, ...driver });
    setIsDriverModalOpen(true);
  };

  const openViewDriverModal = (driver) => {
    setSelectedDriver(driver);
    setIsDriverViewOpen(true);
  };

  const saveDriver = async (event) => {
    event.preventDefault();
    if (!driverForm.fullName || !driverForm.licenseNo) return;

    const normalizedEmail = driverForm.email.trim().toLowerCase();
    const duplicateDriver = drivers.some(
      (driver) =>
        driver.firestoreId !== editingDriverId &&
        ((normalizedEmail && driver.email.toLowerCase() === normalizedEmail) ||
          driver.licenseNo.toLowerCase() === driverForm.licenseNo.trim().toLowerCase()),
    );

    if (duplicateDriver) {
      toast.error("A driver with that email or license number already exists.");
      return;
    }

    const payload = {
      fullName: driverForm.fullName.trim(),
      email: normalizedEmail,
      phone: driverForm.phone.trim(),
      licenseNo: driverForm.licenseNo.trim().toUpperCase(),
      licenseExpiry: driverForm.licenseExpiry,
      assignedTruckId: driverForm.assignedTruckId.trim().toUpperCase(),
      assignmentStatus: driverForm.assignmentStatus,
      territory: driverForm.territory.trim(),
      certificationStatus: driverForm.certificationStatus,
      incidentStatus: driverForm.incidentStatus,
      notes: driverForm.notes.trim(),
      updatedAt: serverTimestamp(),
    };

    const targetCollection = editingDriverSource || DRIVERS_COLLECTION;

    setBusyDriverId(editingDriverId || payload.licenseNo);

    try {
      if (editingDriverId) {
        await updateDoc(doc(db, targetCollection, editingDriverId), payload);
        toast.success("Driver updated.");
      } else {
        await addDoc(collection(db, DRIVERS_COLLECTION), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Driver added.");
      }
      setIsDriverModalOpen(false);
      setEditingDriverId("");
      setEditingDriverSource(DRIVERS_COLLECTION);
      setDriverForm(emptyDriverForm);
    } catch (error) {
      toast.error(error?.message || "Failed to save driver.");
    } finally {
      setBusyDriverId("");
    }
  };

  const removeDriver = async (driver) => {
    setBusyDriverId(driver.firestoreId);
    try {
      await deleteDoc(doc(db, DRIVERS_COLLECTION, driver.firestoreId));
      if (selectedDriver?.firestoreId === driver.firestoreId) {
        setSelectedDriver(null);
        setIsDriverViewOpen(false);
      }
      toast.success("Driver deleted.");
    } catch (error) {
      toast.error(error?.message || "Failed to delete driver.");
    } finally {
      setBusyDriverId("");
    }
  };

  const assignmentCards = useMemo(
    () =>
      drivers.map((driver) => ({
        title: driver.fullName,
        detail: `${driver.assignmentStatus}${driver.assignedTruckId ? ` · Truck ${driver.assignedTruckId}` : ""}${driver.territory ? ` · ${driver.territory}` : ""}`,
      })),
    [drivers],
  );

  const complianceCards = useMemo(
    () =>
      drivers.map((driver) => ({
        title: driver.fullName,
        detail: `${driver.certificationStatus} · ${driver.incidentStatus}${driver.notes ? ` · ${driver.notes}` : ""}`,
      })),
    [drivers],
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Driver Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Management</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Driver Management</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Manage driver profiles, license validity, dispatch readiness, and day-to-day assignment coverage across the fleet.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active Drivers</p>
                  <Users size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-white">{activeDrivers}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Licenses Expiring</p>
                  <IdCard size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-amber-400">{licensesExpiring}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending Assignments</p>
                  <Briefcase size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-orange-300">{pendingAssignments}</p>
              </div>
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

            {activeTab === "licenses" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <IdCard className="text-orange-400" size={18} />
                    <h2 className="text-lg font-semibold text-white">License Monitoring</h2>
                  </div>
                  <button
                    type="button"
                    onClick={openAddDriverModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                  >
                    <Plus size={16} />
                    Add New Driver
                  </button>
                </div>

                <div className="max-h-[65vh] overflow-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                        <th className="px-3 py-2">Driver</th>
                        <th className="px-3 py-2">Date Created</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2">License No</th>
                        <th className="px-3 py-2">License Expiry</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-4 text-slate-500">
                            Loading drivers...
                          </td>
                        </tr>
                      ) : sortedDrivers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-4 text-slate-500">
                            No drivers found yet.
                          </td>
                        </tr>
                      ) : (
                        sortedDrivers.map((driver) => (
                          <tr key={driver.firestoreId} className="border-t border-slate-800">
                            <td className="px-3 py-3 font-semibold text-white">{driver.fullName}</td>
                            <td className="px-3 py-3 text-slate-400">{formatTimestamp(driver)}</td>
                            <td className="px-3 py-3 text-slate-300">{driver.email || "Not set"}</td>
                            <td className="px-3 py-3 text-slate-300">{driver.phone || "Not set"}</td>
                            <td className="px-3 py-3 text-slate-400">{driver.licenseNo}</td>
                            <td className="px-3 py-3 text-slate-400">{driver.licenseExpiry || "Not set"}</td>
                            <td className="px-3 py-3 text-slate-300">{driver.assignmentStatus}</td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openViewDriverModal(driver)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                                >
                                  <Eye size={14} />
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditDriverModal(driver)}
                                  disabled={busyDriverId === driver.firestoreId}
                                  className="inline-flex items-center gap-1 rounded-lg border border-orange-500/30 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/10 disabled:opacity-60"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeDriver(driver)}
                                  disabled={busyDriverId === driver.firestoreId || !driver.isFleetRecord}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {activeTab === "assignments" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Assignment Readiness</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {assignmentCards.length === 0 ? (
                    <p className="text-sm text-slate-500">No driver assignments available yet.</p>
                  ) : (
                    assignmentCards.map((item) => (
                      <div key={item.title + item.detail} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-orange-300">
                            <Briefcase size={17} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "compliance" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h2 className="text-lg font-semibold text-white">Compliance Checks</h2>
                <div className="mt-4 space-y-3">
                  {complianceCards.length === 0 ? (
                    <p className="text-sm text-slate-500">No driver compliance records available yet.</p>
                  ) : (
                    complianceCards.map((item) => (
                      <div key={item.title + item.detail} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-slate-900/80 text-emerald-300">
                            <ShieldCheck size={17} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>

      {isDriverModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {editingDriverId ? "Edit Driver" : "Add New Driver"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Capture the profile, license, assignment, and compliance data for this driver.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDriverModalOpen(false);
                  setEditingDriverId("");
                  setDriverForm(emptyDriverForm);
                }}
                className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={saveDriver} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={driverForm.fullName} onChange={(event) => setDriverForm((prev) => ({ ...prev, fullName: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Full Name" required />
              <input value={driverForm.email} onChange={(event) => setDriverForm((prev) => ({ ...prev, email: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Email" />
              <input value={driverForm.phone} onChange={(event) => setDriverForm((prev) => ({ ...prev, phone: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Phone Number" />
              <input value={driverForm.licenseNo} onChange={(event) => setDriverForm((prev) => ({ ...prev, licenseNo: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="License Number" required />
              <input type="date" value={driverForm.licenseExpiry} onChange={(event) => setDriverForm((prev) => ({ ...prev, licenseExpiry: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" />
              <input value={driverForm.assignedTruckId} onChange={(event) => setDriverForm((prev) => ({ ...prev, assignedTruckId: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Assigned Truck ID" />
              <select value={driverForm.assignmentStatus} onChange={(event) => setDriverForm((prev) => ({ ...prev, assignmentStatus: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500">
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Pending Assignment">Pending Assignment</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input value={driverForm.territory} onChange={(event) => setDriverForm((prev) => ({ ...prev, territory: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Territory / Region" />
              <select value={driverForm.certificationStatus} onChange={(event) => setDriverForm((prev) => ({ ...prev, certificationStatus: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500">
                <option value="Compliant">Compliant</option>
                <option value="Review Needed">Review Needed</option>
                <option value="Expired">Expired</option>
              </select>
              <select value={driverForm.incidentStatus} onChange={(event) => setDriverForm((prev) => ({ ...prev, incidentStatus: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500">
                <option value="Clear">Clear</option>
                <option value="Under Review">Under Review</option>
                <option value="Escalated">Escalated</option>
              </select>
              <textarea value={driverForm.notes} onChange={(event) => setDriverForm((prev) => ({ ...prev, notes: event.target.value }))} className="sm:col-span-2 min-h-24 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Notes" />
              <button type="submit" disabled={Boolean(busyDriverId)} className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
                {busyDriverId ? (editingDriverId ? "Saving..." : "Adding...") : editingDriverId ? "Save Changes" : "Add Driver"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isDriverViewOpen && selectedDriver ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Driver Details</h3>
                <p className="mt-1 text-sm text-slate-400">Review the current profile for this driver.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDriverViewOpen(false);
                  setSelectedDriver(null);
                }}
                className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Full Name", selectedDriver.fullName],
                ["Email", selectedDriver.email],
                ["Phone", selectedDriver.phone],
                ["License Number", selectedDriver.licenseNo],
                ["License Expiry", selectedDriver.licenseExpiry],
                ["Assigned Truck", selectedDriver.assignedTruckId],
                ["Assignment Status", selectedDriver.assignmentStatus],
                ["Territory", selectedDriver.territory],
                ["Certification Status", selectedDriver.certificationStatus],
                ["Incident Status", selectedDriver.incidentStatus],
                ["Notes", selectedDriver.notes, "sm:col-span-2"],
              ].map(([label, value, span = ""]) => (
                <div key={label} className={`rounded-xl border border-slate-800 bg-slate-950/60 p-4 ${span}`}>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DriverManagement;
