import React from "react";
import { downloadInvoicePdf } from "./invoicePdf.js";

const formatCurrency = (value) => `NGN ${Number(value || 0).toLocaleString()}`;
const formatStatus = (value) => value || "Shipment Booked";

const breakdownLabels = [
  ["baseTransport", "Base transport"],
  ["capacityCharge", "Vehicle capacity"],
  ["weightCharge", "Weight / volume"],
  ["fuelCost", "Fuel"],
  ["tollFees", "Tolls"],
  ["urgencyCost", "Urgency"],
  ["handlingCost", "Handling"],
  ["insuranceCost", "Insurance"],
  ["driverCost", "Driver cost"],
  ["maintenanceCost", "Maintenance"],
  ["additionalServicesCost", "Additional services"],
  ["subtotal", "Subtotal"],
  ["peakAdjustment", "Peak adjustment"],
  ["total", "Total quotation"],
];

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

const formatRoute = (order) =>
  order.assignedRouteName
  || order.routeName
  || "Not assigned";

const formatDriver = (order) =>
  order.assignedDriverName
  || order.driverName
  || "Not assigned";

const InvoicePreviewModal = ({ order, onClose }) => {
  if (!order) return null;

  const breakdown = order.quotationBreakdown || {};
  const breakdownRows = breakdownLabels.filter(
    ([key]) => breakdown[key] !== undefined || (key === "total" && order.quoteTotal),
  );

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print-root, .invoice-print-root * { visibility: visible !important; }
          .invoice-print-root { position: absolute; left: 0; top: 0; width: 100%; max-width: none !important; margin: 0 !important; padding: 24px !important; background: #ffffff !important; color: #0f172a !important; border: 0 !important; box-shadow: none !important; }
          .invoice-print-hide { display: none !important; }
          .invoice-card { break-inside: avoid; }
        }
      `}</style>
      <div className="invoice-print-root w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="invoice-print-hide flex flex-col gap-4 border-b border-slate-800 bg-slate-900/95 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Invoice Preview</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Shipment Invoice</h3>
            <p className="mt-1 text-sm text-slate-400">Review the invoice here, then print or save as PDF without leaving the page.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => window.print()} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800">
              Print
            </button>
            <button type="button" onClick={() => downloadInvoicePdf(order)} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              Save PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800">
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[85vh] overflow-y-auto bg-white px-6 py-6 text-slate-900 sm:px-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black tracking-[0.28em] text-white shadow-sm">
                LP
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">LogisticsPro</p>
                <h2 className="mt-2 text-3xl font-bold">Shipment Invoice</h2>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Invoice status</p>
              <p className="mt-2 text-base font-semibold">{formatStatus(order.status)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["Order No", order.orderNo || "Not available"],
              ["Quotation No", order.quotationNo || "Not available"],
              ["Customer", order.customerName || "Customer"],
              ["Assigned Driver", formatDriver(order)],
              ["Assigned Route", formatRoute(order)],
              ["Truck ID", order.truckId || "Not assigned"],
              ["Cargo", order.cargo || "Not specified"],
              ["Weight", order.weight || "Not specified"],
              ["Dimensions", formatDimensions(order.dimensions)],
              ["Quantity", order.itemQuantity || 1],
              ["Origin", formatLocation(order.origin)],
              ["Destination", formatLocation(order.destination)],
              ["Delivery Address", order.deliveryAddress || formatLocation(order.destination)],
              ["ETA", order.eta || "Pending confirmation"],
            ].map(([label, value]) => (
              <div key={label} className="invoice-card rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h4 className="text-lg font-semibold">Quotation Breakdown</h4>
            <div className="invoice-card mt-3 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Charge</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownRows.length > 0 ? breakdownRows.map(([key, label]) => (
                    <tr key={key} className="border-t border-slate-200">
                      <td className="px-4 py-3">{label}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(key === "total" ? order.quoteTotal || breakdown.total : breakdown[key])}</td>
                    </tr>
                  )) : (
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-3">Quotation total</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.quoteTotal || 0)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-card mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Invoice Total</p>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(order.quoteTotal || breakdown.total || 0)}</p>
            <p className="mt-2 text-sm text-slate-500">Chargeable weight: {breakdown.chargeableWeightKg || 0} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
