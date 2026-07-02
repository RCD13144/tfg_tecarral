import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.resolve(__dirname, "../assets/templates/presupuesto-reparacion.pdf");

const PAGE = Object.freeze({ width: 595, height: 841 });
const COLORS = Object.freeze({
  text: rgb(0.04, 0.04, 0.04),
  blue: rgb(0.0, 0.18, 0.38),
  red: rgb(0.6, 0.04, 0.04),
  muted: rgb(0.35, 0.35, 0.35),
});

const CELL = Object.freeze({
  checkboxPresupuesto: { x: 361.4, y: 55.6, w: 14.7, h: 12.5 },
  documentNumber: { x: 500, y: 53, w: 68, h: 16 },
  cliente: { x: 82, y: 57, w: 210, h: 15 },
  direccion: { x: 82, y: 74, w: 210, h: 29 },
  poblacion: { x: 82, y: 105, w: 104, h: 15 },
  cp: { x: 213, y: 121, w: 78, h: 15 },
  telefono: { x: 82, y: 137, w: 104, h: 15 },
  cif: { x: 213, y: 137, w: 78, h: 15 },
  email: { x: 174, y: 153, w: 118, h: 16 },
  pago: { x: 82, y: 173, w: 210, h: 15 },
  cuenta: { x: 82, y: 204, w: 140, h: 14 },
  tecnico: { x: 360, y: 73, w: 54, h: 17 },
  hInicio: { x: 304, y: 104, w: 55, h: 16 },
  hFinal: { x: 360, y: 104, w: 55, h: 16 },
  totalHoras: { x: 416, y: 104, w: 31, h: 16 },
  desplazamiento: { x: 448, y: 104, w: 24, h: 16 },
  fecha1: { x: 511, y: 73, w: 57, h: 16 },
  portes: { x: 360, y: 173, w: 91, h: 15 },
  plazoEntrega: { x: 489, y: 173, w: 80, h: 15 },
  direccionEntrega: { x: 360, y: 189, w: 92, h: 29 },
  telefonoEntrega: { x: 489, y: 204, w: 80, h: 14 },
  serie: { x: 82, y: 612, w: 270, h: 17 },
  modelo: { x: 82, y: 631, w: 270, h: 16 },
  observaciones: { x: 33, y: 666, w: 318, h: 29 },
  base: { x: 478, y: 611, w: 89, h: 16 },
  iva: { x: 478, y: 649, w: 89, h: 17 },
  subtotal: { x: 478, y: 671, w: 89, h: 17 },
  fianza: { x: 478, y: 691, w: 89, h: 17 },
  total: { x: 478, y: 711, w: 89, h: 17 },
  firmaCliente: { x: 34, y: 697, w: 108, h: 29 },
  fechaFirmaCliente: { x: 151, y: 697, w: 74, h: 29 },
  firmaTecarral: { x: 236, y: 697, w: 111, h: 29 },
});

const TABLE = Object.freeze({
  top: 246.3,
  bottom: 606.6,
  rowHeight: 17.2,
  rowsPerPage: 20,
  columns: {
    referencia: { x: 31, w: 70 },
    descripcion: { x: 107, w: 270 },
    unidades: { x: 383, w: 37 },
    precio: { x: 426, w: 48 },
    total: { x: 480, w: 86 },
  },
});

function asText(value, fallback = "") {
  const content = String(value ?? "").trim();
  return content || fallback;
}

function normalizeText(value, fallback = "") {
  return asText(value, fallback)
    .replaceAll("Ã¡", "á")
    .replaceAll("Ã©", "é")
    .replaceAll("Ã­", "í")
    .replaceAll("Ã³", "ó")
    .replaceAll("Ãº", "ú")
    .replaceAll("Ã±", "ñ")
    .replaceAll("Ã�", "Á")
    .replaceAll("Ã‰", "É")
    .replaceAll("Ã“", "Ó")
    .replaceAll("â‚¬", "€")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function safePdfText(value) {
  return normalizeText(value)
    .replaceAll("€", "EUR")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("’", "'");
}

function formatDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatMoney(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatQuantity(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n);
}

function pdfY(cell, fontSize, lineIndex = 0, lineHeight = fontSize * 1.08) {
  return PAGE.height - cell.y - 2.2 - fontSize - lineIndex * lineHeight;
}

function textWidth(font, text, size) {
  return font.widthOfTextAtSize(text, size);
}

function splitLongToken(token, font, size, maxWidth) {
  const parts = [];
  let current = "";
  for (const char of token) {
    const candidate = current + char;
    if (current && textWidth(font, candidate, size) > maxWidth) {
      parts.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function tokenizeForWrap(text) {
  return safePdfText(text)
    .replaceAll("@", "@ ")
    .replaceAll(".", ". ")
    .replaceAll(",", ", ")
    .replaceAll("/", "/ ")
    .replaceAll("-", "- ")
    .split(/\s+/)
    .filter(Boolean);
}

function wrapText(text, font, size, maxWidth, maxLines) {
  const tokens = tokenizeForWrap(text);
  const lines = [];
  let current = "";

  for (const rawToken of tokens) {
    const tokenParts = textWidth(font, rawToken, size) > maxWidth
      ? splitLongToken(rawToken, font, size, maxWidth)
      : [rawToken];

    for (const token of tokenParts) {
      const candidate = current ? `${current} ${token}` : token;
      if (current && textWidth(font, candidate, size) > maxWidth) {
        lines.push(current.trim());
        current = token;
      } else {
        current = candidate;
      }
    }
  }

  if (current) lines.push(current.trim());
  if (lines.length <= maxLines) return lines;

    return lines;
}

function fitWrappedText(text, font, cell, options = {}) {
  const minSize = options.minSize ?? 3.8;
  const maxSize = options.size ?? 8.2;
  const paddingX = options.paddingX ?? 2.2;
  const paddingY = options.paddingY ?? 1.8;
  const maxWidth = cell.w - paddingX * 2;
  const maxHeight = cell.h - paddingY * 2;

  for (let size = maxSize; size >= minSize; size -= 0.25) {
    const lineHeight = size * (options.lineHeightFactor ?? 1.02);
    const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
    const lines = wrapText(text, font, size, maxWidth, maxLines);
    const widest = Math.max(...lines.map((line) => textWidth(font, line, size)), 0);
    if (lines.length * lineHeight <= maxHeight + 0.1 && widest <= maxWidth + 0.1) {
      return { size, lines, lineHeight, paddingX };
    }
  }

  const size = minSize;
  const lineHeight = size * (options.lineHeightFactor ?? 0.98);
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  return { size, lines: wrapText(text, font, size, maxWidth, maxLines), lineHeight, paddingX };
}

function fitSingleLine(text, font, cell, options = {}) {
  const paddingX = options.paddingX ?? 2.2;
  const maxWidth = cell.w - paddingX * 2;
  const minSize = options.minSize ?? 3.6;
  const maxSize = options.size ?? 8.2;
  for (let size = maxSize; size >= minSize; size -= 0.2) {
    if (textWidth(font, text, size) <= maxWidth + 0.1) return { size, paddingX };
  }
  return { size: minSize, paddingX };
}

function drawSingleLineInCell(page, fonts, cell, value, options = {}) {
  const text = safePdfText(value);
  if (!text) return;
  const font = options.bold ? fonts.bold : fonts.regular;
  const color = options.color ?? COLORS.text;
  const fitted = fitSingleLine(text, font, cell, options);
  const width = textWidth(font, text, fitted.size);
  let x = cell.x + fitted.paddingX;
  if (options.align === "right") x = cell.x + cell.w - fitted.paddingX - width;
  if (options.align === "center") x = cell.x + (cell.w - width) / 2;
  page.drawText(text, {
    x,
    y: pdfY(cell, fitted.size),
    size: fitted.size,
    font,
    color,
  });
}

function drawWrappedTextInCell(page, fonts, cell, value, options = {}) {
  const text = safePdfText(value);
  if (!text) return;
  const font = options.bold ? fonts.bold : fonts.regular;
  const color = options.color ?? COLORS.blue;
  const fitted = fitWrappedText(text, font, cell, options);
  fitted.lines.forEach((line, index) => {
    const width = textWidth(font, line, fitted.size);
    let x = cell.x + fitted.paddingX;
    if (options.align === "right") x = cell.x + cell.w - fitted.paddingX - width;
    if (options.align === "center") x = cell.x + (cell.w - width) / 2;
    page.drawText(line, {
      x,
      y: pdfY(cell, fitted.size, index, fitted.lineHeight),
      size: fitted.size,
      font,
      color,
    });
  });
}

function drawTextInCell(page, fonts, cell, value, options = {}) {
  drawWrappedTextInCell(page, fonts, cell, value, { ...options, size: options.size ?? 8.3 });
}

function drawMoneyInCell(page, fonts, cell, value, options = {}) {
  drawSingleLineInCell(page, fonts, cell, formatMoney(value), {
    ...options,
    align: "right",
    color: options.color ?? COLORS.text,
    size: options.size ?? 8.2,
  });
}

function drawDateInCell(page, fonts, cell, value, options = {}) {
  drawSingleLineInCell(page, fonts, cell, formatDate(value), {
    ...options,
    align: options.align ?? "center",
    color: options.color ?? COLORS.text,
    size: options.size ?? 7.4,
  });
}

async function drawSignatureInCell(pdfDoc, page, cell, signatureBuffer) {
  if (!signatureBuffer) return;
  try {
    const bytes = signatureBuffer instanceof Uint8Array ? signatureBuffer : Buffer.from(signatureBuffer);
    const signature = isJpeg(bytes) ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
    const maxW = cell.w - 4;
    const maxH = cell.h - 4;
    const scale = Math.min(maxW / signature.width, maxH / signature.height);
    const width = signature.width * scale;
    const height = signature.height * scale;
    page.drawImage(signature, {
      x: cell.x + (cell.w - width) / 2,
      y: PAGE.height - cell.y - cell.h + (cell.h - height) / 2,
      width,
      height,
    });
  } catch {
    drawTextInCell(page, { regular: await pdfDoc.embedFont(StandardFonts.Helvetica), bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold) }, cell, "Firma no renderizable", {
      color: COLORS.red,
      size: 5.5,
    });
  }
}

function isJpeg(bytes) {
  return bytes?.[0] === 0xff && bytes?.[1] === 0xd8;
}

function normalizeItems(items = []) {
  const normalizedItems = Array.isArray(items) && items.length > 0 ? items : [{
    referencia: "",
    descripcion: "Reparación según presupuesto",
    unidades: 1,
    precio_unitario: 0,
    line_total: 0,
  }];

  return normalizedItems.map((item) => {
    const unidades = Number(item.unidades ?? 0);
    const precioUnitario = Number(item.precio_unitario ?? 0);
    const lineTotal = Number(item.line_total ?? (unidades * precioUnitario));
    return {
      referencia: normalizeText(item.referencia),
      descripcion: normalizeText(item.descripcion, "Reparación según presupuesto"),
      unidades,
      precio_unitario: precioUnitario,
      line_total: lineTotal,
    };
  });
}

function paginateItems(items) {
  const pages = [];
  for (let index = 0; index < items.length; index += TABLE.rowsPerPage) {
    pages.push(items.slice(index, index + TABLE.rowsPerPage));
  }
  return pages.length > 0 ? pages : [[]];
}

function documentNumberFor(presupuesto) {
  return normalizeText(presupuesto.document_number, `PRE-${presupuesto.id ?? ""}`);
}

function machineDescription(presupuesto) {
  return [presupuesto.maquina_marca, presupuesto.maquina_modelo, presupuesto.maquina_tipo]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" · ");
}

function drawHeaderAndCustomer(page, fonts, presupuesto, pageIndex, pageCount) {
  drawTextInCell(page, fonts, CELL.checkboxPresupuesto, "X", {
    bold: true,
    align: "center",
    color: COLORS.text,
    size: 9,
  });
  drawSingleLineInCell(page, fonts, CELL.documentNumber, documentNumberFor(presupuesto), {
    bold: true,
    align: "right",
    color: COLORS.red,
    size: 6.8,
    minSize: 4.2,
  });

  drawTextInCell(page, fonts, CELL.cliente, presupuesto.cliente, { size: 8.4 });
  drawWrappedTextInCell(page, fonts, CELL.direccion, presupuesto.direccion, { size: 7.2, minSize: 4.1, lineHeightFactor: 0.98 });
  drawWrappedTextInCell(page, fonts, CELL.poblacion, presupuesto.poblacion, { size: 7.2, minSize: 4.2, lineHeightFactor: 0.98 });
  drawSingleLineInCell(page, fonts, CELL.cp, presupuesto.cp, { align: "center", color: COLORS.text, size: 7.4 });
  drawSingleLineInCell(page, fonts, CELL.telefono, presupuesto.telefono, { color: COLORS.text, size: 7.4 });
  drawTextInCell(page, fonts, CELL.cif, presupuesto.cif_cliente ?? presupuesto.nif_cliente ?? "", { align: "center", color: COLORS.text, size: 7.2 });
  drawWrappedTextInCell(page, fonts, CELL.email, presupuesto.email_cliente, { size: 6.2, minSize: 3.8, lineHeightFactor: 0.95 });
  drawTextInCell(page, fonts, CELL.pago, presupuesto.payment_terms ?? "", { color: COLORS.text, size: 7.2 });
  drawTextInCell(page, fonts, CELL.cuenta, presupuesto.account_number ?? "", { color: COLORS.text, size: 7.2 });

  drawTextInCell(page, fonts, CELL.tecnico, presupuesto.tecnico_nombre ?? presupuesto.firmado_tecnico_nombre ?? "", {
    color: COLORS.text,
    size: 6.4,
  });
  drawDateInCell(page, fonts, CELL.fecha1, presupuesto.issued_at ?? presupuesto.created_at ?? new Date());
  drawTextInCell(page, fonts, CELL.hInicio, presupuesto.hours_start ?? "", { color: COLORS.text, align: "center", size: 6.8 });
  drawTextInCell(page, fonts, CELL.hFinal, presupuesto.hours_end ?? "", { color: COLORS.text, align: "center", size: 6.8 });
  drawTextInCell(page, fonts, CELL.totalHoras, presupuesto.total_hours ?? "", { color: COLORS.text, align: "center", size: 6.8 });
  drawTextInCell(page, fonts, CELL.desplazamiento, presupuesto.desplazamiento_text ?? "", { color: COLORS.text, align: "center", size: 5.8 });
  drawTextInCell(page, fonts, CELL.portes, presupuesto.portes ?? "", { color: COLORS.text, size: 6.8 });
  drawTextInCell(page, fonts, CELL.plazoEntrega, presupuesto.plazo_entrega ?? "", { color: COLORS.text, size: 6.4 });
  drawWrappedTextInCell(page, fonts, CELL.direccionEntrega, presupuesto.delivery_address ?? presupuesto.ubicacion_operativa ?? "", {
    color: COLORS.text,
    size: 5.8,
  });
  drawTextInCell(page, fonts, CELL.telefonoEntrega, presupuesto.delivery_phone ?? presupuesto.telefono, {
    color: COLORS.text,
    size: 6.4,
  });

  if (pageCount > 1) {
    drawTextInCell(page, fonts, { x: 510, y: 35, w: 58, h: 12 }, `${pageIndex + 1}/${pageCount}`, {
      color: COLORS.muted,
      align: "right",
      size: 6,
    });
  }
}

function drawItems(page, fonts, items) {
  items.forEach((item, index) => {
    const rowTop = TABLE.top + index * TABLE.rowHeight + 1;
    const row = { y: rowTop, h: TABLE.rowHeight - 1.8 };
    drawTextInCell(page, fonts, { ...TABLE.columns.referencia, y: row.y, h: row.h }, item.referencia, {
      color: COLORS.text,
      size: 6.4,
    });
    drawWrappedTextInCell(page, fonts, { ...TABLE.columns.descripcion, y: row.y, h: row.h }, item.descripcion, {
      color: COLORS.text,
      size: 6.5,
      minSize: 4.7,
    });
    drawTextInCell(page, fonts, { ...TABLE.columns.unidades, y: row.y, h: row.h }, formatQuantity(item.unidades), {
      color: COLORS.text,
      align: "right",
      size: 6.4,
    });
    drawMoneyInCell(page, fonts, { ...TABLE.columns.precio, y: row.y, h: row.h }, item.precio_unitario, { size: 6.2 });
    drawMoneyInCell(page, fonts, { ...TABLE.columns.total, y: row.y, h: row.h }, item.line_total, { size: 6.4 });
  });
}

function drawFooterData(page, fonts, presupuesto, isLastPage) {
  drawTextInCell(page, fonts, CELL.serie, presupuesto.maquina_ns ?? presupuesto.numero_serie ?? "", {
    color: COLORS.text,
    size: 7.2,
  });
  drawTextInCell(page, fonts, CELL.modelo, machineDescription(presupuesto), {
    color: COLORS.text,
    size: 7.2,
  });

  const observations = isLastPage
    ? normalizeText(presupuesto.condiciones, "")
    : "Continúa en la página siguiente";
  drawWrappedTextInCell(page, fonts, CELL.observaciones, observations, {
    color: COLORS.text,
    size: 6.5,
    minSize: 4.9,
  });

  if (!isLastPage) return;

  drawMoneyInCell(page, fonts, CELL.base, presupuesto.base_imponible, { size: 7.2 });
  drawMoneyInCell(page, fonts, CELL.iva, presupuesto.iva_amount, { size: 7.2 });
  drawMoneyInCell(page, fonts, CELL.subtotal, presupuesto.base_imponible, { size: 7.2 });
  drawMoneyInCell(page, fonts, CELL.fianza, presupuesto.fianza ?? 0, { size: 7.2 });
  drawMoneyInCell(page, fonts, CELL.total, presupuesto.importe_total, { size: 7.4, color: COLORS.red });
}

async function drawSignatures(pdfDoc, page, fonts, presupuesto, isLastPage) {
  if (!isLastPage) return;

  await drawSignatureInCell(pdfDoc, page, CELL.firmaCliente, presupuesto.firma_cliente);
  drawDateInCell(page, fonts, CELL.fechaFirmaCliente, presupuesto.firmado_cliente_at, { size: 6.2 });
  await drawSignatureInCell(pdfDoc, page, CELL.firmaTecarral, presupuesto.firma_tecnico);
}

export async function generateRepairBudgetPdf({ presupuesto, stage = "ISSUED" }) {
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const templateDoc = await PDFDocument.load(templateBytes);
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  const items = normalizeItems(presupuesto.items);
  const itemPages = paginateItems(items);
  for (const [index] of itemPages.entries()) {
    const [copiedPage] = await pdfDoc.copyPages(templateDoc, [0]);
    pdfDoc.addPage(copiedPage);
    const page = copiedPage;
    const isLastPage = index === itemPages.length - 1;
    drawHeaderAndCustomer(page, fonts, presupuesto, index, itemPages.length);
    drawItems(page, fonts, itemPages[index]);
    drawFooterData(page, fonts, presupuesto, isLastPage);
    await drawSignatures(pdfDoc, page, fonts, presupuesto, isLastPage);
  }

  const bytes = Buffer.from(await pdfDoc.save());
  const documentNumber = documentNumberFor(presupuesto);
  return {
    content: bytes,
    mimeType: "application/pdf",
    filename: `${documentNumber}${stage === "ISSUED" ? "-emitido" : "-firmado"}.pdf`,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}



