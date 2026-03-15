import React, { useEffect, useMemo, useState } from "react";
import {
  setDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { PackageSearch, MapPin, Truck, Weight, Box, ReceiptText } from "lucide-react";
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

const CustomersShipment = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryValue, setQueryValue] = useState("");
  const [busyQuotationId, setBusyQuotationId] = useState("");
  const { user } = useAuth();

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
          user?.email ? getDocs(query(ordersRef, where("customerEmail", "==", user.email))) : Promise.resolve(null),
          user?.uid ? getDocs(query(quotationsRef, where("customerUid", "==", user.uid))) : Promise.resolve(null),
          user?.email ? getDocs(query(quotationsRef, where("customerEmail", "==", user.email))) : Promise.resolve(null),
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

  const updateQuotationDecision = async (quotationId, decision) => {
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
          status: "Created",
          quoteTotal: targetQuotation.quoteTotal || 0,
          quotationBreakdown: targetQuotation.quotationBreakdown || {},
          source: "quotation_acceptance",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await updateDoc(doc(db, "Quotations", quotationId), {
        status: decision === "accept" ? "Accepted" : "Rejected",
        customerDecision: decision,
        customerDecisionAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setQuotations((prev) =>
        prev.map((quotation) =>
          quotation.id === quotationId
            ? {
                ...quotation,
                status: decision === "accept" ? "Accepted" : "Rejected",
                customerDecision: decision,
              }
            : quotation,
        ),
      );
      toast.success(
        decision === "accept" ? "Quotation accepted successfully." : "Quotation rejected.",
      );
    } catch (error) {
      toast.error(error?.message || "Failed to update quotation decision.");
    } finally {
      setBusyQuotationId("");
    }
  };

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
                  {loading ? "Loading records..." : `${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"} • ${filteredQuotations.length} quotation${filteredQuotations.length === 1 ? "" : "s"}`}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
                <div className="flex items-center gap-2">
                  <ReceiptText size={18} className="text-orange-400" />
                  <h2 className="text-lg font-semibold text-white">My Quotations</h2>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  View pending and confirmed quotations, including totals and pricing breakdowns.
                </p>

                {loading ? (
                  <div className="mt-4 text-sm text-slate-400">Loading your quotations...</div>
                ) : filteredQuotations.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-6 text-center">
                    <p className="text-base font-semibold text-white">No quotations found.</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Submit a quotation request from your dashboard to see it here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4">
                    {filteredQuotations.map((quotation) => {
                      const canRespond = quotation.status === "Quoted";
                      const breakdown = quotation.quotationBreakdown || {};

                      return (
                        <article key={quotation.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-lg font-semibold text-white">
                                  {quotation.quotationNo || "Quotation"}
                                </h3>
                                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                                  {quotation.status || "Pending"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-slate-400">
                                {quotation.customerName || user?.displayName || "Customer"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Quotation total</p>
                              <p className="mt-1 text-2xl font-bold text-white">
                                {formatCurrency(quotation.quoteTotal)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 xl:grid-cols-2">
                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                <MapPin size={16} className="text-orange-400" />
                                Origin
                              </div>
                              <p className="mt-2 text-sm text-slate-300">{formatLocation(quotation.origin)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Truck size={16} className="text-orange-400" />
                                Destination
                              </div>
                              <p className="mt-2 text-sm text-slate-300">{formatLocation(quotation.destination)}</p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Box size={16} className="text-orange-400" />
                                Cargo
                              </div>
                              <p className="mt-2 text-sm text-slate-300">{quotation.cargo || "Not specified"}</p>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Weight size={16} className="text-orange-400" />
                                Weight
                              </div>
                              <p className="mt-2 text-sm text-slate-300">{quotation.weight || "Not specified"}</p>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                <PackageSearch size={16} className="text-orange-400" />
                                Dimensions
                              </div>
                              <p className="mt-2 text-sm text-slate-300">{formatDimensions(quotation.dimensions)}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Quantity: {quotation.itemQuantity || 1}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">Quotation breakdown</p>
                              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                {quotation.status === "Pending" ? "Awaiting admin pricing" : "Customer review"}
                              </p>
                            </div>
                            {quotation.status === "Pending" && !quotation.quoteTotal ? (
                              <p className="mt-3 text-sm text-slate-400">
                                Your request is still pending admin review and pricing.
                              </p>
                            ) : (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Base transport</span><span>{formatCurrency(breakdown.baseTransport)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Vehicle capacity</span><span>{formatCurrency(breakdown.capacityCharge)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Weight / volume</span><span>{formatCurrency(breakdown.weightCharge)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Fuel</span><span>{formatCurrency(breakdown.fuelCost)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Tolls</span><span>{formatCurrency(breakdown.tollFees)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Urgency</span><span>{formatCurrency(breakdown.urgencyCost)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Handling</span><span>{formatCurrency(breakdown.handlingCost)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Insurance</span><span>{formatCurrency(breakdown.insuranceCost)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Driver cost</span><span>{formatCurrency(breakdown.driverCost)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Maintenance</span><span>{formatCurrency(breakdown.maintenanceCost)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300"><span>Additional services</span><span>{formatCurrency(breakdown.additionalServicesCost)}</span></div>
                                <div className="flex justify-between rounded-lg bg-slate-900/60 px-3 py-2 text-sm font-semibold text-white"><span>Total</span><span>{formatCurrency(quotation.quoteTotal || breakdown.total)}</span></div>
                              </div>
                            )}
                          </div>

                          {canRespond ? (
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => updateQuotationDecision(quotation.id, "accept")}
                                disabled={busyQuotationId === quotation.id}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                              >
                                {busyQuotationId === quotation.id ? "Saving..." : "Accept quotation"}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateQuotationDecision(quotation.id, "reject")}
                                disabled={busyQuotationId === quotation.id}
                                className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-70"
                              >
                                {busyQuotationId === quotation.id ? "Saving..." : "Reject quotation"}
                              </button>
                            </div>
                          ) : quotation.customerDecision ? (
                            <p className="mt-5 text-sm text-slate-400">
                              You have already {quotation.customerDecision === "accept" ? "accepted" : "rejected"} this quotation.
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
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
