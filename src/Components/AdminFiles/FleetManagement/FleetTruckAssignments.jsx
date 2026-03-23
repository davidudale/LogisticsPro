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
  return [
    "shipment booked",
    "shipment- in transit",
    "truck assigned - pending approval",
    "truck assigned- pending approval",
  ].includes(normalized);
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
          console.error("[Firestore][FleetTruckAssignments] Failed watching collection", {
            collection: COLLECTIONS.bookings,
            error,
          });
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
          console.error("[Firestore][FleetTruckAssignments] Failed watching collection", {
            collection: COLLECTIONS.vehicles,
            error,
          });
          toast.error(error?.message || "Failed to load fleet vehicles.");
        },
      ),
      onSnapshot(
        collection(db, COLLECTIONS.drivers),
        (snapshot) => {
          setDrivers(snapshot.docs.map(mapDriverRecord).filter((driver) => driver.fullName));
        },
        (error) => {
          console.error("[Firestore][FleetTruckAssignments] Failed watching collection", {
            collection: COLLECTIONS.drivers,
            error,
          });
          toast.error(error?.message || "Failed to load fleet drivers.");
        },
      ),
      onSnapshot(
        collection(db, COLLECTIONS.routes),
        (snapshot) => {
          setRoutes(snapshot.docs.map(mapRouteRecord).filter((route) => route.routeName));
        },
        (error) => {
          console.error("[Firestore][FleetTruckAssignments] Failed watching collection", {
            collection: COLLECTIONS.routes,
            error,
          });
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
                 
              </div>
              </div>
            </header>

            
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
                <p className="mt-4 text-sm text-slate-500">No Shipment Booked, Shipment- In Transit, or Truck Assigned - Pending Approval records matched your filters.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[1380px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                        <th className="px-3 py-3">Order</th>
                        <th className="px-3 py-3">Customer</th>
                        <th className="px-3 py-3">Shipment</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Delivery</th>
                        <th className="px-3 py-3">Assign Truck</th>
                        <th className="px-3 py-3">Selected Truck</th>
                        <th className="px-3 py-3">Linked Driver</th>
                        <th className="px-3 py-3">Route</th>
                        <th className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => {
                        const chosenTruckId = normalizeIdentifier(selectedTruckByBooking[booking.id] || booking.truckId);
                        const selectedVehicle = vehicles.find((vehicle) => vehicle.id === chosenTruckId) || null;
                        const linkedDriver = selectedVehicle ? resolveLinkedDriver(selectedVehicle) : null;
                        const linkedRoute = linkedDriver ? resolveLinkedRoute(linkedDriver) : null;

                        return (
                          <tr key={booking.id} className="border-b border-slate-800/80 align-top hover:bg-slate-900/20">
                            <td className="px-3 py-4">
                              <p className="font-semibold text-white">{booking.orderNo || booking.id}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatTimestamp(booking)}</p>
                            </td>
                            <td className="px-3 py-4 text-slate-300">
                              {booking.customerName || "Customer pending"}
                            </td>
                            <td className="px-3 py-4">
                              <p className="font-semibold text-slate-200">{booking.cargo || "Cargo not specified"}</p>
                              <p className="mt-1 text-xs text-slate-500">{booking.weight || "Weight not set"}</p>
                            </td>
                            <td className="px-3 py-4">
                              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-slate-300">
                              <div className="max-w-[220px] whitespace-normal">
                                {booking.deliveryAddress}
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <select
                                value={chosenTruckId}
                                onChange={(event) =>
                                  setSelectedTruckByBooking((current) => ({
                                    ...current,
                                    [booking.id]: event.target.value,
                                  }))
                                }
                                className="w-full min-w-[220px] rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                              >
                                <option value="">Select road-ready truck</option>
                                {assignableVehicles.map((vehicle) => (
                                  <option key={vehicle.firestoreId} value={vehicle.id}>
                                    {vehicle.id} · {vehicle.type || "Truck"} · {vehicle.status || "Ready"}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-4">
                              <p className="font-semibold text-white">{selectedVehicle?.id || booking.truckId || "Not selected"}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {selectedVehicle
                                  ? `${selectedVehicle.type || "Truck"} · ${selectedVehicle.location || "No location"}`
                                  : "Choose a truck to review readiness."}
                              </p>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex items-start gap-2">
                                <UserRound size={14} className="mt-0.5 shrink-0 text-slate-500" />
                                <div>
                                  <p className="font-semibold text-white">{linkedDriver?.fullName || booking.assignedDriverName || "No linked driver"}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {linkedDriver
                                      ? `${linkedDriver.assignmentStatus}${linkedDriver.territory ? ` · ${linkedDriver.territory}` : ""}`
                                      : "Driver stays blank until this truck is linked to one."}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <p className="font-semibold text-white">{linkedRoute?.routeName || booking.assignedRouteName || "No linked route"}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {linkedRoute
                                  ? [linkedRoute.distance, linkedRoute.estimatedTime].filter(Boolean).join(" · ") || "Route attached"
                                  : "Route will populate when the linked driver already has one."}
                              </p>
                            </td>
                            <td className="px-3 py-4">
                              <button
                                type="button"
                                onClick={() => assignTruck(booking)}
                                disabled={!chosenTruckId || busyBookingId === booking.id}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busyBookingId === booking.id ? "Saving..." : booking.truckId ? "Reassign Truck" : "Assign Truck"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
