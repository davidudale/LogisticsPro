import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Boxes,
  ClipboardList,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserCog,
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
  users: "users",
  fleetVehicles: "fleet_vehicles",
};

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

const pendingQuotationStatuses = new Set([
  "pending",
  "save",
  "quotation under negotiation",
  "quotation sent and pending client review",
]);

const closedOrderStatuses = new Set(["delivered", "cancelled", "closed"]);

const mapSnapshotDocs = (snapshot) =>
  snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    quotations: [],
    orders: [],
    customers: [],
    users: [],
    fleetVehicles: [],
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [quotationSnap, orderSnap, customerSnap, userSnap, fleetSnap] =
        await Promise.all([
          getDocs(collection(db, COLLECTIONS.quotations)),
          getDocs(collection(db, COLLECTIONS.orders)),
          getDocs(collection(db, COLLECTIONS.customers)),
          getDocs(collection(db, COLLECTIONS.users)),
          getDocs(collection(db, COLLECTIONS.fleetVehicles)),
        ]);

      setDashboardData({
        quotations: mapSnapshotDocs(quotationSnap),
        orders: mapSnapshotDocs(orderSnap),
        customers: mapSnapshotDocs(customerSnap),
        users: mapSnapshotDocs(userSnap),
        fleetVehicles: mapSnapshotDocs(fleetSnap),
      });
    } catch (error) {
      console.error("[Firestore][AdminDashboard] Failed loading dashboard collections", {
        collections: Object.values(COLLECTIONS),
        error,
      });
      toast.error(error?.message || "Failed to load admin dashboard.");
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

    const verifiedUsers = dashboardData.users.filter(
      (user) => user.emailVerified === true,
    ).length;
    const activeFleet = dashboardData.fleetVehicles.filter(
      (vehicle) =>
        (vehicle.status || "").toString().trim().toLowerCase() !== "inactive",
    ).length;

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
      ...dashboardData.users.map((user) => ({
        id: `user:${user.id}`,
        title: user.fullName || user.name || user.email || user.id,
        subtitle: user.email || "User profile",
        status: user.role || "No role",
        type: "User",
        updatedAt: user.updatedAt || user.createdAt,
      })),
    ]
      .sort(
        (left, right) =>
          getTimestampValue(right.updatedAt) -
          getTimestampValue(left.updatedAt),
      )
      .slice(0, 7);

    return {
      pendingQuotations,
      activeOrders,
      totalCustomers: dashboardData.customers.length,
      activeFleet,
      verifiedUsers,
      totalUsers: dashboardData.users.length,
      recentActivity,
    };
  }, [dashboardData]);

  const statCards = [
    {
      label: "Pending Quotations",
      value: metrics.pendingQuotations,
      detail: "Needs review or pricing follow-up",
      icon: ClipboardList,
      tone: "text-orange-300",
    },
    {
      label: "Active Orders",
      value: metrics.activeOrders,
      detail: "Open shipment work in progress",
      icon: Activity,
      tone: "text-emerald-300",
    },
    {
      label: "Fleet Availability",
      value: metrics.activeFleet,
      detail: "Vehicles not marked inactive",
      icon: Truck,
      tone: "text-sky-300",
    },
    {
      label: "Customer Accounts",
      value: metrics.totalCustomers,
      detail: `${metrics.verifiedUsers}/${metrics.totalUsers} verified user profiles`,
      icon: Users,
      tone: "text-white",
    },
  ];

  const quickActions = [
    {
      label: "Pending Quotations",
      description: "Review pricing requests and move the queue forward.",
      to: "/admin/pendingQuotation",
    },
    {
      label: "Shipment Orders",
      description: "Check order progress, assignments, and live execution.",
      to: "/admin/orders",
    },
    {
      label: "Fleet Management",
      description: "Inspect assets, readiness, and maintenance pressure.",
      to: "/admin/fleet",
    },
    {
      label: "Users Management",
      description: "Adjust access and keep role coverage current.",
      to: "/admin/users",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar
        title="Admin Dashboard"
        onToggleSidebar={() => setSidebarOpen(true)}
      />
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
                      Control Center
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-white lg:text-4xl">
                      Executive Operations Overview
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 lg:text-base">
                      Keep quotations moving, watch fleet readiness, and monitor
                      customer-facing execution from one admin workspace.
                    </p>
                  </div>
                  {/*<button
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
                  </button>*/}
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

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Quick Actions
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Operational Shortcuts
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-100 transition hover:border-orange-400 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <RefreshCw
                      size={16}
                      className={loading ? "animate-spin" : ""}
                    />
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
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
                      Live Feed
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Recent Activity
                    </h2>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
                      Building the latest admin activity snapshot...
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
                      No admin activity is available yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Verified Users
                  </p>
                  <UserCog size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-white">
                  {loading ? "--" : metrics.verifiedUsers}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Profiles with confirmed email access.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Total Users
                  </p>
                  <Users size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-white">
                  {loading ? "--" : metrics.totalUsers}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Access-bearing profiles across the platform.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Fleet Assets
                  </p>
                  <Boxes size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-white">
                  {loading ? "--" : dashboardData.fleetVehicles.length}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Total tracked vehicles in the system.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Security Coverage
                  </p>
                  <ShieldCheck size={18} className="text-orange-400" />
                </div>
                <p className="mt-3 text-3xl font-bold text-emerald-300">
                  {loading || !metrics.totalUsers
                    ? "--"
                    : `${Math.round((metrics.verifiedUsers / metrics.totalUsers) * 100)}%`}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Share of user profiles already verified.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
