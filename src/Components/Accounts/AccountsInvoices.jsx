import React, { useMemo, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import InvoicePreviewModal from "../Shared/InvoicePreviewModal.jsx";

const AccountsInvoices = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { loading, invoiceOrders, formatCurrency, formatLocation, formatTimestamp } = useOutletContext();

  const sortedInvoices = useMemo(
    () => [...invoiceOrders].sort((left, right) => (right.quoteTotal || 0) - (left.quoteTotal || 0)),
    [invoiceOrders],
  );

  return (
    <>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-orange-400" />
          <h2 className="text-lg font-semibold text-white">Invoices</h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Review invoice-ready shipment orders and open the print preview when a customer copy is needed.
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800">
          <div className="max-h-[65vh] overflow-auto">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="bg-slate-950/90">
                <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-4 py-3">Order No</th>
                  <th className="px-4 py-3">Quotation</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Invoice Total</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Loading invoices...
                    </td>
                  </tr>
                ) : sortedInvoices.length ? (
                  sortedInvoices.map((order) => (
                    <tr key={order.id} className="align-top hover:bg-slate-900/30">
                      <td className="px-4 py-4 font-semibold text-white">{order.orderNo || "Order"}</td>
                      <td className="px-4 py-4 text-slate-300">{order.quotationNo || "Not available"}</td>
                      <td className="px-4 py-4 text-slate-300">
                        <p>{order.customerName || "Customer"}</p>
                        <p className="mt-1 text-xs text-slate-500">{order.customerEmail || "No email"}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        <p>{formatLocation(order.origin)}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatLocation(order.destination)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                          {order.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-white">{formatCurrency(order.quoteTotal)}</td>
                      <td className="px-4 py-4 text-slate-400">{formatTimestamp(order.updatedAt || order.createdAt)}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(order)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-orange-500 hover:text-orange-200"
                        >
                          <Printer size={14} />
                          View / Print
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No invoice-ready shipment orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <InvoicePreviewModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </>
  );
};

export default AccountsInvoices;
