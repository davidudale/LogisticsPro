const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN = 28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const CARD_GAP = 8;
const CARD_COLUMNS = 3;
const CARD_WIDTH = (CONTENT_WIDTH - CARD_GAP * (CARD_COLUMNS - 1)) / CARD_COLUMNS;
const FONT_REGULAR = "F1";
const FONT_BOLD = "F2";

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

const pdfEscape = (value) =>
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

const formatRoute = (order) =>
  order.assignedRouteName
  || order.routeName
  || "Not assigned";

const formatDriver = (order) =>
  order.assignedDriverName
  || order.driverName
  || "Not assigned";

const wrapText = (text, maxChars) => {
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

  if (current) {
    lines.push(current);
  }

  return lines;
};

const textCommand = ({
  text,
  x,
  y,
  font = FONT_REGULAR,
  size = 12,
  color = "0 0 0",
}) => [
  "BT",
  `/${font} ${size} Tf`,
  `${color} rg`,
  `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
  `(${pdfEscape(text)}) Tj`,
  "ET",
].join("\n");

const rectCommand = ({
  x,
  y,
  width,
  height,
  fill = null,
  stroke = null,
  lineWidth = 1,
}) => {
  const commands = [];
  if (fill) {
    commands.push(`${fill} rg`);
  }
  if (stroke) {
    commands.push(`${stroke} RG`);
    commands.push(`${lineWidth} w`);
  }
  commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re`);
  if (fill && stroke) {
    commands.push("B");
  } else if (fill) {
    commands.push("f");
  } else if (stroke) {
    commands.push("S");
  }
  return commands.join("\n");
};

const lineCommand = ({ x1, y1, x2, y2, stroke = "0.886 0.91 0.941", lineWidth = 1 }) => [
  `${stroke} RG`,
  `${lineWidth} w`,
  `${x1.toFixed(2)} ${y1.toFixed(2)} m`,
  `${x2.toFixed(2)} ${y2.toFixed(2)} l`,
  "S",
].join("\n");

const createPageState = () => ({
  commands: [],
  y: PAGE_HEIGHT - PAGE_MARGIN,
});

const pushPage = (pages, page) => {
  if (page.commands.length) {
    pages.push(page);
  }
};

const drawLines = (page, lines, options) => {
  const {
    x,
    startY,
    lineHeight = 14,
    font = FONT_REGULAR,
    size = 12,
    color = "0.059 0.09 0.161",
  } = options;
  lines.forEach((line, index) => {
    page.commands.push(textCommand({
      text: line,
      x,
      y: startY - index * lineHeight,
      font,
      size,
      color,
    }));
  });
};

const ensureSpace = (pages, page, neededHeight) => {
  if (page.y - neededHeight < PAGE_MARGIN) {
    pushPage(pages, page);
    return createPageState();
  }
  return page;
};

const drawHeader = (page, order) => {
  const logoSize = 34;
  const logoY = page.y - logoSize;
  page.commands.push(rectCommand({
    x: PAGE_MARGIN,
    y: logoY,
    width: logoSize,
    height: logoSize,
    fill: "0.059 0.09 0.161",
    stroke: "0.059 0.09 0.161",
  }));
  page.commands.push(textCommand({
    text: "LP",
    x: PAGE_MARGIN + 8,
    y: logoY + 11,
    font: FONT_BOLD,
    size: 12,
    color: "1 1 1",
  }));
  page.commands.push(textCommand({
    text: "LOGISTICSPRO",
    x: PAGE_MARGIN + logoSize + 10,
    y: page.y - 6,
    font: FONT_BOLD,
    size: 10,
    color: "0.392 0.455 0.545",
  }));
  page.commands.push(textCommand({
    text: "Shipment Invoice",
    x: PAGE_MARGIN + logoSize + 10,
    y: page.y - 24,
    font: FONT_BOLD,
    size: 22,
    color: "0.059 0.09 0.161",
  }));

  const statusBoxWidth = 150;
  const statusBoxHeight = 48;
  const statusX = PAGE_WIDTH - PAGE_MARGIN - statusBoxWidth;
  const statusY = page.y - statusBoxHeight;
  page.commands.push(rectCommand({
    x: statusX,
    y: statusY,
    width: statusBoxWidth,
    height: statusBoxHeight,
    fill: "1 1 1",
    stroke: "0.886 0.91 0.941",
  }));
  page.commands.push(textCommand({
    text: "Invoice Status",
    x: statusX + 10,
    y: statusY + statusBoxHeight - 14,
    font: FONT_BOLD,
    size: 8,
    color: "0.392 0.455 0.545",
  }));
  page.commands.push(textCommand({
    text: formatStatus(order.status),
    x: statusX + 10,
    y: statusY + statusBoxHeight - 28,
    font: FONT_BOLD,
    size: 11,
    color: "0.059 0.09 0.161",
  }));
  page.commands.push(lineCommand({
    x1: PAGE_MARGIN,
    y1: page.y - 58,
    x2: PAGE_WIDTH - PAGE_MARGIN,
    y2: page.y - 58,
  }));
  page.y -= 70;
};

const drawCards = (pages, page, cards) => {
  for (let index = 0; index < cards.length; index += CARD_COLUMNS) {
    const row = cards.slice(index, index + CARD_COLUMNS);
    const rowHeights = row.map((card) => {
      const lines = wrapText(card.value, 30);
      return Math.max(58, 24 + lines.length * 10 + 12);
    });
    const rowHeight = Math.max(...rowHeights);
    page = ensureSpace(pages, page, rowHeight + 6);

    row.forEach((card, cardIndex) => {
      const x = PAGE_MARGIN + cardIndex * (CARD_WIDTH + CARD_GAP);
      const y = page.y - rowHeight;
      page.commands.push(rectCommand({
        x,
        y,
        width: CARD_WIDTH,
        height: rowHeight,
        fill: "0.973 0.98 0.988",
        stroke: "0.886 0.91 0.941",
      }));
      page.commands.push(textCommand({
        text: card.label,
          x: x + 10,
          y: y + rowHeight - 14,
          font: FONT_BOLD,
          size: 8,
          color: "0.392 0.455 0.545",
        }));
      drawLines(page, wrapText(card.value, 30), {
        x: x + 10,
        startY: y + rowHeight - 28,
        lineHeight: 10,
        font: FONT_BOLD,
        size: 8.5,
        color: "0.059 0.09 0.161",
      });
    });

    page.y -= rowHeight + 8;
  }

  return page;
};

const drawBreakdownTable = (pages, page, order) => {
  const breakdown = order.quotationBreakdown || {};
  const rows = breakdownLabels
    .filter(([key]) => breakdown[key] !== undefined || (key === "total" && order.quoteTotal))
    .map(([key, label]) => ({
      label,
      value: formatCurrency(key === "total" ? order.quoteTotal || breakdown.total : breakdown[key]),
    }));

  if (rows.length === 0) {
    rows.push({ label: "Quotation total", value: formatCurrency(order.quoteTotal || 0) });
  }

  page = ensureSpace(pages, page, 44);
  page.commands.push(textCommand({
    text: "Quotation Breakdown",
    x: PAGE_MARGIN,
    y: page.y - 4,
    font: FONT_BOLD,
    size: 12,
    color: "0.059 0.09 0.161",
  }));
  page.y -= 18;

  const tableTop = page.y;
  const rowHeight = 18;
  const tableWidth = CONTENT_WIDTH;
  const amountColumnWidth = 145;
  const labelX = PAGE_MARGIN + 10;
  const amountX = PAGE_MARGIN + tableWidth - amountColumnWidth + 10;

  page = ensureSpace(pages, page, (rows.length + 1) * rowHeight + 12);
  page.commands.push(rectCommand({
    x: PAGE_MARGIN,
    y: tableTop - rowHeight,
    width: tableWidth,
    height: rowHeight,
    fill: "0.945 0.961 0.976",
    stroke: "0.886 0.91 0.941",
  }));
  page.commands.push(textCommand({
    text: "Charge",
    x: labelX,
    y: tableTop - 12,
    font: FONT_BOLD,
    size: 8.5,
    color: "0.278 0.329 0.412",
  }));
  page.commands.push(textCommand({
    text: "Amount",
    x: amountX,
    y: tableTop - 12,
    font: FONT_BOLD,
    size: 8.5,
    color: "0.278 0.329 0.412",
  }));

  let currentTop = tableTop - rowHeight;
  rows.forEach((row) => {
    page.commands.push(rectCommand({
      x: PAGE_MARGIN,
      y: currentTop - rowHeight,
      width: tableWidth,
      height: rowHeight,
      fill: "1 1 1",
      stroke: "0.886 0.91 0.941",
    }));
    page.commands.push(textCommand({
      text: row.label,
      x: labelX,
      y: currentTop - 12,
      font: FONT_REGULAR,
      size: 8.5,
      color: "0.059 0.09 0.161",
    }));
    page.commands.push(textCommand({
      text: row.value,
      x: amountX,
      y: currentTop - 12,
      font: FONT_BOLD,
      size: 8.5,
      color: "0.059 0.09 0.161",
    }));
    currentTop -= rowHeight;
  });

  page.y = currentTop - 8;
  return page;
};

const drawTotalCard = (pages, page, order) => {
  const breakdown = order.quotationBreakdown || {};
  const cardHeight = 62;
  page = ensureSpace(pages, page, cardHeight);
  const y = page.y - cardHeight;
  page.commands.push(rectCommand({
    x: PAGE_MARGIN,
    y,
    width: CONTENT_WIDTH,
    height: cardHeight,
    fill: "0.973 0.98 0.988",
    stroke: "0.886 0.91 0.941",
  }));
  page.commands.push(textCommand({
    text: "Invoice Total",
    x: PAGE_MARGIN + 12,
    y: y + cardHeight - 14,
    font: FONT_BOLD,
    size: 8,
    color: "0.392 0.455 0.545",
  }));
  page.commands.push(textCommand({
    text: formatCurrency(order.quoteTotal || breakdown.total || 0),
    x: PAGE_MARGIN + 12,
    y: y + cardHeight - 34,
    font: FONT_BOLD,
    size: 18,
    color: "0.059 0.09 0.161",
  }));
  page.commands.push(textCommand({
    text: `Chargeable weight: ${breakdown.chargeableWeightKg || 0} kg`,
    x: PAGE_MARGIN + 12,
    y: y + 10,
    font: FONT_REGULAR,
    size: 8.5,
    color: "0.278 0.329 0.412",
  }));
  page.y = y - 6;
  return page;
};

const buildInvoicePages = (order) => {
  const cards = [
    { label: "Order No", value: order.orderNo || "Not available" },
    { label: "Quotation No", value: order.quotationNo || "Not available" },
    { label: "Customer", value: order.customerName || "Customer" },
    { label: "Assigned Driver", value: formatDriver(order) },
    { label: "Assigned Route", value: formatRoute(order) },
    { label: "Truck ID", value: order.truckId || "Not assigned" },
    { label: "Cargo", value: order.cargo || "Not specified" },
    { label: "Weight", value: order.weight || "Not specified" },
    { label: "Dimensions", value: formatDimensions(order.dimensions) },
    { label: "Quantity", value: String(order.itemQuantity || 1) },
    { label: "Origin", value: formatLocation(order.origin) },
    { label: "Destination", value: formatLocation(order.destination) },
    { label: "Delivery Address", value: order.deliveryAddress || formatLocation(order.destination) },
    { label: "ETA", value: order.eta || "Pending confirmation" },
  ];

  const pages = [];
  let page = createPageState();
  drawHeader(page, order);
  page = drawCards(pages, page, cards);
  page = drawBreakdownTable(pages, page, order);
  page = drawTotalCard(pages, page, order);
  pushPage(pages, page);
  return pages;
};

const buildPdfBytes = (pages) => {
  const pageCount = pages.length;
  const fontRegularNumber = 3 + pageCount * 2;
  const fontBoldNumber = fontRegularNumber + 1;
  const objects = [];

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const kids = [];

  pages.forEach((page, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    kids.push(`${pageObjectNumber} 0 R`);
    const stream = page.commands.join("\n");
    objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /${FONT_REGULAR} ${fontRegularNumber} 0 R /${FONT_BOLD} ${fontBoldNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
    objects[contentObjectNumber] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${kids.join(" ")}] >>`;
  objects[fontRegularNumber] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBoldNumber] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

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

  const pdfBytes = buildPdfBytes(buildInvoicePages(order));
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
