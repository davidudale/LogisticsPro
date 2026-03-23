import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  Clock3,
  FileText,
  RefreshCw,
  Truck,
  Users,
} from "lucide-react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";
import { app } from "../Auth/firebase";

const db = getFirestore(app);

const COLLECTIONS = {
  quotations: "Quotations",
  orders: "customer_order",
  customers: "customers",
};

const pendingQuotationStatuses = new Set([
  "pending",
  "save",
  "quotation under negotiation",
  "quotation sent and pending client review",
]);

const closedOrderStatuses = new Set(["delivered", "cancelled", "closed"]);

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatTimestamp = (value) => {
  const timestamp = getTimestampValue(value);
  if (!timestamp) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const mapSnapshotDocs = (snapshot) =>
  snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    quotations: [],
    orders: [],
    customers: [],
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [quotationSnap, orderSnap, customerSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.quotations)),
        getDocs(collection(db, COLLECTIONS.orders)),
        getDocs(collection(db, COLLECTIONS.customers)),
      ]);

      setDashboardData({
        quotations: mapSnapshotDocs(quotationSnap),
        orders: mapSnapshotDocs(orderSnap),
        customers: mapSnapshotDocs(customerSnap),
      });
    } catch (error) {
      console.error("[Firestore][StaffDashboard] Failed loading dashboard collections", {
        collections: Object.values(COLLECTIONS),
        error,
      });
      toast.error(error?.message || "Failed to load operations dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const pendingQuotations = dashboardData.quotations.filter((quotation) =>
      pendingQuotationStatuses.has(
        (quotation.status || "").toString().trim().toLowerCase(),
      ),
    ).length;

    const activeOrders = dashboardData.orders.filter(
      (order) =>
        !closedOrderStatuses.has(
          (order.status || "").toString().trim().toLowerCase(),
        ),
    ).length;

    const negotiationQueue = dashboardData.quotations.filter(
      (quotation) =>
        (quotation.status || "").toString().trim().toLowerCase() ===
        "quotation under negotiation",
    ).length;

    const orderAttention = dashboardData.orders.filter((order) => {
      const status = (order.status || "").toString().trim().toLowerCase();
      return status === "pending" || status === "processing" || status === "booked";
    }).length;

    const recentActivity = [
      ...dashboardData.quotations.map((quotation) => ({
        id: `quotation:${quotation.id}`,
        title: quotation.quotationNo || quotation.id,
        subtitle:
          quotation.customerName ||
          quotation.customerEmail ||
          "Quotation request",
        status: quotation.status || "Pending",
        type: "Quotation",
        updatedAt: quotation.updatedAt || quotation.createdAt,
      })),
      ...dashboardData.orders.map((order) => ({
        id: `order:${order.id}`,
        title: order.orderNo || order.id,
        subtitle: order.customerName || order.customerEmail || "Shipment order",
        status: order.status || "Created",
        type: "Order",
        updatedAt: order.updatedAt || order.createdAt,
      })),
    ]
      .sort(
        (left, right) =>
          getTimestampValue(right.updatedAt) - getTimestampValue(left.updatedAt),
      )
      .slice(0, 6);

    return {
      pendingQuotations,
      activeOrders,
      negotiationQueue,
      orderAttention,
      totalCustomers: dashboardData.customers.length,
      recentActivity,
    };
  }, [dashboardData]);

  const statCards = [
    {
      label: "Pending Quotations",
      value: metrics.pendingQuotations,
      detail: "Requests waiting for ops review or pricing action",
      icon: FileText,
      tone: "text-orange-300",
    },
    {
      label: "Active Orders",
      value: metrics.activeOrders,
      detail: "Shipment orders still moving through execution",
      icon: Truck,
      tone: "text-emerald-300",
    },
    {
      label: "Negotiation Queue",
      value: metrics.negotiationQueue,
      detail: "Quotations requiring customer follow-up",
      icon: ClipboardList,
      tone: "text-sky-300",
    },
    {
      label: "Customer Accounts",
      value: metrics.totalCustomers,
      detail: "Customer records currently available to operations",
      icon: Users,
      tone: "text-white",
    },
  ];

  const quickActions = [
    {
      label: "Pending Quotations",
      description: "Review incoming requests and move approved pricing forward.",
      to: "/admin/pendingQuotation",
    },
    {
      label: "Quotation History",
      description: "Inspect completed, drafted, and negotiated quotation records.",
      to: "/admin/quotationsHistory",
    },
    {
      label: "Shipment Orders",
      description: "Track booking progress and operational order execution.",
      to: "/admin/orders",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Staff Console" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50">
              <div className="relative px-6 py-7 lg:px-8">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_62%)]" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Operations Workspace
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-white lg:text-4xl">
                      Dispatch And Quotation Oversight
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 lg:text-base">
                      Keep quotation queues moving, monitor order pressure, and stay
                      ahead of customer-facing workflow bottlenecks from one screen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-400 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <RefreshCw
                      size={16}
                      className={loading ? "animate-spin" : ""}
                    />
                    {loading ? "Refreshing..." : "Refresh Snapshot"}
                  </button>
                </div>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, detail, icon: Icon, tone }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {label}
                    </p>
                    <Icon size={18} className="text-orange-400" />
                  </div>
                  <p className={`mt-3 text-3xl font-bold ${tone}`}>
                    {loading ? "--" : value}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{detail}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} className="text-orange-400" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Quick Actions
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Operations Shortcuts
                    </h2>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => navigate(action.to)}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-orange-500/30 hover:bg-slate-900/80"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {action.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight size={18} className="mt-1 shrink-0 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-3">
                  <Clock3 size={18} className="text-orange-400" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Recent Activity
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Latest Ops Changes
                    </h2>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
                      Building the latest operations snapshot...
                    </div>
                  ) : metrics.recentActivity.length ? (
                    metrics.recentActivity.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {entry.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {entry.subtitle}
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-300">
                            {entry.type}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span>{entry.status}</span>
                          <span>{formatTimestamp(entry.updatedAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
                      No operations activity is available yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Orders Needing Attention
                  </p>
                  <Truck size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-white">
                  {loading ? "--" : metrics.orderAttention}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Pending, processing, or booked orders still in motion.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Negotiation Pressure
                  </p>
                  <Activity size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-sky-300">
                  {loading ? "--" : metrics.negotiationQueue}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Quotations currently waiting on negotiation follow-up.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
