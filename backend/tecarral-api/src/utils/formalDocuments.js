import { SERVICE_CONTRACT_TYPES } from "../constants/serviceContract.js";

const COMPANY = Object.freeze({
  nombre: "Tecarral Carretillas, S.L.",
  direccion: "C/ La Venta, n.º 2 - P.E. Neinor Henares, Edificio 11, Nave 14",
  poblacion: "28880 Meco (Madrid)",
  telefono: "91 830 72 81",
  email: "rodriguezcamarmoldiego@gmail.com",
  iban: "ES31 2100 5671 2202 0000 6035",
});

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDateEs(value, fallback = "-") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00.000Z` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(date);
}

export function formatDateTimeEs(value, fallback = "-") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid",
  }).format(date);
}

export function formatMoneyEs(value, fallback = "-") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    const raw = String(value ?? "").trim();
    return raw || fallback;
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function normalizeContractMachines(contract) {
  if (Array.isArray(contract?.machines) && contract.machines.length > 0) {
    return contract.machines;
  }

  return [
    contract?.id_maquina
      ? {
          id_maquina: contract.id_maquina,
          marca: contract.maquina_marca ?? null,
          modelo: contract.maquina_modelo ?? null,
          ns: contract.maquina_ns ?? null,
          tipo: contract.maquina_tipo ?? contract.tipo ?? null,
          motor: contract.maquina_motor ?? contract.motor ?? null,
        }
      : null,
  ].filter(Boolean);
}

function contractCoverageCopy(contractType) {
  if (contractType === SERVICE_CONTRACT_TYPES.TODO_INCLUIDO) {
    return {
      title: "Mantenimiento todo incluido",
      incluye: [
        "Desplazamiento, mano de obra del servicio técnico y materiales de revisión.",
        "Prioridad en la atención de averías.",
        "Averías por desgaste o uso normal incluidas en el contrato.",
      ],
      noIncluye: [
        "Averías originadas por golpes o accidentes.",
        "Daños por negligencia, impericia o mal uso de la máquina.",
      ],
      clause:
        "Las averías derivadas de desgaste o uso normal quedan cubiertas por Tecarral. Si la causa fuese golpe, accidente o mal uso, el coste corresponderá al cliente.",
    };
  }

  return {
    title: "Mantenimiento preventivo",
    incluye: [
      "Desplazamiento, mano de obra del servicio técnico y materiales necesarios para revisión.",
      "Prioridad en la atención de averías.",
      "Visitas periódicas de mantenimiento preventivo.",
    ],
    noIncluye: [
      "Averías y reparaciones correctivas.",
      "Recambios detectados durante la revisión que requieran presupuesto posterior.",
    ],
    clause:
      "Las averías detectadas durante las revisiones se comunicarán al cliente y, previa conformidad, serán reparadas a su cargo en la fecha y hora acordadas.",
  };
}

export function buildServiceContractFormalSnapshot(contract, signatures = []) {
  const machines = normalizeContractMachines(contract);
  const copy = contractCoverageCopy(contract.contract_type);
  const recurrenceLabel = String(contract.recurrencia_unidad ?? "").trim().toUpperCase();
  const recurrenceText =
    recurrenceLabel === "WEEK"
      ? `Semanal · día ${contract.maintenance_weekday ?? "-"}`
      : recurrenceLabel === "MONTH"
        ? `Mensual · día ${contract.maintenance_day_of_month ?? "-"}`
        : recurrenceLabel === "YEAR"
          ? `Anual`
          : recurrenceLabel === "DAY"
            ? `Cada ${contract.recurrencia_valor ?? 1} día(s)`
            : "-";

  const machineRows = machines
    .map((machine) => `
      <tr>
        <td class="cell">#${escapeHtml(machine.id_maquina)}</td>
        <td class="cell">${escapeHtml(machine.marca ?? "-")}</td>
        <td class="cell">${escapeHtml(machine.modelo ?? "-")}</td>
        <td class="cell">${escapeHtml(machine.ns ?? "-")}</td>
        <td class="cell">${escapeHtml(machine.tipo ?? contract.tipo ?? "-")}</td>
        <td class="cell">${escapeHtml(machine.motor ?? contract.motor ?? "-")}</td>
        <td class="cell right">${formatMoneyEs(contract.tarifa_fija)}</td>
      </tr>`)
    .join("");

  const signatureBlocks = [
    { role: "Cliente", found: signatures.find((item) => item.signer_type === "CLIENTE") ?? null },
    { role: "Tecarral", found: signatures.find((item) => item.signer_type === "TECARRAL") ?? null },
  ]
    .map(({ role, found }) => `
      <div class="signature-box">
        <div class="signature-role">${role}</div>
        <div class="signature-name">${escapeHtml(found?.signer_name ?? "Pendiente de firma")}</div>
        <div class="signature-date">${found?.signed_at ? formatDateTimeEs(found.signed_at) : "-"}</div>
      </div>`)
    .join("");

  const includesList = copy.incluye.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const excludesList = copy.noIncluye.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contrato de mantenimiento ${escapeHtml(contract.document_number ?? "")}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color:#143256; margin:0; padding:24px; background:#f7f9fc; }
    .sheet { max-width:900px; margin:0 auto; background:#fff; border:1px solid #d8e2f0; padding:28px; }
    .topbar { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; border-bottom:2px solid #1e5aa6; padding-bottom:14px; }
    .title { font-size:24px; font-weight:700; margin:0; }
    .muted { color:#58708f; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:20px; }
    .panel { border:1px solid #d8e2f0; border-radius:8px; padding:14px; }
    .panel h3 { margin:0 0 10px; font-size:16px; }
    table { width:100%; border-collapse:collapse; margin-top:18px; }
    th { text-align:left; font-size:12px; background:#edf4fb; padding:8px; border:1px solid #d8e2f0; }
    .cell { padding:8px; border:1px solid #d8e2f0; font-size:13px; vertical-align:top; }
    .right { text-align:right; }
    .section-title { font-size:17px; font-weight:700; margin:24px 0 10px; }
    ul { margin:8px 0 0 18px; padding:0; }
    li { margin:4px 0; }
    .clause { border-left:4px solid #1e5aa6; padding:10px 12px; background:#f4f8fd; margin-top:12px; }
    .signatures { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:24px; }
    .signature-box { border:1px solid #d8e2f0; min-height:120px; padding:12px; display:flex; flex-direction:column; justify-content:flex-end; }
    .signature-role { font-weight:700; margin-bottom:30px; }
    .signature-name { font-weight:600; }
    .signature-date { color:#58708f; font-size:12px; margin-top:4px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="topbar">
      <div>
        <p class="title">${escapeHtml(copy.title)}</p>
        <p class="muted">Contrato n.º ${escapeHtml(contract.document_number ?? `CTR-${contract.id ?? "-"}`)}</p>
      </div>
      <div>
        <div><strong>${escapeHtml(COMPANY.nombre)}</strong></div>
        <div class="muted">${escapeHtml(COMPANY.direccion)}</div>
        <div class="muted">${escapeHtml(COMPANY.poblacion)}</div>
        <div class="muted">Tel. ${escapeHtml(COMPANY.telefono)}</div>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <h3>Datos de la empresa cliente</h3>
        <div><strong>Empresa:</strong> ${escapeHtml(contract.cliente_nombre ?? "-")}</div>
        <div><strong>Dirección:</strong> ${escapeHtml(contract.cliente_direccion ?? "-")}</div>
        <div><strong>Localidad:</strong> ${escapeHtml(contract.cliente_poblacion ?? "-")}</div>
        <div><strong>C.P.:</strong> ${escapeHtml(contract.cliente_cp ?? "-")}</div>
        <div><strong>Teléfono:</strong> ${escapeHtml(contract.cliente_telefono ?? "-")}</div>
        <div><strong>Email:</strong> ${escapeHtml(contract.cliente_email ?? "-")}</div>
      </div>
      <div class="panel">
        <h3>Condiciones particulares</h3>
        <div><strong>Duración:</strong> ${formatDateEs(contract.start_date)} - ${formatDateEs(contract.end_date, "Sin fecha fin")}</div>
        <div><strong>Frecuencia:</strong> ${escapeHtml(recurrenceText)}</div>
        <div><strong>Precio total:</strong> ${formatMoneyEs(contract.tarifa_fija)}</div>
        <div><strong>Método de pago:</strong> Transferencia bancaria</div>
        <div><strong>IBAN:</strong> ${escapeHtml(COMPANY.iban)}</div>
      </div>
    </div>

    <div class="section-title">Máquinas incluidas</div>
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Marca</th><th>Modelo</th><th>N.º de fábrica</th><th>Tipo</th><th>Motor</th><th>Precio mantenimiento</th>
        </tr>
      </thead>
      <tbody>${machineRows}</tbody>
    </table>

    <div class="section-title">Cobertura del servicio</div>
    <div class="grid">
      <div class="panel">
        <h3>Incluye</h3>
        <ul>${includesList}</ul>
      </div>
      <div class="panel">
        <h3>No incluye</h3>
        <ul>${excludesList}</ul>
      </div>
    </div>

    <div class="clause">${escapeHtml(copy.clause)}</div>

    <div class="section-title">Condiciones adicionales</div>
    <div>${escapeHtml(contract.condiciones ?? "Sin condiciones adicionales indicadas.")}</div>

    <div class="section-title">Firmas</div>
    <div class="signatures">${signatureBlocks}</div>
  </div>
</body>
</html>`;
}

export function buildRepairBudgetFormalSnapshot({ presupuesto, propuesta, reparacion, publicUrl }) {
  const coverageLabel = presupuesto.coverage_decision === "TECARRAL" ? "Cubierto por Tecarral" : "A cargo del cliente";
  const machineLabel = [reparacion?.marca, reparacion?.modelo].filter(Boolean).join(" ").trim();

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Presupuesto ${escapeHtml(presupuesto.document_number ?? "")}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color:#143256; margin:0; padding:24px; background:#f7f9fc; }
    .sheet { max-width:900px; margin:0 auto; background:#fff; border:1px solid #d8e2f0; padding:28px; }
    .topbar { display:flex; justify-content:space-between; gap:16px; border-bottom:2px solid #1e5aa6; padding-bottom:14px; }
    .title { font-size:24px; font-weight:700; margin:0; }
    .muted { color:#58708f; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:20px; }
    .panel { border:1px solid #d8e2f0; border-radius:8px; padding:14px; }
    .panel h3 { margin:0 0 10px; font-size:16px; }
    .total { margin-top:18px; font-size:28px; font-weight:700; color:#1e5aa6; }
    .callout { margin-top:18px; border-left:4px solid #1e5aa6; background:#f4f8fd; padding:10px 12px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="topbar">
      <div>
        <p class="title">Presupuesto de reparación</p>
        <p class="muted">Referencia ${escapeHtml(presupuesto.document_number ?? `PRE-${presupuesto.id ?? "-"}`)}</p>
      </div>
      <div>
        <div><strong>${escapeHtml(COMPANY.nombre)}</strong></div>
        <div class="muted">${escapeHtml(COMPANY.direccion)}</div>
        <div class="muted">${escapeHtml(COMPANY.poblacion)}</div>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <h3>Datos del cliente</h3>
        <div><strong>Cliente:</strong> ${escapeHtml(propuesta?.cliente ?? "-")}</div>
        <div><strong>Email:</strong> ${escapeHtml(propuesta?.email_cliente ?? "-")}</div>
        <div><strong>Teléfono:</strong> ${escapeHtml(propuesta?.telefono ?? "-")}</div>
        <div><strong>Dirección:</strong> ${escapeHtml(propuesta?.direccion ?? "-")}</div>
        <div><strong>Población:</strong> ${escapeHtml(propuesta?.poblacion ?? "-")}</div>
        <div><strong>C.P.:</strong> ${escapeHtml(propuesta?.cp ?? "-")}</div>
      </div>
      <div class="panel">
        <h3>Datos de la máquina</h3>
        <div><strong>ID máquina:</strong> #${escapeHtml(reparacion?.id_maquina ?? "-")}</div>
        <div><strong>Equipo:</strong> ${escapeHtml(machineLabel || "-")}</div>
        <div><strong>N.º de serie:</strong> ${escapeHtml(reparacion?.ns ?? propuesta?.ns ?? "-")}</div>
        <div><strong>Estado de reparación:</strong> ${escapeHtml(reparacion?.estado ?? presupuesto?.reparacion_estado ?? "-")}</div>
        <div><strong>Cobertura:</strong> ${escapeHtml(coverageLabel)}</div>
        <div><strong>Motivo:</strong> ${escapeHtml(presupuesto.coverage_reason ?? presupuesto.charge_reason ?? "-")}</div>
      </div>
    </div>

    <div class="total">Importe total: ${formatMoneyEs(presupuesto.importe_total)}</div>

    <div class="callout">
      <div><strong>Condiciones:</strong> ${escapeHtml(presupuesto.condiciones ?? "-")}</div>
      <div><strong>Válido hasta:</strong> ${formatDateTimeEs(presupuesto.expira_at)}</div>
      <div><strong>Firma del cliente:</strong> ${publicUrl ? escapeHtml(publicUrl) : "No aplica"}</div>
    </div>
  </div>
</body>
</html>`;
}

export function buildAlbaranFormalSnapshot(data) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Albarán ${escapeHtml(data.document_number ?? "")}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color:#143256; margin:0; padding:24px; background:#f7f9fc; }
    .sheet { max-width:900px; margin:0 auto; background:#fff; border:1px solid #d8e2f0; padding:28px; }
    .topbar { display:flex; justify-content:space-between; gap:16px; border-bottom:2px solid #1e5aa6; padding-bottom:14px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:20px; }
    .panel { border:1px solid #d8e2f0; border-radius:8px; padding:14px; }
    .title { font-size:24px; font-weight:700; margin:0; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="topbar">
      <div>
        <p class="title">Albarán de servicio técnico</p>
        <p>Referencia ${escapeHtml(data.document_number ?? `ALB-${data.id_albaran ?? "-"}`)}</p>
      </div>
      <div>
        <div><strong>${escapeHtml(COMPANY.nombre)}</strong></div>
        <div>${escapeHtml(COMPANY.telefono)}</div>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <div><strong>Cliente:</strong> ${escapeHtml(data.cliente ?? "-")}</div>
        <div><strong>Email:</strong> ${escapeHtml(data.email_cliente ?? "-")}</div>
        <div><strong>Teléfono:</strong> ${escapeHtml(data.telefono ?? "-")}</div>
        <div><strong>Dirección:</strong> ${escapeHtml(data.direccion ?? "-")}</div>
        <div><strong>Población:</strong> ${escapeHtml(data.poblacion ?? "-")}</div>
        <div><strong>C.P.:</strong> ${escapeHtml(data.cp ?? "-")}</div>
      </div>
      <div class="panel">
        <div><strong>Tipo documental:</strong> ${escapeHtml(data.document_kind ?? "ALBARÁN")}</div>
        <div><strong>Máquina:</strong> #${escapeHtml(data.id_maquina ?? "-")}</div>
        <div><strong>Estado:</strong> ${escapeHtml(data.estado ?? "-")}</div>
        <div><strong>Modalidad de cobro:</strong> ${escapeHtml(data.pricing_mode ?? "-")}</div>
        <div><strong>Base económica:</strong> ${formatMoneyEs(data.pricing_base_amount)}</div>
      </div>
    </div>

    <div class="panel" style="margin-top:18px;">
      <div><strong>Observaciones / trabajos realizados:</strong></div>
      <div>${escapeHtml(data.observaciones ?? "-")}</div>
    </div>
  </div>
</body>
</html>`;
}
