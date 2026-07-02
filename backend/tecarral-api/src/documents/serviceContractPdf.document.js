import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import PDFDocument from "pdfkit";

import { SERVICE_CONTRACT_TYPES } from "../constants/serviceContract.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "../assets/tecarral-logo.jpg");

const COMPANY = Object.freeze({
  name: "Tecarral Carretillas, S.L.",
  address: "C/ La Venta, n.º 2 - P.E. Neinor Henares, Edificio 11, Nave 14",
  postal: "28880 Meco (Madrid)",
  phone: "91 830 72 81",
  email: "tecarral@tecarral.com",
  iban: "ES31 2100 5671 2202 0000 6035",
});

function asText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function money(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "-";
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(numeric);
}

function date(value, fallback = "-") {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function normalizeMachines(contract) {
  if (Array.isArray(contract?.machines) && contract.machines.length > 0) {
    return contract.machines;
  }

  return [
    contract?.id_maquina
      ? {
          id_maquina: contract.id_maquina,
          marca: contract.maquina_marca,
          modelo: contract.maquina_modelo,
          ns: contract.maquina_ns,
          tipo: contract.maquina_tipo ?? contract.tipo,
          motor: contract.maquina_motor ?? contract.motor,
        }
      : null,
  ].filter(Boolean);
}

function recurrenceText(contract) {
  const unit = String(contract?.recurrencia_unidad ?? "").trim().toUpperCase();

  if (unit === "WEEK") {
    const weekdays = {
      1: "lunes",
      2: "martes",
      3: "miércoles",
      4: "jueves",
      5: "viernes",
      6: "sábado",
      7: "domingo",
    };
    return `Semanal, ${weekdays[contract.maintenance_weekday] ?? "día pendiente"}`;
  }

  if (unit === "MONTH") {
    return `Mensual, día ${asText(contract.maintenance_day_of_month)}`;
  }

  if (unit === "YEAR") {
    return "Anual";
  }

  if (unit === "DAY") {
    return `Cada ${Number(contract.recurrencia_valor ?? 1)} día(s)`;
  }

  return "-";
}

function coverageCopy(contractType) {
  if (contractType === SERVICE_CONTRACT_TYPES.TODO_INCLUIDO) {
    return {
      title: "CONTRATO DE MANTENIMIENTO TODO INCLUIDO PROGRAMADO",
      includes: [
        "Desplazamiento, mano de obra del servicio técnico y materiales necesarios para revisión.",
        "Prioridad en la atención de averías.",
        "Averías por desgaste o uso normal incluidas dentro del contrato.",
      ],
      excludes: [
        "Averías originadas por golpes o accidentes.",
        "Daños por negligencia, impericia, mal uso de la máquina o intervención de terceros.",
        "Cualquier reparaciÃ³n no vinculada al uso normal de la máquina cubierta.",
      ],
      paragraph:
        "Las averías no causadas por golpe, accidente, negligencia, impericia o mal uso quedarÃ¡n cubiertas por Tecarral dentro del contrato todo incluido.",
    };
  }

  return {
    title: "CONTRATO DE MANTENIMIENTO PREVENTIVO PROGRAMADO",
    includes: [
      "Desplazamiento, mano de obra del servicio técnico y materiales necesarios para revisión.",
      "Desulfatación de batería, grasa, grasa en spray, aceite motor y filtros para máquinas de combustión interna cuando proceda.",
      "Prioridad en la atención de averías.",
    ],
    excludes: [
      "Averías.",
      "Recambios o materiales detectados durante la revisión que no puedan contabilizarse antes de la visita.",
      "Reparaciones derivadas del desgaste o estado de averÃ­a de la máquina, de las cuales se hará presupuesto.",
    ],
    paragraph:
      "Las averías detectadas durante una revisión serán comunicadas al cliente y, previa conformidad por su parte, se resolverán a su cargo mediante presupuesto.",
  };
}

function signatureFor(signatures, signerType) {
  return signatures.find((item) => item.signer_type === signerType) ?? null;
}

function imageBuffer(signature) {
  const image = signature?.signature_image;
  if (!image) {
    return null;
  }

  return Buffer.isBuffer(image) ? image : Buffer.from(image);
}

function drawLabelValue(doc, label, value, x, y, width, options = {}) {
  const labelWidth = options.labelWidth ?? 82;
  const fontSize = options.fontSize ?? 8;
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#111").text(label, x, y, { width: labelWidth });
  doc.font("Helvetica").fontSize(fontSize).fillColor("#0f315d").text(asText(value), x + labelWidth, y, {
    width: Math.max(width - labelWidth, 40),
    height: options.height ?? 13,
    ellipsis: options.ellipsis ?? true,
    lineBreak: options.lineBreak ?? true,
  });
}

function drawSectionTitle(doc, title, y) {
  doc
    .rect(42, y, 511, 18)
    .fill("#e8edf3")
    .stroke("#9aa7b8")
    .fillColor("#111")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(title, 48, y + 5);
}

function drawTableHeader(doc, columns, y) {
  doc.rect(42, y, 511, 18).fill("#f0f3f6").stroke("#9aa7b8");
  let x = 42;
  for (const column of columns) {
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor("#111")
      .text(column.label, x + 3, y + 5, { width: column.width - 6, align: column.align ?? "left" });
    doc.moveTo(x, y).lineTo(x, y + 18).stroke("#9aa7b8");
    x += column.width;
  }
  doc.moveTo(553, y).lineTo(553, y + 18).stroke("#9aa7b8");
}

function drawMachineRows(doc, machines, y) {
  const columns = [
    { label: "Marca", width: 78 },
    { label: "Modelo", width: 96 },
    { label: "N.º fábrica", width: 92 },
    { label: "Tipo", width: 80 },
    { label: "Motor", width: 70 },
    { label: "Precio", width: 95, align: "right" },
  ];

  drawTableHeader(doc, columns, y);
  let rowY = y + 18;

  for (const machine of machines.slice(0, 6)) {
    const values = [
      machine.marca,
      machine.modelo,
      machine.ns,
      machine.tipo,
      machine.motor,
      machine.precio_mantenimiento ?? null,
    ];
    let x = 42;
    doc.rect(42, rowY, 511, 22).stroke("#9aa7b8");
    for (let index = 0; index < columns.length; index += 1) {
      const value = index === 5 ? money(values[index]) : asText(values[index], "");
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#111")
        .text(value, x + 3, rowY + 6, {
          width: columns[index].width - 6,
          align: columns[index].align ?? "left",
        });
      doc.moveTo(x, rowY).lineTo(x, rowY + 22).stroke("#9aa7b8");
      x += columns[index].width;
    }
    doc.moveTo(553, rowY).lineTo(553, rowY + 22).stroke("#9aa7b8");
    rowY += 22;
  }

  return rowY + 8;
}

function drawBullets(doc, title, items, x, y, width) {
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#111").text(title, x, y, { width });
  let cursor = y + 13;
  for (const item of items) {
    const height = doc.heightOfString(item, { width: width - 14, lineGap: 1 });
    doc.font("Helvetica").fontSize(8).fillColor("#111").text("•", x + 2, cursor);
    doc.text(item, x + 14, cursor, { width: width - 14, lineGap: 1 });
    cursor += Math.max(height, 10) + 3;
  }
  return cursor;
}


function drawReviewOperations(doc, x, y, width, items) {
  let cursor = y;
  doc.font("Helvetica").fontSize(8.3).fillColor("#111");
  for (const item of items) {
    const height = doc.heightOfString(item, { width: width - 18, lineGap: 0 });
    doc.text("?", x, cursor);
    doc.text(item, x + 18, cursor, { width: width - 18, lineGap: 0 });
    cursor += Math.max(height, 9.5) + 2;
  }
  return cursor;
}

function drawGeneralConditionsPage(doc, contractType) {
  const isAllIncluded = contractType === SERVICE_CONTRACT_TYPES.TODO_INCLUIDO;
  doc.addPage();

  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text("CONDICIONES GENERALES", 42, 42, {
    width: 511,
    align: "center",
  });

  doc.font("Helvetica").fontSize(8.5).fillColor("#111").text(
    "1.- Las operaciones a realizar en cada una de las revisiones ser?n las indicadas a continuaci?n:",
    42,
    78,
    { width: 511 }
  );

  const leftOperations = [
    "Inspecci?n visual.",
    "Prueba general de funcionamiento.",
    "Revisar fugas de aceite.",
    "Revisar sistema de frenado.",
    "Comprobar funcionamiento de la direcci?n.",
    "Comprobar paneles conductores.",
    "Revisar todas las conexiones.",
    "Revisar controles el?ctricos.",
    "Lectura tensiones e intensidades.",
    "Revisar sistema electr?nico de tracci?n y elevaci?n.",
    "Comprobar funcionamiento motores.",
  ];

  const rightOperations = [
    "Comprobar tapones y alojamiento bater?a.",
    "Comprobaci?n tensi?n bater?a.",
    "Engrase general.",
    "Comprobaci?n inversor.",
    "Revisar desconectador.",
    "Comprobar pinzas conexi?n.",
    "Comprobaci?n funcionamiento cargador.",
    "Funcionamiento implementos.",
    "Comprobar deslizamientos y velocidades de inclinaci?n, desplazamientos y elevaci?n.",
  ];

  const leftEnd = drawReviewOperations(doc, 42, 112, 230, leftOperations);
  const rightEnd = drawReviewOperations(doc, 300, 112, 240, rightOperations);
  let cursor = Math.max(leftEnd, rightEnd) + 34;

  const paragraphs = [
    "TECARRAL CARRETILLAS, S.L., se compromete a realizar las operaciones de mantenimiento descritas en el punto anterior de forma peri?dica.",
    "1.- Las aver?as que sean detectadas durante una de las revisiones pertenecientes al presente servicio, ser?n comunicadas al cliente y previa conformidad por su parte, ser?n resueltas a su cargo en la fecha y hora acordada por ambas partes.",
    isAllIncluded
      ? "2.- En el precio especificado en el apartado precio de las condiciones del contrato se incluyen la mano de obra, tiempo de desplazamiento, kilometraje, materiales de revisi?n y reparaciones por desgaste o uso normal, a excepci?n de las aver?as originadas por accidentes, negligencias o impericia."
      : "2.- En el precio especificado en el apartado precio de las condiciones del contrato se incluyen la mano de obra, tiempo de desplazamiento, kilometraje y materiales de reparaci?n a excepci?n de las aver?as originadas por accidentes, negligencias o impericia.",
    "3.- TECARRAL CARRETILLAS, S.L. concede a todos sus clientes una garant?a total de tres meses de las reparaciones efectuadas, excepto si se detecta que ha habido un mal uso de la m?quina o negligencia por parte del usuario.",
    "4.- La forma de pago acordada ser? a trav?s de transferencia bancaria a nombre de TECARRAL CARRETILLAS, S.L.",
    "5.- El presente documento se renovar? autom?ticamente a su vencimiento con el nuevo precio en vigor y solo podr? ser rescindido por una de las partes mediante notificaci?n firmada por los representantes de las empresas firmantes.",
  ];

  for (const paragraph of paragraphs) {
    const height = doc.heightOfString(paragraph, { width: 511, lineGap: 2 });
    if (cursor + height > 760) {
      doc.addPage();
      cursor = 42;
    }

    if (paragraph.startsWith("3.-")) {
      const [before, after] = paragraph.split("garant?a total de tres meses");
      doc.font("Helvetica").fontSize(8.5).fillColor("#111").text(before, 42, cursor, {
        width: 511,
        continued: true,
        lineGap: 2,
      });
      doc.font("Helvetica-Bold").text("garant?a total de tres meses", { continued: true });
      doc.font("Helvetica").text(after, { width: 511, lineGap: 2 });
    } else {
      doc.font("Helvetica").fontSize(8.5).fillColor("#111").text(paragraph, 42, cursor, { width: 511, lineGap: 2 });
    }

    cursor += height + 13;
  }

  return cursor;
}

function drawSignature(doc, signature, label, x, y) {
  doc.rect(x, y, 230, 76).stroke("#9aa7b8");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#111").text(label, x + 8, y + 6);

  const buffer = imageBuffer(signature);
  if (buffer) {
    try {
      doc.image(buffer, x + 12, y + 20, { fit: [205, 38], align: "center", valign: "center" });
    } catch {
      doc.font("Helvetica").fontSize(7).fillColor("#8a1f11").text("Firma no renderizable", x + 12, y + 30);
    }
  } else {
    doc.font("Helvetica").fontSize(8).fillColor("#777").text("Pendiente de firma", x + 12, y + 32);
  }

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#333")
    .text(asText(signature?.signer_name, "-"), x + 8, y + 61, { width: 130 })
    .text(date(signature?.signed_at), x + 150, y + 61, { width: 70, align: "right" });
}

export async function generateServiceContractPdf({ contract, signatures = [], stage = "ISSUED" }) {
  const chunks = [];
  const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
  const copy = coverageCopy(contract.contract_type);
  const machines = normalizeMachines(contract);
  const documentNumber = asText(contract.document_number, `CTR-${contract.id}`);

  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 350, 32, { fit: [185, 54] });
  } else {
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#0b5c9d").text("TECARRAL", 390, 38);
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#111")
    .text(copy.title, 42, 42, { width: 295, lineGap: 1 });
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#9b1c1c").text(documentNumber, 430, 98, {
    width: 105,
    align: "right",
  });
  doc.font("Helvetica").fontSize(7).fillColor("#111").text("MAQUINARIA DE ELEVACIÓN", 42, 88);

  drawSectionTitle(doc, "CONDICIONES PARTICULARES", 124);
  doc.rect(42, 150, 245, 126).stroke("#9aa7b8");
  doc.rect(300, 150, 253, 126).stroke("#9aa7b8");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111").text("Datos de la empresa", 50, 158);
  drawLabelValue(doc, "Empresa:", contract.cliente_nombre, 50, 178, 225, { labelWidth: 72, fontSize: 8 });
  drawLabelValue(doc, "Dirección:", contract.cliente_direccion, 50, 195, 225, { labelWidth: 72, fontSize: 7.5, height: 18 });
  drawLabelValue(doc, "Población:", contract.cliente_poblacion, 50, 214, 225, { labelWidth: 72, fontSize: 8 });
  drawLabelValue(doc, "C.P.:", contract.cliente_cp, 50, 231, 225, { labelWidth: 72, fontSize: 8, lineBreak: false });
  drawLabelValue(doc, "Teléfono:", contract.cliente_telefono, 50, 248, 225, { labelWidth: 72, fontSize: 8, lineBreak: false });
  drawLabelValue(doc, "E-mail:", contract.cliente_email, 50, 264, 225, { labelWidth: 72, fontSize: 6.8, height: 10, lineBreak: false });

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111").text("Tecarral Carretillas, S.L.", 308, 158);
  doc.font("Helvetica").fontSize(8).fillColor("#111").text(COMPANY.address, 308, 178, { width: 230 });
  doc.text(COMPANY.postal, 308, 209);
  doc.text(`Tel.: ${COMPANY.phone}`, 308, 226);
  doc.text(`IBAN: ${COMPANY.iban}`, 308, 243, { width: 230 });

  drawSectionTitle(doc, "Datos de la máquina", 292);
  let cursor = drawMachineRows(doc, machines, 316);

  drawSectionTitle(doc, "Condiciones particulares del contrato", cursor);
  cursor += 26;
  drawLabelValue(doc, "Duración:", `${date(contract.start_date)} - ${date(contract.end_date, "Sin fecha fin")}`, 50, cursor, 250);
  drawLabelValue(doc, "Frecuencia:", recurrenceText(contract), 312, cursor, 220);
  cursor += 18;
  drawLabelValue(doc, "Precio total:", money(contract.tarifa_fija), 50, cursor, 180);
  drawLabelValue(doc, "Método de pago:", "Transferencia bancaria", 312, cursor, 220);
  cursor += 32;

  doc.rect(42, cursor - 8, 511, 120).stroke("#9aa7b8");
  const leftEnd = drawBullets(doc, "INCLUYE:", copy.includes, 52, cursor, 235);
  const rightEnd = drawBullets(doc, "NO INCLUYE:", copy.excludes, 305, cursor, 235);
  cursor = Math.max(leftEnd, rightEnd) + 10;

  cursor = drawGeneralConditionsPage(doc, contract.contract_type);

  if (cursor > 650) {
    doc.addPage();
    cursor = 42;
  }

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#111").text(`Estado documental: ${stage}`, 42, cursor + 4);
  drawSignature(doc, signatureFor(signatures, "CLIENTE"), "Cliente, firma y sello", 42, cursor + 24);
  drawSignature(doc, signatureFor(signatures, "TECARRAL"), "Tecarral Carretillas, S.L.", 323, cursor + 24);

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i += 1) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#777")
      .text(`${COMPANY.name} · ${COMPANY.address} · ${COMPANY.postal}`, 42, 808, {
        width: 511,
        align: "center",
      });
  }

  doc.end();
  return done;
}

