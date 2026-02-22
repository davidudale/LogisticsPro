import React, { useMemo, useState } from "react";
import {
  BadgeCheck,
  ClipboardList,
  MapPin,
  Truck,
  UserRound,
} from "lucide-react";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const mockDrivers = [
  { id: "drv-01", name: "A. Musa", vehicle: "TRK-221" },
  { id: "drv-02", name: "B. Okoro", vehicle: "TRK-109" },
  { id: "drv-03", name: "C. Sule", vehicle: "TRK-334" },
];

const statusSteps = [
  { key: "created", label: "Order Created" },
  { key: "assigned", label: "Assigned to Truck" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

const OrderManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    customer: "",
    origin: "",
    destination: "",
    driverId: "",
  });
  const [trackingId, setTrackingId] = useState("");
  const [feedback, setFeedback] = useState({ rating: "", notes: "" });

  const selectedDriver = useMemo(
    () => mockDrivers.find((d) => d.id === form.driverId),
    [form.driverId],
  );

  const createOrder = (event) => {
    event.preventDefault();
    if (!form.customer || !form.origin || !form.destination) return;

    const newOrder = {
      id: `ORD-${Date.now()}`,
      customer: form.customer,
      origin: form.origin,
      destination: form.destination,
      driverId: form.driverId,
      driverName: selectedDriver?.name || "Unassigned",
      truck: selectedDriver?.vehicle || "Unassigned",
      status: form.driverId ? "assigned" : "created",
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setForm({ customer: "", origin: "", destination: "", driverId: "" });
  };

  const setOrderStatus = (orderId, status) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date().toISOString() }
          : order,
      ),
    );
  };

  const trackedOrder = useMemo(
    () => orders.find((order) => order.id === trackingId.trim()),
    [orders, trackingId],
  );

  return (
    <div className="min-h-screen lp-page-bg">
      <NavBar
        title="Order Management"
        onToggleSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-6xl space-y-8">
            <header className="lp-panel p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Order Management
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-white">
                    Create, assign, and track deliveries
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-amber-300 text-sm">
                  <BadgeCheck size={16} />
                  Live operational overview
                </div>
              </div>
            </header>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <form onSubmit={createOrder} className="lp-panel p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <ClipboardList className="text-amber-400" />
                  <h2 className="text-xl font-semibold text-white">Order creation</h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    Customer name
                    <input
                      value={form.customer}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, customer: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Habiba Logistics"
                      required
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Origin
                    <input
                      value={form.origin}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, origin: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Lagos"
                      required
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Destination
                    <input
                      value={form.destination}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, destination: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Abuja"
                      required
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Assign driver
                    <select
                      value={form.driverId}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, driverId: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                    >
                      <option value="">Unassigned</option>
                      {mockDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} · {driver.vehicle}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <button type="submit" className="lp-button-primary mt-6">
                  Create order
                </button>
              </form>

              <div className="lp-panel p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <Truck className="text-amber-400" />
                  <h2 className="text-xl font-semibold text-white">Assignment</h2>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Assign orders to trucks and view real-time status updates.
                </p>

                <div className="mt-6 space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-sm text-slate-500">No orders yet.</p>
                  ) : (
                    orders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {order.customer}
                            </p>
                            <p className="text-xs text-slate-500">{order.id}</p>
                          </div>
                          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-300">
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          {order.origin} ? {order.destination}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Driver: {order.driverName} · {order.truck}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="lp-panel p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <MapPin className="text-amber-400" />
                  <h2 className="text-xl font-semibold text-white">
                    Real-time tracking
                  </h2>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Enter an order ID to see its current status and live updates.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                    placeholder="e.g. ORD-1700000000000"
                  />
                  <button
                    type="button"
                    className="lp-button-secondary"
                    onClick={() => setTrackingId(trackingId)}
                  >
                    Track
                  </button>
                </div>

                {trackedOrder ? (
                  <div className="mt-6 space-y-4">
                    {statusSteps.map((step) => {
                      const isActive =
                        statusSteps.findIndex((s) => s.key === step.key) <=
                        statusSteps.findIndex((s) => s.key === trackedOrder.status);
                      return (
                        <div
                          key={step.key}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                            isActive
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                              : "border-slate-800 bg-slate-950/60 text-slate-400"
                          }`}
                        >
                          {step.label}
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="lp-button-secondary"
                        onClick={() => setOrderStatus(trackedOrder.id, "in_transit")}
                      >
                        Mark In Transit
                      </button>
                      <button
                        type="button"
                        className="lp-button-primary"
                        onClick={() => setOrderStatus(trackedOrder.id, "delivered")}
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-slate-500">No order selected.</p>
                )}
              </div>

              <div className="lp-panel p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <UserRound className="text-amber-400" />
                  <h2 className="text-xl font-semibold text-white">
                    Delivery confirmation & feedback
                  </h2>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Confirm delivery and capture customer feedback.
                </p>

                <div className="mt-6 space-y-4">
                  <label className="text-sm text-slate-300">
                    Rating
                    <select
                      value={feedback.rating}
                      onChange={(e) =>
                        setFeedback((prev) => ({ ...prev, rating: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                    >
                      <option value="">Select</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="needs_attention">Needs attention</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-300">
                    Notes
                    <textarea
                      rows={4}
                      value={feedback.notes}
                      onChange={(e) =>
                        setFeedback((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                      placeholder="Share delivery feedback"
                    />
                  </label>
                  <button type="button" className="lp-button-primary">
                    Submit feedback
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderManagement;
