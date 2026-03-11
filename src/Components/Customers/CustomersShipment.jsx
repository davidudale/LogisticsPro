import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { PackageSearch, MapPin, Truck, Weight, Box } from "lucide-react";
import { toast } from "react-toastify";
import { app } from "../Auth/firebase";
import { useAuth } from "../Auth/AuthContext.jsx";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";

const db = getFirestore(app);

const formatLocation = (location) => {
  if (!location || typeof location !== "object") return "Not available";
  return [location.address, location.lga, location.state, location.country].filter(Boolean).join(", ");
};

const formatDimensions = (dimensions) => {
  if (!dimensions) return "Not specified";
  if (typeof dimensions === "string") return dimensions;
  const { lengthCm, widthCm, heightCm } = dimensions;
  return [lengthCm, widthCm, heightCm].every(Boolean)
    ? `${lengthCm} x ${widthCm} x ${heightCm} cm`
    : "Not specified";
};

const CustomersShipment = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryValue, setQueryValue] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.uid && !user?.email) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ordersRef = collection(db, "customer_orders");
        const [uidSnap, emailSnap] = await Promise.all([
          user?.uid ? getDocs(query(ordersRef, where("customerUid", "==", user.uid))) : Promise.resolve(null),
          user?.email ? getDocs(query(ordersRef, where("customerEmail", "==", user.email))) : Promise.resolve(null),
        ]);

        const records = new Map();
        [uidSnap, emailSnap].forEach((snapshot) => {
          snapshot?.docs.forEach((item) => {
            records.set(item.id, { id: item.id, ...item.data() });
          });
        });

        setOrders(Array.from(records.values()));
      } catch (error) {
        toast.error(error?.message || "Failed to load customer orders.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user?.uid, user?.email]);

  const filteredOrders = useMemo(() => {
    const value = queryValue.trim().toLowerCase();
    if (!value) return orders;

    return orders.filter((order) =>
      [
        order.orderNo,
        order.customerName,
        order.status,
        order.cargo,
        order.origin?.state,
        order.destination?.state,
      ]
        .filter(Boolean)
        .some((item) => item.toLowerCase().includes(value))
    );
  }, [orders, queryValue]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="My Shipments" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer Orders</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Shipment Requests</h1>
              <p className="mt-2 text-sm text-slate-400">
                Review all order requests submitted from your customer account.
              </p>
            </header>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                  <PackageSearch size={16} className="text-slate-500" />
                  <input
                    value={queryValue}
                    onChange={(event) => setQueryValue(event.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none"
                    placeholder="Search by order no, cargo, status, or state..."
                  />
                </div>
                <div className="text-sm text-slate-400">
                  {loading ? "Loading orders..." : `${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"}`}
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-8 text-center text-sm text-slate-400">
                  Fetching your shipment requests...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center">
                  <p className="text-base font-semibold text-white">No shipment requests found.</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Create a new order from your dashboard to see it here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredOrders.map((order) => (
                    <article key={order.id} className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-semibold text-white">{order.orderNo || "Order"}</h2>
                            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                              {order.status || "Created"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">{order.customerName || user?.displayName || "Customer"}</p>
                        </div>
                        <div className="text-sm text-slate-400">
                          ETA: <span className="text-slate-200">{order.eta || "Pending Confirmation"}</span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <MapPin size={16} className="text-orange-400" />
                            Origin
                          </div>
                          <p className="mt-2 text-sm text-slate-300">{formatLocation(order.origin)}</p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Truck size={16} className="text-orange-400" />
                            Destination
                          </div>
                          <p className="mt-2 text-sm text-slate-300">{formatLocation(order.destination)}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Box size={16} className="text-orange-400" />
                            Cargo
                          </div>
                          <p className="mt-2 text-sm text-slate-300">{order.cargo || "Not specified"}</p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Weight size={16} className="text-orange-400" />
                            Weight
                          </div>
                          <p className="mt-2 text-sm text-slate-300">{order.weight || "Not specified"}</p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <PackageSearch size={16} className="text-orange-400" />
                            Dimensions
                          </div>
                          <p className="mt-2 text-sm text-slate-300">{formatDimensions(order.dimensions)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Quantity: {order.itemQuantity || 1}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomersShipment;
