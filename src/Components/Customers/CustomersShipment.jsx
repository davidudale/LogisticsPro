import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import { PackageSearch } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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

const formatCurrency = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const createOrderNumberFromQuotation = (quotationNo, quotationId) =>
  quotationNo?.startsWith("QT-")
    ? quotationNo.replace("QT-", "ORD-")
    : `ORD-${quotationNo || quotationId}`;

const shipmentSections = [
  { label: "My Quotations", to: "/opsuser/shipments/quotations" },
  { label: "Shipment Requests", to: "/opsuser/shipments/requests" },
];

const CustomersShipment = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryValue, setQueryValue] = useState("");
  const [busyQuotationId, setBusyQuotationId] = useState("");
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const loadCustomerRecords = async () => {
      if (!user?.uid && !user?.email) {
        setOrders([]);
        setQuotations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ordersRef = collection(db, "customer_order");
        const quotationsRef = collection(db, "Quotations");
        const [orderUidSnap, orderEmailSnap, quotationUidSnap, quotationEmailSnap] = await Promise.all([
          user?.uid ? getDocs(query(ordersRef, where("customerUid", "==", user.uid))) : Promise.resolve(null),
          user?.email
            ? getDocs(query(ordersRef, where("customerEmail", "==", user.email)))
            : Promise.resolve(null),
          user?.uid
            ? getDocs(query(quotationsRef, where("customerUid", "==", user.uid)))
            : Promise.resolve(null),
          user?.email
            ? getDocs(query(quotationsRef, where("customerEmail", "==", user.email)))
            : Promise.resolve(null),
        ]);

        const orderRecords = new Map();
        [orderUidSnap, orderEmailSnap].forEach((snapshot) => {
          snapshot?.docs.forEach((item) => {
            orderRecords.set(item.id, { id: item.id, ...item.data() });
          });
        });

        const quotationRecords = new Map();
        [quotationUidSnap, quotationEmailSnap].forEach((snapshot) => {
          snapshot?.docs.forEach((item) => {
            quotationRecords.set(item.id, { id: item.id, ...item.data() });
          });
        });

        setOrders(Array.from(orderRecords.values()));
        setQuotations(Array.from(quotationRecords.values()));
      } catch (error) {
        toast.error(error?.message || "Failed to load your shipment records.");
      } finally {
        setLoading(false);
      }
    };

    loadCustomerRecords();
  }, [user?.uid, user?.email]);

  const filteredOrders = useMemo(() => {
    const acceptedQuotationIds = new Set(
      quotations
        .filter((quotation) => quotation.status === "Quotation Accepted")
        .map((quotation) => quotation.id),
    );
    const value = queryValue.trim().toLowerCase();
    const visibleOrders = orders.filter((order) =>
      order.quotationId ? acceptedQuotationIds.has(order.quotationId) : false,
    );
    if (!value) return visibleOrders;

    return visibleOrders.filter((order) =>
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
  }, [orders, queryValue, quotations]);

  const filteredQuotations = useMemo(() => {
    const value = queryValue.trim().toLowerCase();
    if (!value) return quotations;

    return quotations.filter((quotation) =>
      [
        quotation.quotationNo,
        quotation.customerName,
        quotation.status,
        quotation.cargo,
        quotation.origin?.state,
        quotation.destination?.state,
      ]
        .filter(Boolean)
        .some((item) => item.toLowerCase().includes(value))
    );
  }, [quotations, queryValue]);

  const updateQuotationDecision = async (quotationId, decision, reason = "") => {
    setBusyQuotationId(quotationId);
    try {
      const targetQuotation = quotations.find((quotation) => quotation.id === quotationId);
      if (!targetQuotation) {
        throw new Error("Quotation record not found.");
      }

      if (decision === "accept") {
        const orderNo = createOrderNumberFromQuotation(
          targetQuotation.quotationNo,
          targetQuotation.id,
        );

        await setDoc(doc(db, "customer_order", quotationId), {
          quotationId: targetQuotation.id,
          quotationNo: targetQuotation.quotationNo || "",
          orderNo,
          customerName: targetQuotation.customerName || user?.displayName || "Customer",
          customerUid: user?.uid || targetQuotation.customerUid || "",
          customerEmail: user?.email || targetQuotation.customerEmail || "",
          cargo: targetQuotation.cargo || "",
          weight: targetQuotation.weight || "",
          itemQuantity: targetQuotation.itemQuantity || 1,
          dimensions: targetQuotation.dimensions || {},
          origin: targetQuotation.origin || {},
          destination: targetQuotation.destination || {},
          deliveryAddress: targetQuotation.deliveryAddress || formatLocation(targetQuotation.destination),
          status: "New Order",
          quoteTotal: targetQuotation.quoteTotal || 0,
          quotationBreakdown: targetQuotation.quotationBreakdown || {},
          source: "quotation_acceptance",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await updateDoc(doc(db, "Quotations", quotationId), {
        status: decision === "accept" ? "Quotation Accepted" : "Quotation Under Negotiation",
        customerDecision: decision,
        customerNegotiationReason: decision === "reject" ? reason.trim() : "",
        customerDecisionAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setQuotations((prev) =>
        prev.map((quotation) =>
            quotation.id === quotationId
              ? {
                  ...quotation,
                  status: decision === "accept" ? "Quotation Accepted" : "Quotation Under Negotiation",
                  customerDecision: decision,
                  customerNegotiationReason: decision === "reject" ? reason.trim() : "",
                }
            : quotation,
        ),
      );

      if (decision === "accept") {
        setOrders((prev) => {
          const targetQuotationRecord = quotations.find((quotation) => quotation.id === quotationId);
          if (!targetQuotationRecord || prev.some((order) => order.id === quotationId)) {
            return prev;
          }

          return [
            {
              id: quotationId,
              quotationId: targetQuotationRecord.id,
              quotationNo: targetQuotationRecord.quotationNo || "",
              orderNo: createOrderNumberFromQuotation(
                targetQuotationRecord.quotationNo,
                targetQuotationRecord.id,
              ),
              customerName: targetQuotationRecord.customerName || user?.displayName || "Customer",
              customerUid: user?.uid || targetQuotationRecord.customerUid || "",
              customerEmail: user?.email || targetQuotationRecord.customerEmail || "",
              cargo: targetQuotationRecord.cargo || "",
              weight: targetQuotationRecord.weight || "",
              itemQuantity: targetQuotationRecord.itemQuantity || 1,
              dimensions: targetQuotationRecord.dimensions || {},
              origin: targetQuotationRecord.origin || {},
              destination: targetQuotationRecord.destination || {},
              deliveryAddress:
                targetQuotationRecord.deliveryAddress || formatLocation(targetQuotationRecord.destination),
              status: "New Order",
              quoteTotal: targetQuotationRecord.quoteTotal || 0,
              quotationBreakdown: targetQuotationRecord.quotationBreakdown || {},
              source: "quotation_acceptance",
            },
            ...prev,
          ];
        });
      }

      toast.success(
        decision === "accept"
          ? "Quotation accepted successfully."
          : "Quotation moved to negotiation.",
      );
    } catch (error) {
      toast.error(error?.message || "Failed to update quotation decision.");
    } finally {
      setBusyQuotationId("");
    }
  };

  const activeSection = shipmentSections.find(
    (section) => location.pathname === section.to || location.pathname.startsWith(`${section.to}/`),
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="My Shipments" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/*<header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h1 className="mt-2 text-3xl font-bold text-white">My Shipments</h1>
              

              <div className="mt-5 flex flex-wrap gap-3">
                {shipmentSections.map((section) => (
                  <NavLink
                    key={section.to}
                    to={section.to}
                    className={({ isActive }) =>
                      `rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                          : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-600 hover:text-white"
                      }`
                    }
                  >
                    {section.label}
                  </NavLink>
                ))}
              </div>
            </header>*/}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h1 className="text-lg font-bold text-white">
                    {activeSection?.label || "My Shipments"}
                  </h1>
                  <p className="text-sm text-slate-400">
                    Search across your quotations and shipment records.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                    <PackageSearch size={16} className="text-slate-500" />
                    <input
                      value={queryValue}
                      onChange={(event) => setQueryValue(event.target.value)}
                      className="w-full min-w-[260px] bg-transparent text-sm text-white outline-none"
                      placeholder="Search by order no, cargo, status, or state..."
                    />
                  </div>
                  <div className="text-sm text-slate-400">
                    {loading
                      ? "Loading records..."
                      : `${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"} | ${filteredQuotations.length} quotation${filteredQuotations.length === 1 ? "" : "s"}`}
                  </div>
                </div>
              </div>

              <Outlet
                context={{
                  loading,
                  filteredOrders,
                  filteredQuotations,
                  busyQuotationId,
                  updateQuotationDecision,
                  user,
                  formatLocation,
                  formatDimensions,
                  formatCurrency,
                }}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomersShipment;
