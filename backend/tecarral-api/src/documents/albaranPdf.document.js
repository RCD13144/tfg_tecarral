import PDFDocument from "pdfkit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "../assets/tecarral-logo.jpg");

const PAGE = Object.freeze({ width: 595.28, height: 841.89, margin: 24 });
const COLORS = Object.freeze({
  ink: "#1b2633",
  blue: "#0862a5",
  paleBlue: "#dcebf5",
  line: "#4d5965",
  softLine: "#9aa5ae",
  paper: "#ffffff",
  watermark: "#edf1f4",
});

function value(input, fallback = "") {
  const normalized = String(input ?? "").trim();
  return normalized || fallback;
}

function formatDate(valueToFormat) {
  const date = valueToFormat ? new Date(valueToFormat) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(date);
}

function formatMoney(input) {
  const number = Number(input);
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function strokeRect(doc, x, y, width, height, options = {}) {
  doc.save().lineWidth(options.lineWidth ?? 0.7).strokeColor(options.stroke ?? COLORS.line)
    .rect(x, y, width, height).stroke().restore();
}

function text(doc, content, x, y, width, options = {}) {
  doc.font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(options.size ?? 7)
    .fillColor(options.color ?? COLORS.ink).text(value(content), x, y, {
      width,
      height: options.height,
      align: options.align ?? "left",
      ellipsis: options.ellipsis ?? true,
      lineBreak: options.lineBreak ?? true,
    });
}

function field(doc, label, content, x, y, width, height, options = {}) {
  strokeRect(doc, x, y, width, height, options);
  const labelWidth = options.labelWidth ?? Math.min(72, width * 0.34);
  doc.save().fillColor(options.labelFill ?? COLORS.paleBlue).rect(x, y, labelWidth, height).fill().restore();
  text(doc, label, x + 4, y + 4, labelWidth - 8, { bold: true, size: options.labelSize ?? 6.5 });
  text(doc, content, x + labelWidth + 5, y + 4, width - labelWidth - 9, {
    size: options.valueSize ?? 7,
    height: height - 7,
  });
}

function checkbox(doc, label, checked, x, y) {
  strokeRect(doc, x, y, 10, 10, { lineWidth: 0.8 });
  if (checked) {
    doc.save().strokeColor(COLORS.blue).lineWidth(1.7).moveTo(x + 2, y + 5)
      .lineTo(x + 4.5, y + 8).lineTo(x + 8.5, y + 2).stroke().restore();
  }
  text(doc, label, x + 13, y + 1, 48, { bold: true, size: 6.7 });
}

function drawHeader(doc, data) {
  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;
  text(doc, "Carretillas, maquinaria de limpieza y plataformas elevadoras", left, 27, 310, { bold: true, size: 7 });
  doc.image(LOGO_PATH, right - 196, 18, { fit: [196, 40], align: "right" });
  doc.save().strokeColor(COLORS.blue).lineWidth(3).moveTo(left, 51).lineTo(right, 51).stroke().restore();

  const kind = value(data.document_kind, "ALBARAN").toUpperCase();
  checkbox(doc, "Albarán", kind === "ALBARAN" || kind === "SERVICIO_TECNICO", 338, 58);
  checkbox(doc, "Presupuesto", kind === "PRESUPUESTO", 410, 58);
  checkbox(doc, "Pedido", kind === "PEDIDO", 500, 58);
  text(doc, `N.º ${value(data.document_number, "-")}`, 432, 74, 138, { bold: true, size: 11, align: "right", color: COLORS.blue });
}

function drawCustomerAndWork(doc, data) {
  const x = PAGE.margin;
  const y = 91;
  const leftWidth = 310;
  const rightX = x + leftWidth + 6;
  const rightWidth = PAGE.width - PAGE.margin - rightX;

  field(doc, "Cliente", data.cliente, x, y, leftWidth, 24);
  field(doc, "Dirección", data.direccion, x, y + 24, leftWidth, 32);
  field(doc, "Población", data.poblacion, x, y + 56, 206, 22);
  field(doc, "C.P.", data.cp, x + 206, y + 56, 104, 22, { labelWidth: 35 });
  field(doc, "Teléfono", data.telefono, x, y + 78, 206, 22);
  field(doc, "C.I.F.", data.cif, x + 206, y + 78, 104, 22, { labelWidth: 35 });
  field(doc, "e-mail", data.email_cliente, x, y + 100, leftWidth, 22);

  field(doc, "Técnico / comercial", data.tecnico_nombre, rightX, y, rightWidth, 24, { labelWidth: 78 });
  field(doc, "Fecha", formatDate(data.firmado_at ?? data.created_at), rightX, y + 24, rightWidth, 20, { labelWidth: 50 });
  field(doc, "H. inicio", data.hours_start, rightX, y + 44, rightWidth / 2, 20, { labelWidth: 50 });
  field(doc, "H. final", data.hours_end, rightX + rightWidth / 2, y + 44, rightWidth / 2, 20, { labelWidth: 45 });
  field(doc, "Total horas", data.total_hours, rightX, y + 64, rightWidth / 2, 20, { labelWidth: 54 });
  field(doc, "Despl.", data.desplazamiento_text ? (data.includes_travel ? "Incluido" : "") : "", rightX + rightWidth / 2, y + 64, rightWidth / 2, 20, { labelWidth: 45 });
  for (let row = 0; row < 2; row += 1) {
    field(doc, "Fecha", "", rightX, y + 84 + row * 19, rightWidth, 19, { labelWidth: 50 });
  }
}

function drawCommercialData(doc, data) {
  const x = PAGE.margin;
  const y = 219;
  const width = PAGE.width - PAGE.margin * 2;
  field(doc, "Pago", data.payment_terms, x, y, 310, 24);
  field(doc, "Portes", data.includes_travel ? "Incluidos" : "", x + 316, y, 112, 24, { labelWidth: 45 });
  field(doc, "Plazo de entrega", "", x + 428, y, width - 428, 24, { labelWidth: 58 });
  field(doc, "Cuenta n.º", "", x, y + 24, 310, 24);
  field(doc, "Dirección de entrega", data.delivery_address, x + 316, y + 24, 173, 24, { labelWidth: 70 });
  field(doc, "Teléfono", data.delivery_phone, x + 489, y + 24, width - 489, 24, { labelWidth: 42 });
}

function drawLineItems(doc, data) {
  const x = PAGE.margin;
  const y = 273;
  const widths = [104, 300, 45, 56, 42];
  const headers = ["Referencia", "Descripción", "Uni.", "Precio", "Total"];
  let cursor = x;

  headers.forEach((header, index) => {
    doc.save().fillColor(COLORS.paleBlue).rect(cursor, y, widths[index], 20).fill().restore();
    strokeRect(doc, cursor, y, widths[index], 20);
    text(doc, header, cursor + 3, y + 6, widths[index] - 6, { bold: true, size: 6.8, align: "center" });
    cursor += widths[index];
  });

  const rows = 9;
  const rowHeight = 23;
  for (let row = 0; row < rows; row += 1) {
    cursor = x;
    widths.forEach((columnWidth) => {
      strokeRect(doc, cursor, y + 20 + row * rowHeight, columnWidth, rowHeight, { stroke: COLORS.softLine });
      cursor += columnWidth;
    });
  }

  text(doc, value(data.observaciones, "Servicio técnico realizado"), x + widths[0] + 4, y + 26, widths[1] - 8, { size: 7, height: rowHeight * 4 - 8 });
  if (Number.isFinite(Number(data.pricing_base_amount))) {
    text(doc, "1", x + widths[0] + widths[1] + 3, y + 26, widths[2] - 6, { align: "center" });
    const price = formatMoney(data.pricing_base_amount);
    text(doc, price, x + widths[0] + widths[1] + widths[2] + 3, y + 26, widths[3] - 6, { align: "right" });
    text(doc, price, x + widths[0] + widths[1] + widths[2] + widths[3] + 3, y + 26, widths[4] - 6, { align: "right" });
  }
}

function drawMachineAndTotals(doc, data) {
  const x = PAGE.margin;
  const y = 510;
  field(doc, "N.º de serie", data.maquina?.ns ?? data.ns, x, y, 245, 22);
  field(doc, "Marca", data.maquina?.marca ?? data.marca, x + 245, y, 180, 22, { labelWidth: 45 });
  field(doc, "Modelo", data.maquina?.modelo ?? data.modelo, x, y + 22, 245, 22);
  field(doc, "Horas", data.machine_hours, x + 245, y + 22, 180, 22, { labelWidth: 45 });

  const totalsX = x + 431;
  field(doc, "Base imponible", formatMoney(data.pricing_base_amount), totalsX, y, 116, 24, { labelWidth: 67 });
  field(doc, "I.V.A.", "", totalsX, y + 24, 116, 24, { labelWidth: 67 });
  field(doc, "Total", formatMoney(data.pricing_base_amount), totalsX, y + 48, 116, 24, { labelWidth: 67 });
  field(doc, "Recibido a cta.", "", totalsX, y + 72, 116, 24, { labelWidth: 67 });
  field(doc, "Pendiente pago", formatMoney(data.pricing_base_amount), totalsX, y + 96, 116, 24, { labelWidth: 67 });

  const obsY = y + 50;
  strokeRect(doc, x, obsY, 425, 118);
  doc.save().fillColor(COLORS.paleBlue).rect(x, obsY, 425, 20).fill().restore();
  text(doc, "Observaciones / Trabajos realizados", x + 5, obsY + 6, 415, { bold: true, size: 7 });
  text(doc, data.observaciones, x + 7, obsY + 27, 411, { size: 7.2, height: 84 });
}

function drawSignatures(doc, data, signatures) {
  const x = PAGE.margin;
  const y = 684;
  const width = PAGE.width - PAGE.margin * 2;
  const half = width / 2;
  strokeRect(doc, x, y, width, 85);
  doc.save().strokeColor(COLORS.softLine).moveTo(x + half, y).lineTo(x + half, y + 85).stroke().restore();
  text(doc, "Sello y firma cliente", x + 7, y + 6, half - 14, { bold: true, size: 7.2, align: "center" });
  text(doc, "Sello y firma Tecarral", x + half + 7, y + 6, half - 14, { bold: true, size: 7.2, align: "center" });
  doc.image(signatures.customer, x + 18, y + 21, { fit: [half - 36, 48], align: "center", valign: "center" });
  doc.image(signatures.tecarral, x + half + 18, y + 21, { fit: [half - 36, 48], align: "center", valign: "center" });
  text(doc, formatDate(data.firmado_at), x + 7, y + 69, half - 14, { size: 6, align: "center" });
  text(doc, formatDate(data.firmado_at), x + half + 7, y + 69, half - 14, { size: 6, align: "center" });
}

function drawFooter(doc) {
  const x = PAGE.margin;
  const width = PAGE.width - PAGE.margin * 2;
  text(doc, "Nota importante: se facturará según los datos anotados en esta hoja. Rogamos comprueben los mismos y firmen.", x, 778, width, { bold: true, size: 5.8, align: "center" });
  text(doc, "Servicio técnico, venta y alquiler de carretillas elevadoras y equipos de limpieza industrial.", x, 790, width, { bold: true, size: 6.2, align: "center" });
  text(doc, "C/ La Venta, n.º 2 - P.E. Neinor Henares, Edificio 11, Nave 14 - 28880 Meco (Madrid) - Tel. 91 830 72 81", x, 801, width, { size: 5.8, align: "center" });
  doc.save().fillColor(COLORS.blue).rect(x, 817, width, 5).fill().restore();
}

export async function generateSignedAlbaranPdf({ data, customerSignature, tecarralSignature }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: true,
      compress: true,
      info: {
        Title: `Albarán ${value(data.document_number, data.id_albaran)}`,
        Author: "Tecarral Carretillas, S.L.",
        Subject: "Albarán firmado",
      },
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.save().fillColor(COLORS.paper).rect(0, 0, PAGE.width, PAGE.height).fill().restore();
    doc.save().fillColor(COLORS.watermark).opacity(0.55).font("Helvetica-Bold").fontSize(360)
      .text("T", 95, 230, { width: 400, align: "center" }).restore();
    drawHeader(doc, data);
    drawCustomerAndWork(doc, data);
    drawCommercialData(doc, data);
    drawLineItems(doc, data);
    drawMachineAndTotals(doc, data);
    drawSignatures(doc, data, { customer: customerSignature, tecarral: tecarralSignature });
    drawFooter(doc);
    doc.end();
  });
}
