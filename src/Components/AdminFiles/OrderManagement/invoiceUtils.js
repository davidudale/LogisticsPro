const formatCurrency = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

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

export const openInvoicePdf = (order) => {
  if (typeof window === "undefined") return;

  const invoiceWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=760");
  if (!invoiceWindow) return;

  const breakdown = order.quotationBreakdown || {};
  const breakdownRows = breakdownLabels
    .filter(([key]) => breakdown[key] !== undefined || (key === "total" && order.quoteTotal))
    .map(([key, label]) => `<tr><td>${label}</td><td>${formatCurrency(key === "total" ? order.quoteTotal || breakdown.total : breakdown[key])}</td></tr>`)
    .join("");

  invoiceWindow.document.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Invoice ${order.orderNo || "Order"}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; color: #0f172a; background: #e2e8f0; }
      h1, h2, h3, p { margin: 0; }
      .toolbar { position: sticky; top: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 24px; background: #0f172a; color: #f8fafc; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2); }
      .toolbar-copy { max-width: 640px; }
      .toolbar-title { font-size: 14px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
      .toolbar-text { margin-top: 6px; color: #cbd5e1; font-size: 13px; line-height: 1.5; }
      .toolbar-actions { display: flex; gap: 12px; flex-wrap: wrap; }
      .toolbar-actions button { border: 0; border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 700; cursor: pointer; }
      .toolbar-actions .secondary { background: #1e293b; color: #f8fafc; }
      .toolbar-actions .primary { background: #ea580c; color: #fff; }
      .page { max-width: 980px; margin: 24px auto; background: #fff; border-radius: 24px; box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12); padding: 32px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
      .brand { font-size: 24px; font-weight: 700; letter-spacing: 0.08em; }
      .subtitle { color: #475569; margin-top: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
      .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; }
      .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
      .value { font-size: 14px; font-weight: 600; color: #0f172a; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-size: 14px; text-align: left; }
      th:last-child, td:last-child { text-align: right; }
      .section-title { font-size: 16px; font-weight: 700; margin: 28px 0 8px; }
      .summary { margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
      .summary strong { font-size: 18px; }
      @media print {
        body { background: #fff; }
        .toolbar { display: none; }
        .page { margin: 0; max-width: none; border-radius: 0; box-shadow: none; padding: 20px; }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <div class="toolbar-copy">
        <p class="toolbar-title">Invoice Preview</p>
        <p class="toolbar-text">Review the shipment invoice here. Use Print for paper copies, or Save PDF to open the browser print dialog and choose “Save as PDF”.</p>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="secondary" onclick="window.print()">Print</button>
        <button type="button" class="primary" onclick="window.print()">Save PDF</button>
      </div>
    </div>
    <div class="page">
      <div class="header">
        <div>
          <div class="brand">LOGISTICSPRO</div>
          <p class="subtitle">Shipment Invoice</p>
        </div>
        <div>
          <p class="label">Invoice status</p>
          <p class="value">${order.status || "Invoice sent"}</p>
        </div>
      </div>

      <div class="grid">
        <div class="card"><p class="label">Order No</p><p class="value">${order.orderNo || "Not available"}</p></div>
        <div class="card"><p class="label">Quotation No</p><p class="value">${order.quotationNo || "Not available"}</p></div>
        <div class="card"><p class="label">Customer</p><p class="value">${order.customerName || "Customer"}</p></div>
        <div class="card"><p class="label">Truck ID</p><p class="value">${order.truckId || "Not assigned"}</p></div>
        <div class="card"><p class="label">Cargo</p><p class="value">${order.cargo || "Not specified"}</p></div>
        <div class="card"><p class="label">Weight</p><p class="value">${order.weight || "Not specified"}</p></div>
        <div class="card"><p class="label">Dimensions</p><p class="value">${formatDimensions(order.dimensions)}</p></div>
        <div class="card"><p class="label">Quantity</p><p class="value">${order.itemQuantity || 1}</p></div>
        <div class="card"><p class="label">Origin</p><p class="value">${formatLocation(order.origin)}</p></div>
        <div class="card"><p class="label">Destination</p><p class="value">${formatLocation(order.destination)}</p></div>
        <div class="card"><p class="label">Delivery Address</p><p class="value">${order.deliveryAddress || formatLocation(order.destination)}</p></div>
        <div class="card"><p class="label">ETA</p><p class="value">${order.eta || "Pending confirmation"}</p></div>
      </div>

      <h3 class="section-title">Quotation Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Charge</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownRows || `<tr><td>Quotation total</td><td>${formatCurrency(order.quoteTotal || 0)}</td></tr>`}
        </tbody>
      </table>

      <div class="summary">
        <p class="label">Invoice Total</p>
        <p><strong>${formatCurrency(order.quoteTotal || breakdown.total || 0)}</strong></p>
        <p style="margin-top: 8px; color: #475569; font-size: 13px;">Chargeable weight: ${breakdown.chargeableWeightKg || 0} kg</p>
      </div>
    </div>
  </body>
</html>`);
  invoiceWindow.document.close();
};
