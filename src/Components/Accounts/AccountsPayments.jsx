import React, { useMemo, useState } from "react";
import { ClipboardList, Pencil } from "lucide-react";
import { doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useOutletContext } from "react-router-dom";
import { app } from "../Auth/firebase.js";

const db = getFirestore(app);

const emptyPaymentForm = {
  paymentStatus: "unpaid",
  amountPaid: "",
  paymentReference: "",
  paymentDate: "",
  paymentNote: "",
};

const AccountsPayments = () => {
  const {
    loading,
    invoiceOrders,
    formatCurrency,
    formatTimestamp,
    normalizePaymentStatus,
  } = useOutletContext();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [busyOrderId, setBusyOrderId] = useState("");

  const paymentRows = useMemo(
    () => [...invoiceOrders].sort((left, right) => (right.balanceDue || 0) - (left.balanceDue || 0)),
    [invoiceOrders],
  );

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setPaymentForm({
      paymentStatus: normalizePaymentStatus(order.paymentStatus),
      amountPaid: order.amountPaid ? String(order.amountPaid) : "",
      paymentReference: order.paymentReference || "",
      paymentDate: order.paymentDate ? new Date(order.paymentDate?.seconds ? order.paymentDate.seconds * 1000 : order.paymentDate).toISOString().slice(0, 10) : "",
      paymentNote: order.paymentNote || "",
    });
  };

  const closePaymentModal = () => {
    setSelectedOrder(null);
    setPaymentForm(emptyPaymentForm);
  };

  const handleSavePayment = async (event) => {
    event.preventDefault();
    if (!selectedOrder) return;

    const quoteTotal = Number(selectedOrder.quoteTotal || 0);
    const amountPaid = Math.max(Number(paymentForm.amountPaid || 0), 0);
    const normalizedStatus = normalizePaymentStatus(paymentForm.paymentStatus);

    if (amountPaid > quoteTotal) {
      toast.info("Amount paid cannot be greater than the invoice total.");
      return;
    }

    setBusyOrderId(selectedOrder.id);

    try {
      await updateDoc(doc(db, "customer_order", selectedOrder.id), {
        paymentStatus: normalizedStatus,
        amountPaid,
        balanceDue: Math.max(quoteTotal - amountPaid, 0),
        paymentReference: paymentForm.paymentReference.trim(),
        paymentDate: paymentForm.paymentDate || "",
        paymentNote: paymentForm.paymentNote.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Payment record updated.");
      closePaymentModal();
    } catch (error) {
      toast.error(error?.message || "Failed to update payment.");
    } finally {
      setBusyOrderId("");
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-orange-400" />
          <h2 className="text-lg font-semibold text-white">Payments</h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Capture receipts, partial settlements, and outstanding balances against invoice-ready orders.
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800">
          <div className="max-h-[65vh] overflow-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-slate-950/90">
                <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-4 py-3">Order No</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Invoice Total</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Loading payment records...
                    </td>
                  </tr>
                ) : paymentRows.length ? (
                  paymentRows.map((order) => (
                    <tr key={order.id} className="align-top hover:bg-slate-900/30">
                      <td className="px-4 py-4 font-semibold text-white">{order.orderNo || "Order"}</td>
                      <td className="px-4 py-4 text-slate-300">{order.customerName || "Customer"}</td>
                      <td className="px-4 py-4 text-slate-300">{formatCurrency(order.quoteTotal)}</td>
                      <td className="px-4 py-4 text-emerald-300">{formatCurrency(order.amountPaid)}</td>
                      <td className="px-4 py-4 text-orange-300">{formatCurrency(order.balanceDue)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                          order.paymentStatus === "paid"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : order.paymentStatus === "partial"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                              : "border-slate-700 bg-slate-800/80 text-slate-300"
                        }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400">{order.paymentReference || "Not added"}</td>
                      <td className="px-4 py-4 text-slate-400">{formatTimestamp(order.updatedAt || order.createdAt)}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openPaymentModal(order)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-orange-500 hover:text-orange-200"
                        >
                          <Pencil size={14} />
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No payment rows available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {selectedOrder ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment Update</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedOrder.orderNo || "Order payment"}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Invoice total: <span className="font-semibold text-white">{formatCurrency(selectedOrder.quoteTotal)}</span>
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

            <form className="mt-6 space-y-4" onSubmit={handleSavePayment}>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Payment Status</span>
                <select
                  value={paymentForm.paymentStatus}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentStatus: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Amount Paid</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amountPaid}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, amountPaid: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  placeholder="0.00"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Payment Date</span>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reference</span>
                  <input
                    type="text"
                    value={paymentForm.paymentReference}
                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentReference: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Receipt or transfer reference"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Note</span>
                <textarea
                  value={paymentForm.paymentNote}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentNote: event.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  placeholder="Settlement note, receipt source, bank confirmation..."
                />
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyOrderId === selectedOrder.id}
                  className="rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-400 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busyOrderId === selectedOrder.id ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AccountsPayments;
