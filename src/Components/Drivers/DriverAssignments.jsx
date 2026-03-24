import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { ClipboardList, Search, Truck } from "lucide-react";
import { toast } from "react-toastify";
import { app } from "../Auth/firebase";
import { useAuth } from "../Auth/AuthContext.jsx";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";

const db = getFirestore(app);

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

const DriverAssignments = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [queryValue, setQueryValue] = useState("");
  const { user } = useAuth();
  const driverUid = (user?.uid || "").toString().trim();
  const driverName = (user?.displayName || user?.profile?.fullName || user?.profile?.name || "").toString().trim();

  const assignedTruckId = (
    user?.profile?.truckId || user?.profile?.vehicleId || user?.profile?.assignedTruckId || ""
  ).toString().trim();

  useEffect(() => {
    const loadAssignments = async () => {
      if (!assignedTruckId && !driverUid) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const queries = [
          ...(assignedTruckId
            ? [getDocs(query(collection(db, "customer_order"), where("truckId", "==", assignedTruckId)))]
            : []),
          ...(driverUid
            ? [getDocs(query(collection(db, "customer_order"), where("assignedDriverId", "==", driverUid)))]
            : []),
        ];

        const snapshots = await Promise.all(queries);
        const mergedAssignments = new Map();

        snapshots.forEach((snapshot) => {
          snapshot.docs.forEach((item) => {
            mergedAssignments.set(item.id, { id: item.id, ...item.data() });
          });
        });

        setAssignments(
          [...mergedAssignments.values()].filter(
            (item) =>
              (item.status || "").toString().trim().toLowerCase() === "shipment approved - pending pickup",
          ),
        );
      } catch (error) {
        toast.error(error?.message || "Failed to load your assignments.");
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [assignedTruckId, driverUid]);

  const filteredAssignments = useMemo(() => {
    const value = queryValue.trim().toLowerCase();
    const sortByNewest = (items) => [...items].sort(
      (left, right) =>
        getTimestampValue(right.updatedAt || right.createdAt)
        - getTimestampValue(left.updatedAt || left.createdAt),
    );
    if (!value) {
      return sortByNewest(assignments);
    }

    return sortByNewest(assignments.filter((assignment) =>
      [
        assignment.orderNo,
        assignment.customerName,
        assignment.assignedDriverName,
        assignment.status,
        assignment.deliveryAddress,
        assignment.truckId,
      ]
        .filter(Boolean)
        .some((item) => item.toString().toLowerCase().includes(value)),
    ));
  }, [assignments, queryValue]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Assignments" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Driver Tasks</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Pending Pickup Loads</h1>
              <p className="mt-2 text-sm text-slate-400">
                Review shipment orders approved for pickup and mapped to your assigned truck or driver profile.
              </p>
              <p className="mt-4 inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">
                Truck ID: {assignedTruckId || "Not set on profile"}
              </p>
              <p className="mt-3 inline-flex rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                Driver: {driverName || user?.email || driverUid || "Not set on profile"}
              </p>
            </header>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                  <Search size={16} className="text-slate-500" />
                  <input
                    value={queryValue}
                    onChange={(event) => setQueryValue(event.target.value)}
                    className="w-full min-w-[260px] bg-transparent text-sm text-white outline-none"
                    placeholder="Search order no, customer, status, or address..."
                  />
                </div>
                <div className="text-sm text-slate-400">
                  {loading ? "Loading pickup orders..." : `${filteredAssignments.length} pickup order${filteredAssignments.length === 1 ? "" : "s"}`}
                </div>
              </div>

              {!assignedTruckId && !driverUid ? (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center">
                  <p className="text-base font-semibold text-white">No driver assignment context found.</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Add `truckId`, `vehicleId`, or `assignedTruckId` to the driver profile, or assign orders directly to this driver account.
                  </p>
                </div>
              ) : loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-8 text-center text-sm text-slate-400">
                  Fetching approved pickup orders...
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center">
                  <p className="text-base font-semibold text-white">No approved pickup orders found.</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Orders assigned to {driverName || user?.email || "this driver"} or truck {assignedTruckId || "not set"} will appear here once they reach Shipment Approved - Pending Pickup.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-800">
                  <div className="max-h-[65vh] overflow-auto">
                    <table className="min-w-[1000px] w-full text-left text-sm">
                      <thead className="bg-slate-900/80">
                        <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-3 py-3">Order No</th>
                          <th className="px-3 py-3">Last Updated</th>
                          <th className="px-3 py-3">Customer</th>
                          <th className="px-3 py-3">Assigned Driver</th>
                          <th className="px-3 py-3">Truck</th>
                          <th className="px-3 py-3">Delivery Address</th>
                          <th className="px-3 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.map((assignment) => (
                          <tr key={assignment.id} className="border-b border-slate-800/80 hover:bg-slate-900/30">
                            <td className="px-3 py-4 font-semibold text-white">{assignment.orderNo || "Order"}</td>
                            <td className="px-3 py-4 text-slate-400">{formatTimestamp(assignment)}</td>
                            <td className="px-3 py-4 text-slate-300">{assignment.customerName || "Customer"}</td>
                            <td className="px-3 py-4 text-slate-300">{assignment.assignedDriverName || driverName || "Not assigned"}</td>
                            <td className="px-3 py-4 text-slate-300">
                              <span className="inline-flex items-center gap-2">
                                <Truck size={14} className="text-orange-400" />
                                {assignment.truckId || assignedTruckId}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-slate-300">{assignment.deliveryAddress || "Not available"}</td>
                            <td className="px-3 py-4">
                              <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                                {assignment.status || "Created"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverAssignments;
