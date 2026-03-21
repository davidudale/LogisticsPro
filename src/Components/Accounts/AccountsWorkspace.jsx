import React, { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, CreditCard, FileText, LayoutDashboard, Sliders } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";
import { app } from "../Auth/firebase.js";
import { useAuth } from "../Auth/AuthContext.jsx";

const db = getFirestore(app);

const accountSections = [
  { label: "Dashboard", to: "/accounts", icon: LayoutDashboard },
  { label: "Invoices", to: "/accounts/invoices", icon: FileText },
  { label: "Payments", to: "/accounts/payments", icon: CreditCard },
  { label: "Preferences", to: "/accounts/settings", icon: Sliders },
];

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
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const formatLocation = (location) => {
  if (!location) return "Not available";
  if (typeof location === "string") return location;
  return [location.address, location.lga, location.state, location.country].filter(Boolean).join(", ") || "Not available";
};

const formatDimensions = (dimensions) => {
  if (!dimensions) return "Not specified";
  if (typeof dimensions === "string") return dimensions;
  const { lengthCm, widthCm, heightCm } = dimensions;
  return [lengthCm, widthCm, heightCm].every(Boolean)
    ? `${lengthCm} x ${widthCm} x ${heightCm} cm`
    : "Not specified";
};

const formatCurrency = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const normalizePaymentStatus = (value) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "partial") return "partial";
  return "unpaid";
};

const mapOrderRecord = (item) => {
  const data = item.data();
  const quoteTotal = Number(data.quoteTotal || data.quotationBreakdown?.total || 0);
  const amountPaid = Number(data.amountPaid || 0);
  const paymentStatus = normalizePaymentStatus(
    data.paymentStatus || (amountPaid >= quoteTotal && quoteTotal > 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid"),
  );

  return {
    id: item.id,
    orderNo: data.orderNo || "",
    quotationNo: data.quotationNo || "",
    customerName: data.customerName || data.customer || "",
    customerEmail: data.customerEmail || "",
    cargo: data.cargo || "",
    truckId: data.truckId || "",
    status: data.status || "Shipment Booking - In Progress",
    origin: data.origin || {},
    destination: data.destination || {},
    eta: data.eta || "",
    itemQuantity: data.itemQuantity || 1,
    dimensions: data.dimensions || {},
    quoteTotal,
    quotationBreakdown: data.quotationBreakdown || {},
    paymentStatus,
    amountPaid,
    balanceDue: Math.max(quoteTotal - amountPaid, 0),
    paymentDate: data.paymentDate || null,
    paymentReference: data.paymentReference || "",
    paymentNote: data.paymentNote || "",
    updatedAt: data.updatedAt || null,
    createdAt: data.createdAt || null,
  };
};

const AccountsWorkspace = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "customer_order"),
      (snapshot) => {
        setOrders(snapshot.docs.map(mapOrderRecord));
        setLoading(false);
      },
      () => {
        setOrders([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const sortedOrders = useMemo(
    () => [...orders].sort(
      (left, right) =>
        getTimestampValue(right.updatedAt || right.createdAt)
        - getTimestampValue(left.updatedAt || left.createdAt),
    ),
    [orders],
  );

  const invoiceOrders = useMemo(
    () =>
      sortedOrders.filter(
        (order) =>
          Number(order.quoteTotal || 0) > 0
          || ["shipment booked", "truck assigned"].includes((order.status || "").toLowerCase()),
      ),
    [sortedOrders],
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Accounts Workspace" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Finance Operations</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">Accounts Control Center</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    Monitor invoice exposure, update payment receipts, and keep shipment billing records aligned.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  Signed in as <span className="font-semibold">{user?.displayName || user?.email || "Accounts user"}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {accountSections.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/accounts"}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "border-orange-500/40 bg-orange-500/15 text-orange-100"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </header>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4 text-sm text-slate-400">
              Current section: <span className="font-semibold text-slate-200">{accountSections.find((item) => location.pathname === item.to)?.label || "Accounts"}</span>
              <span className="mx-2 text-slate-600">|</span>
              Invoice-ready orders: <span className="font-semibold text-slate-200">{invoiceOrders.length}</span>
              <span className="mx-2 text-slate-600">|</span>
              Last sync: <span className="font-semibold text-slate-200">{formatTimestamp(sortedOrders[0]?.updatedAt || sortedOrders[0]?.createdAt)}</span>
            </div>

            <Outlet
              context={{
                user,
                loading,
                orders: sortedOrders,
                invoiceOrders,
                formatCurrency,
                formatLocation,
                formatDimensions,
                formatTimestamp,
                getTimestampValue,
                normalizePaymentStatus,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountsWorkspace;
