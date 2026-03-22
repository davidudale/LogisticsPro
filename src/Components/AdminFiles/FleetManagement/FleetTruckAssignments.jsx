import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Search, ShieldCheck, Truck, UserRound } from "lucide-react";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";
import { app } from "../../Auth/firebase.js";
import { createNotificationRecord } from "../../Auth/notificationUtils.js";

const db = getFirestore(app);

const COLLECTIONS = {
  bookings: "customer_order",
  vehicles: "fleet_vehicles",
  drivers: "fleet_drivers",
  routes: "fleet_routes",
};

const normalizeIdentifier = (value) => value?.toString().trim().toUpperCase() || "";

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

const formatLocation = (location) => {
  if (!location || typeof location !== "object") return "";
  return [location.address, location.lga, location.state, location.country].filter(Boolean).join(", ");
};

const isAssignmentQueueStatus = (status) => {
  const normalized = (status || "").toString().trim().toLowerCase();
  return ["shipment booked", "truck assigned - pending approval"].includes(normalized);
};

const isAssignableVehicle = (vehicle) => {
  const normalizedStatus = (vehicle.status || "").toString().trim().toLowerCase();
  return !["maintenance", "in transit"].includes(normalizedStatus);
};

const mapBookingRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    orderNo: data.orderNo || "",
    quotationNo: data.quotationNo || "",
    customerName: data.customerName || data.customer || "",
    customerUid: data.customerUid || "",
    customerEmail: data.customerEmail || "",
    cargo: data.cargo || "",
    weight: data.weight || "",
    truckId: normalizeIdentifier(data.truckId),
    assignedDriverId: data.assignedDriverId || "",
    assignedDriverName: data.assignedDriverName || "",
    assignedRouteId: data.assignedRouteId || "",
    assignedRouteName: data.assignedRouteName || "",
    status: data.status || "Shipment Booking - In Progress",
    deliveryAddress: data.deliveryAddress || formatLocation(data.destination) || "Not available",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

const mapVehicleRecord = (item) => {
  const data = item.data();
  return {
    firestoreId: item.id,
    id: normalizeIdentifier(data.id || item.id),
    type: data.type || "",
    driver: data.driver || "",
    status: data.status || "Idle",
    location: data.location || "Not reporting",
    maintenanceDue: data.maintenanceDue || "",
    capacityTonnage: data.capacityTonnage || "",
    licensePlate: normalizeIdentifier(data.licensePlate),
  };
};

const mapDriverRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    fullName: data.fullName || "",
    assignedTruckId: normalizeIdentifier(data.assignedTruckId),
    assignmentStatus: data.assignmentStatus || "Available",
    territory: data.territory || "",
  };
};

const mapRouteRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    routeName: data.routeName || "",
    assignedDriver: data.assignedDriver || "",
    estimatedTime: data.estimatedTime || "",
    distance: data.distance || "",
  };
};

const FleetTruckAssignments = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyBookingId, setBusyBookingId] = useState("");
  const [selectedTruckByBooking, setSelectedTruckByBooking] = useState({});

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(
        collection(db, COLLECTIONS.bookings),
        (snapshot) => {
          setBookings(snapshot.docs.map(mapBookingRecord));
          setLoading(false);
        },
        (error) => {
          setLoading(false);
          toast.error(error?.message || "Failed to load shipment bookings.");
        },
      ),
      onSnapshot(
        collection(db, COLLECTIONS.vehicles),
        (snapshot) => {
          setVehicles(snapshot.docs.map(mapVehicleRecord).filter((vehicle) => vehicle.id));
        },
        (error) => {
          toast.error(error?.message || "Failed to load fleet vehicles.");
        },
      ),
      onSnapshot(
        collection(db, COLLECTIONS.drivers),
        (snapshot) => {
          setDrivers(snapshot.docs.map(mapDriverRecord).filter((driver) => driver.fullName));
        },
        (error) => {
          toast.error(error?.message || "Failed to load fleet drivers.");
        },
      ),
      onSnapshot(
        collection(db, COLLECTIONS.routes),
        (snapshot) => {
          setRoutes(snapshot.docs.map(mapRouteRecord).filter((route) => route.routeName));
        },
        (error) => {
          toast.error(error?.message || "Failed to load fleet routes.");
        },
      ),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const assignableVehicles = useMemo(
    () => vehicles.filter(isAssignableVehicle).sort((left, right) => left.id.localeCompare(right.id)),
    [vehicles],
  );

  const pendingBookings = useMemo(
    () =>
      [...bookings]
        .filter((booking) => isAssignmentQueueStatus(booking.status))
        .sort(
          (left, right) =>
            getTimestampValue(right.updatedAt || right.createdAt)
            - getTimestampValue(left.updatedAt || left.createdAt),
        ),
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return pendingBookings;
    }

    return pendingBookings.filter((booking) =>
      [
        booking.orderNo,
        booking.customerName,
        booking.cargo,
        booking.status,
        booking.deliveryAddress,
        booking.truckId,
      ].some((field) => field?.toString().toLowerCase().includes(value)),
    );
  }, [pendingBookings, query]);

  const vehicleCountNeedingAttention = useMemo(
    () => vehicles.filter((vehicle) => !isAssignableVehicle(vehicle)).length,
    [vehicles],
  );

  const resolveLinkedDriver = (vehicle) =>
    drivers.find((driver) =>
      driver.assignedTruckId === vehicle.id
      || driver.assignedTruckId === vehicle.licensePlate
      || (
        vehicle.driver
        && driver.fullName.trim().toLowerCase() === vehicle.driver.trim().toLowerCase()
      )) || null;

  const resolveLinkedRoute = (driver) =>
    routes.find((route) => route.assignedDriver.trim().toLowerCase() === driver.fullName.trim().toLowerCase()) || null;

  const createDriverNotification = async ({ orderNo, truckId, driverName, routeName, previousTruckId }) => {
    await createNotificationRecord({
      title: previousTruckId ? "Truck Assignment Updated" : "Truck Assignment",
      message: previousTruckId
        ? `Order ${orderNo} has been reassigned to truck ${truckId}${driverName ? ` with ${driverName}` : ""}${routeName ? ` on ${routeName}` : ""}.`
        : `Order ${orderNo} has been assigned to truck ${truckId}${driverName ? ` with ${driverName}` : ""}${routeName ? ` on ${routeName}` : ""}.`,
      targetRole: "driver",
      targetTruckId: truckId,
      orderNo,
      type: previousTruckId ? "assignment_updated" : "assignment_created",
    });

    if (previousTruckId && previousTruckId !== truckId) {
      await createNotificationRecord({
        title: "Truck Assignment Removed",
        message: `Order ${orderNo} has been moved away from truck ${previousTruckId}.`,
        targetRole: "driver",
        targetTruckId: previousTruckId,
        orderNo,
        type: "assignment_removed",
      });
    }
  };

  const assignTruck = async (booking) => {
    const selectedTruckId = normalizeIdentifier(selectedTruckByBooking[booking.id] || booking.truckId);
    if (!selectedTruckId) {
      toast.error("Select a truck before saving this assignment.");
      return;
    }

    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedTruckId);
    if (!selectedVehicle) {
      toast.error("The selected truck could not be found.");
      return;
    }

    if (!isAssignableVehicle(selectedVehicle)) {
      toast.error("This truck is not road-ready for assignment right now.");
      return;
    }

    const linkedDriver = resolveLinkedDriver(selectedVehicle);
    const linkedRoute = linkedDriver ? resolveLinkedRoute(linkedDriver) : null;

    setBusyBookingId(booking.id);
    try {
      await updateDoc(doc(db, COLLECTIONS.bookings, booking.id), {
        truckId: selectedVehicle.id,
        assignedDriverId: linkedDriver?.id || "",
        assignedDriverName: linkedDriver?.fullName || "",
        assignedRouteId: linkedRoute?.id || "",
        assignedRouteName: linkedRoute?.routeName || "",
        status: "Truck Assigned - Pending Approval",
        updatedAt: serverTimestamp(),
      });

      await createDriverNotification({
        orderNo: booking.orderNo || booking.id,
        truckId: selectedVehicle.id,
        driverName: linkedDriver?.fullName || "",
        routeName: linkedRoute?.routeName || "",
        previousTruckId: booking.truckId || "",
      });

      await createNotificationRecord({
        title: booking.truckId && booking.truckId !== selectedVehicle.id ? "Truck Reassigned" : "Truck Assigned",
        message: `Order ${booking.orderNo || booking.id} has been assigned to truck ${selectedVehicle.id}${linkedDriver?.fullName ? ` driven by ${linkedDriver.fullName}` : ""}.`,
        targetUid: booking.customerUid,
        targetEmail: booking.customerEmail,
        orderNo: booking.orderNo,
        quotationNo: booking.quotationNo,
        type: booking.truckId && booking.truckId !== selectedVehicle.id ? "truck_reassigned" : "truck_assigned",
      });

      setSelectedTruckByBooking((current) => ({
        ...current,
        [booking.id]: selectedVehicle.id,
      }));
      toast.success(`Truck ${selectedVehicle.id} assigned to order ${booking.orderNo || booking.id}.`);
    } catch (error) {
      toast.error(error?.message || "Failed to assign truck.");
    } finally {
      setBusyBookingId("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Truck Assignments" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fleet Operations</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Truck assignment board</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Match open shipment bookings with road-ready trucks and carry the linked driver and route details into dispatch.
                  </p>
                </div>
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
                  Truck assignments update the same shipment records used by dispatch, drivers, and accounts.
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center gap-3">
                  <ClipboardList className="text-orange-400" size={18} />
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open Shipments</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-white">{pendingBookings.length}</p>
                <p className="mt-2 text-sm text-slate-400">Bookings currently marked as Shipment Booked or Truck Assigned - Pending Approval.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center gap-3">
                  <Truck className="text-emerald-400" size={18} />
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Road-Ready Trucks</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-white">{assignableVehicles.length}</p>
                <p className="mt-2 text-sm text-slate-400">Idle or available units ready to be attached to the next shipment.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-amber-300" size={18} />
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Attention Needed</p>
                </div>
                <p className="mt-3 text-3xl font-bold text-white">{vehicleCountNeedingAttention}</p>
                <p className="mt-2 text-sm text-slate-400">Vehicles blocked by maintenance or current transit status.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <Search className="text-slate-500" size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none"
                  placeholder="Search order no, customer, cargo, status, address, or truck..."
                />
              </label>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-center gap-3">
                <Truck className="text-orange-400" size={18} />
                <h2 className="text-lg font-semibold text-white">Assignment queue</h2>
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-slate-500">Loading shipment bookings...</p>
              ) : filteredBookings.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No Shipment Booked or Truck Assigned - Pending Approval records matched your filters.</p>
              ) : (
                <div className="mt-4 grid gap-4">
                  {filteredBookings.map((booking) => {
                    const chosenTruckId = normalizeIdentifier(selectedTruckByBooking[booking.id] || booking.truckId);
                    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === chosenTruckId) || null;
                    const linkedDriver = selectedVehicle ? resolveLinkedDriver(selectedVehicle) : null;
                    const linkedRoute = linkedDriver ? resolveLinkedRoute(linkedDriver) : null;

                    return (
                      <article key={booking.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Order</p>
                              <p className="mt-2 text-base font-semibold text-white">{booking.orderNo || booking.id}</p>
                              <p className="mt-1 text-sm text-slate-400">{booking.customerName || "Customer pending"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Shipment</p>
                              <p className="mt-2 text-sm font-semibold text-slate-200">{booking.cargo || "Cargo not specified"}</p>
                              <p className="mt-1 text-sm text-slate-400">{booking.weight || "Weight not set"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Status</p>
                              <p className="mt-2 text-sm font-semibold text-amber-300">{booking.status}</p>
                              <p className="mt-1 text-sm text-slate-400">Updated {formatTimestamp(booking)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Delivery Address</p>
                              <p className="mt-2 text-sm text-slate-300">{booking.deliveryAddress}</p>
                            </div>
                          </div>

                          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                              <div>
                                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Assign Truck</p>
                                <select
                                  value={chosenTruckId}
                                  onChange={(event) =>
                                    setSelectedTruckByBooking((current) => ({
                                      ...current,
                                      [booking.id]: event.target.value,
                                    }))
                                  }
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                                >
                                  <option value="">Select road-ready truck</option>
                                  {assignableVehicles.map((vehicle) => (
                                    <option key={vehicle.firestoreId} value={vehicle.id}>
                                      {vehicle.id} · {vehicle.type || "Truck"} · {vehicle.status || "Ready"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => assignTruck(booking)}
                                disabled={!chosenTruckId || busyBookingId === booking.id}
                                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busyBookingId === booking.id ? "Saving..." : booking.truckId ? "Reassign Truck" : "Assign Truck"}
                              </button>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Truck</p>
                                <p className="mt-2 text-sm font-semibold text-white">{selectedVehicle?.id || booking.truckId || "Not selected"}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {selectedVehicle
                                    ? `${selectedVehicle.type || "Truck"} · ${selectedVehicle.location || "No location"}`
                                    : "Choose a truck to review readiness."}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                                <div className="flex items-center gap-2">
                                  <UserRound size={14} className="text-slate-500" />
                                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Linked Driver</p>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-white">{linkedDriver?.fullName || booking.assignedDriverName || "No linked driver"}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {linkedDriver
                                    ? `${linkedDriver.assignmentStatus}${linkedDriver.territory ? ` · ${linkedDriver.territory}` : ""}`
                                    : "Driver will remain blank until this truck is linked to one."}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Route</p>
                                <p className="mt-2 text-sm font-semibold text-white">{linkedRoute?.routeName || booking.assignedRouteName || "No linked route"}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {linkedRoute
                                    ? [linkedRoute.distance, linkedRoute.estimatedTime].filter(Boolean).join(" · ") || "Route attached"
                                    : "Route will populate when the linked driver already has one."}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FleetTruckAssignments;
