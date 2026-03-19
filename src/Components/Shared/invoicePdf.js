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

const sanitizeText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");

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

const wrapText = (text, maxChars = 84) => {
  const source = String(text ?? "").trim();
  if (!source) return [""];

  const words = source.split(/\s+/);
  const lines = [];
  let current = words.shift() || "";

  words.forEach((word) => {
    const candidate = `${current} ${word}`.trim();
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });

  if (current) lines.push(current);
  return lines;
};

const buildInvoiceLines = (order) => {
  const breakdown = order.quotationBreakdown || {};
  const rows = [
    "LOGISTICSPRO",
    "Shipment Invoice",
    "",
    `Invoice status: ${order.status || "Invoice sent"}`,
    `Order No: ${order.orderNo || "Not available"}`,
    `Quotation No: ${order.quotationNo || "Not available"}`,
    `Customer: ${order.customerName || "Customer"}`,
    `Truck ID: ${order.truckId || "Not assigned"}`,
    `Cargo: ${order.cargo || "Not specified"}`,
    `Weight: ${order.weight || "Not specified"}`,
    `Dimensions: ${formatDimensions(order.dimensions)}`,
    `Quantity: ${order.itemQuantity || 1}`,
    `Origin: ${formatLocation(order.origin)}`,
    `Destination: ${formatLocation(order.destination)}`,
    `Delivery Address: ${order.deliveryAddress || formatLocation(order.destination)}`,
    `ETA: ${order.eta || "Pending confirmation"}`,
    "",
    "Quotation Breakdown",
  ];

  const breakdownRows = breakdownLabels.filter(
    ([key]) => breakdown[key] !== undefined || (key === "total" && order.quoteTotal),
  );

  if (breakdownRows.length > 0) {
    breakdownRows.forEach(([key, label]) => {
      rows.push(`${label}: ${formatCurrency(key === "total" ? order.quoteTotal || breakdown.total : breakdown[key])}`);
    });
  } else {
    rows.push(`Quotation total: ${formatCurrency(order.quoteTotal || 0)}`);
  }

  rows.push("");
  rows.push(`Chargeable weight: ${breakdown.chargeableWeightKg || 0} kg`);
  rows.push(`Invoice Total: ${formatCurrency(order.quoteTotal || breakdown.total || 0)}`);

  return rows.flatMap((line) => wrapText(line));
};

const chunkLines = (lines, size = 44) => {
  const pages = [];
  for (let index = 0; index < lines.length; index += size) {
    pages.push(lines.slice(index, index + size));
  }
  return pages.length ? pages : [[""]];
};

const buildPdfBytes = (pages) => {
  const pageCount = pages.length;
  const fontObjectNumber = 3 + pageCount * 2;
  const objects = [];

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const kids = [];

  pages.forEach((lines, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    kids.push(`${pageObjectNumber} 0 R`);

    const commands = [
      "BT",
      "/F1 12 Tf",
      "16 TL",
      "50 790 Td",
    ];

    lines.forEach((line, lineIndex) => {
      if (lineIndex === 0) {
        commands.push(`(${sanitizeText(line)}) Tj`);
      } else {
        commands.push("T*");
        commands.push(`(${sanitizeText(line)}) Tj`);
      }
    });

    commands.push("ET");
    const stream = commands.join("\n");

    objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
    objects[contentObjectNumber] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${kids.join(" ")}] >>`;
  objects[fontObjectNumber] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Uint8Array([...pdf].map((character) => character.charCodeAt(0)));
};

export const downloadInvoicePdf = (order) => {
  if (typeof window === "undefined" || !order) return;

  const lines = buildInvoiceLines(order);
  const pdfBytes = buildPdfBytes(chunkLines(lines));
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.orderNo || "shipment-invoice"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
