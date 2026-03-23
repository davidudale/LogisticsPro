import React, { useMemo, useState } from "react";
import { ArrowRight, Box, CreditCard, Printer, ShieldCheck } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import InvoicePreviewModal from "../Shared/InvoicePreviewModal.jsx";
import { startPaystackOrderPayment } from "../../Services/paystack.js";

const ShipmentOrdersSection = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const {
    loading,
    filteredOrders,
    user,
    formatLocation,
    formatDimensions,
  } = useOutletContext();
  const formatStateName = (location) => location?.state || "Not available";
  const getTimestampValue = (value) => {
    if (!value) return 0;
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (typeof value?.seconds === "number") return value.seconds * 1000;
    const parsedValue = new Date(value).getTime();
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  };
  const formatTimestamp = (order) => {
    const rawValue = order.updatedAt || order.createdAt;
    const timestampValue = getTimestampValue(rawValue);
    if (!timestampValue) return "Not available";
    return new Intl.DateTimeFormat("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestampValue));
  };
  const formatDuration = (minutes) => {
    const numericMinutes = Number(minutes) || 0;
    if (!numericMinutes) return "Not available";
    if (numericMinutes < 60) return `${numericMinutes} mins`;

    const hours = Math.floor(numericMinutes / 60);
    const remainingMinutes = numericMinutes % 60;
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };
  const sortedOrders = useMemo(
    () => [...filteredOrders].sort(
      (left, right) =>
        getTimestampValue(right.updatedAt || right.createdAt)
        - getTimestampValue(left.updatedAt || left.createdAt),
    ),
    [filteredOrders],
  );

  const openPaymentModal = (order) => {
    setPaymentOrder(order);
  };

  const closePaymentModal = () => {
    setPaymentOrder(null);
  };

  const handleSubmitPayment = async () => {
    if (!paymentOrder) return;

    setSavingPayment(true);

    try {
      await startPaystackOrderPayment({
        order: paymentOrder,
        user,
        onVerifyStart: () => {
          toast.info("Payment received. Verifying securely with Paystack...");
        },
      });
      toast.success("Payment verified successfully.");
      closePaymentModal();
    } catch (error) {
      if (error?.message === "Payment was cancelled.") {
        toast.info("Payment was cancelled.");
      } else {
        toast.error(error?.message || "Failed to complete Paystack payment.");
      }
    } finally {
      setSavingPayment(false);
    }
  };

  return loading ? (
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
    <>
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
      <div className="flex items-center gap-2">
        <Box size={18} className="text-orange-400" />
        <h3 className="text-lg font-semibold text-white">Shipment Requests</h3>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Track created orders with their route, cargo details, dimensions, and ETA.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
        <div className="max-h-[58vh] overflow-auto pr-3">
          <table className="min-w-[1280px] w-full text-left text-sm">
            <thead className="bg-slate-900/80">
              <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.12em] text-slate-400">
                <th className="px-3 py-3">Order No</th>
                <th className="px-3 py-3">Last Updated</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Origin</th>
                <th className="px-3 py-3">Destination</th>
                <th className="px-3 py-3">Cargo</th>
                <th className="px-3 py-3">Weight</th>
                <th className="px-3 py-3">Dimensions</th>
                <th className="px-3 py-3">Route Data</th>
                <th className="px-3 py-3">ETA</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => {
                const isPaid = (order.paymentStatus || "").toString().trim().toLowerCase() === "paid";

                return (
                  <tr key={order.id} className="border-b border-slate-800/80 align-top hover:bg-slate-900/30">
                  <td className="px-3 py-4 font-semibold text-white">{order.orderNo || "Order"}</td>
                  <td className="px-3 py-4 text-slate-300">{formatTimestamp(order)}</td>
                  <td className="px-3 py-4">
                    <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                      {order.status || "Created"}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-slate-300">
                    {order.customerName || user?.displayName || "Customer"}
                  </td>
                  <td className="px-3 py-4 text-slate-300">{formatStateName(order.origin)}</td>
                  <td className="px-3 py-4 text-slate-300">{formatStateName(order.destination)}</td>
                  <td className="px-3 py-4 text-slate-300">{order.cargo || "Not specified"}</td>
                  <td className="px-3 py-4 text-slate-300">{order.weight || "Not specified"}</td>
                  <td className="px-3 py-4 text-slate-300">
                    {formatDimensions(order.dimensions)}
                    <p className="mt-1 text-xs text-slate-500">Qty: {order.itemQuantity || 1}</p>
                  </td>
                  <td className="px-3 py-4 text-slate-300">
                    {order.routeDistanceKm || order.routeDurationMinutes || order.routeSource ? (
                      <div className="space-y-1">
                        <p className="text-sm text-white">
                          {order.routeDistanceKm ? `${order.routeDistanceKm} km` : "Distance pending"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Drive time: {formatDuration(order.routeDurationMinutes)}
                        </p>
                        <p className="text-xs uppercase tracking-[0.12em] text-emerald-300">
                          {order.routeSource === "google-routes" ? "Google Routes" : "Internal Route"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Not available</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-slate-300">{order.eta || "Pending Confirmation"}</td>
                  <td className="px-3 py-4">
                    {order.status === "Shipment Booked" || !isPaid ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(order)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800"
                        >
                          <Printer size={14} />
                          Print
                        </button>
                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(order)}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
                          >
                            <CreditCard size={14} />
                            Pay Now
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Not available</span>
                    )}
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <InvoicePreviewModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    {paymentOrder ? (
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4">
        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment Submission</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Pay {paymentOrder.orderNo || "Shipment Order"}</h3>
              <p className="mt-2 text-sm text-slate-400">
                Review the shipment billing details below before continuing to secure checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={closePaymentModal}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-slate-900/90 to-slate-950 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Amount Due</p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    NGN {Number(paymentOrder.quoteTotal || 0).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    This checkout covers the current invoice total for the shipment below.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
                  <CreditCard size={20} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Billing Email</p>
                <p className="mt-2 font-semibold text-white">{user?.email || paymentOrder.customerEmail || "Not available"}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Payment Status</p>
                <p className="mt-2 font-semibold text-white">{paymentOrder.paymentStatus || "Unpaid"}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Cargo</p>
                <p className="mt-2 font-semibold text-white">{paymentOrder.cargo || "Shipment cargo"}</p>
                <p className="mt-1 text-xs text-slate-500">{paymentOrder.weight || "Weight not provided"}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Destination</p>
                <p className="mt-2 font-semibold text-white">{paymentOrder.deliveryAddress || formatLocation(paymentOrder.destination) || "Not available"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-300" />
                <p className="font-semibold text-white">Secure checkout</p>
              </div>
              <p className="mt-2">
                Continuing opens Paystack in a secure popup. Your shipment is only marked as paid after
                the payment reference is verified and synced back to LogisticsPro.
              </p>
              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
                Use the same email address shown above to keep your payment confirmation aligned with this shipment.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closePaymentModal}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={savingPayment}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingPayment ? "Processing..." : (
                  <span className="inline-flex items-center gap-2">
                    Continue to Paystack
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
};

export default ShipmentOrdersSection;
