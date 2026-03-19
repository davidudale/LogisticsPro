import React, { useState } from "react";
import { Box, Printer } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import InvoicePreviewModal from "../Shared/InvoicePreviewModal.jsx";

const ShipmentOrdersSection = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const {
    loading,
    filteredOrders,
    user,
    formatLocation,
    formatDimensions,
  } = useOutletContext();

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
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-slate-900/80">
              <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.12em] text-slate-400">
                <th className="px-3 py-3">Order No</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Origin</th>
                <th className="px-3 py-3">Destination</th>
                <th className="px-3 py-3">Cargo</th>
                <th className="px-3 py-3">Weight</th>
                <th className="px-3 py-3">Dimensions</th>
                <th className="px-3 py-3">ETA</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-800/80 align-top hover:bg-slate-900/30">
                  <td className="px-3 py-4 font-semibold text-white">{order.orderNo || "Order"}</td>
                  <td className="px-3 py-4">
                    <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                      {order.status || "Created"}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-slate-300">
                    {order.customerName || user?.displayName || "Customer"}
                  </td>
                  <td className="px-3 py-4 text-slate-300">{formatLocation(order.origin)}</td>
                  <td className="px-3 py-4 text-slate-300">{formatLocation(order.destination)}</td>
                  <td className="px-3 py-4 text-slate-300">{order.cargo || "Not specified"}</td>
                  <td className="px-3 py-4 text-slate-300">{order.weight || "Not specified"}</td>
                  <td className="px-3 py-4 text-slate-300">
                    {formatDimensions(order.dimensions)}
                    <p className="mt-1 text-xs text-slate-500">Qty: {order.itemQuantity || 1}</p>
                  </td>
                  <td className="px-3 py-4 text-slate-300">{order.eta || "Pending Confirmation"}</td>
                  <td className="px-3 py-4">
                    {order.status === "Invoice sent" ? (
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(order)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800"
                      >
                        <Printer size={14} />
                        Print
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Not available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <InvoicePreviewModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </>
  );
};

export default ShipmentOrdersSection;
