import { hashPublicToken } from "../utils/publicToken.js";
import { validatePublicTokenParam } from "../schemas/publicPresupuestoReparacion.schema.js";
import {
  findByPublicTokenHash,
  acceptPresupuestoAtomic,
  rejectPresupuestoAtomic,
} from "../repositories/publicPresupuestoReparacion.repository.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoneyES(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "No disponible";
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateES(value) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderMessage(message) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Presupuesto de reparación</title>
</head>
<body style="font-family: system-ui, Arial; padding: 24px; max-width: 720px; margin: 0 auto;">
  <h2>Presupuesto de reparación</h2>
  <p>${escapeHtml(message)}</p>
</body>
</html>`;
}

function renderPresupuesto(presupuesto, token, options) {
  const base = `/public/presupuestos-reparacion/${encodeURIComponent(token)}`;
  const acceptUrl = `${base}/accept`;
  const rejectUrl = `${base}/reject`;

  const maquinaLabel = [
    presupuesto.maquina_tipo,
    presupuesto.maquina_marca,
    presupuesto.maquina_modelo,
  ]
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0)
    .join(" - ");

  const rows = [
    ["Cliente", presupuesto.cliente],
    ["Email", presupuesto.email_cliente],
    ["Teléfono", presupuesto.telefono],
    ["Dirección", presupuesto.direccion],
    ["CP", presupuesto.cp],
    ["Población", presupuesto.poblacion],
    ["Importe total", formatMoneyES(presupuesto.importe_total)],
    ["Condiciones", presupuesto.condiciones ?? "No disponible"],
    ["Válido hasta", formatDateES(presupuesto.expira_at)],
    ["Estado presupuesto", presupuesto.estado],
    ["Estado reparación", presupuesto.reparacion_estado],
    ["Máquina", maquinaLabel.length > 0 ? maquinaLabel : "No disponible"],
  ];

  const rowsHtml = rows
    .map(([key, value]) => {
      return `<tr>
        <td style="padding:6px 8px; font-weight:600;">${escapeHtml(key)}</td>
        <td style="padding:6px 8px;">${escapeHtml(value ?? "No disponible")}</td>
      </tr>`;
    })
    .join("");

  const messageHtml =
    options.mode === "MESSAGE"
      ? `<p style="margin-top:16px; font-weight:600;">${escapeHtml(options.message ?? "")}</p>`
      : "";

  const actionsHtml =
    options.mode === "ACTIONS"
      ? `<form method="post" action="${acceptUrl}" style="display:inline;">
           <button type="submit" style="padding:10px 14px; margin-right:8px;">Aceptar</button>
         </form>
         <form method="post" action="${rejectUrl}" style="display:inline;">
           <button type="submit" style="padding:10px 14px;">Rechazar</button>
         </form>`
      : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Presupuesto de reparación</title>
</head>
<body style="font-family: system-ui, Arial; padding: 24px; max-width: 720px; margin: 0 auto;">
  <h2>Presupuesto de reparación</h2>

  <table style="border-collapse: collapse; width: 100%; margin-top: 12px;">
    <tbody>${rowsHtml}</tbody>
  </table>

  ${messageHtml}

  <div style="margin-top: 16px;">
    ${actionsHtml}
  </div>
</body>
</html>`;
}

export async function getHtml(token) {
  const validation = validatePublicTokenParam(token);

  if (!validation.ok) {
    return renderMessage("Enlace no válido");
  }

  const tokenHash = hashPublicToken(validation.token);
  const presupuesto = await findByPublicTokenHash(tokenHash);

  if (!presupuesto) {
    return renderMessage("Enlace no válido");
  }

  const isExpired =
    presupuesto.expira_at !== null &&
    new Date(presupuesto.expira_at).getTime() <= Date.now();

  if (presupuesto.estado === "PENDING" && !isExpired) {
    return renderPresupuesto(presupuesto, validation.token, {
      mode: "ACTIONS",
    });
  }

  if (presupuesto.estado === "ACEPTADA") {
    return renderPresupuesto(presupuesto, validation.token, {
      mode: "MESSAGE",
      message: "Presupuesto ya aceptado.",
    });
  }

  if (presupuesto.estado === "RECHAZADA") {
    return renderPresupuesto(presupuesto, validation.token, {
      mode: "MESSAGE",
      message: "Presupuesto rechazado.",
    });
  }

  if (presupuesto.estado === "FINALIZADA") {
    return renderPresupuesto(presupuesto, validation.token, {
      mode: "MESSAGE",
      message: "Presupuesto finalizado.",
    });
  }

  return renderPresupuesto(presupuesto, validation.token, {
    mode: "MESSAGE",
    message: "Presupuesto expirado.",
  });
}

export async function accept(token) {
  const validation = validatePublicTokenParam(token);

  if (!validation.ok) {
    return renderMessage("Enlace no válido");
  }

  const tokenHash = hashPublicToken(validation.token);
  const result = await acceptPresupuestoAtomic(tokenHash);

  if (result.type === "NOT_FOUND") {
    return renderMessage("Enlace no válido");
  }

  if (result.type === "EXPIRED") {
    return renderMessage("Presupuesto expirado.");
  }

  if (result.type === "NOT_PENDING") {
    return renderMessage("Este presupuesto ya no está pendiente.");
  }

  return renderMessage("¡Presupuesto aceptado! Procederemos con la reparación.");
}

export async function reject(token) {
  const validation = validatePublicTokenParam(token);

  if (!validation.ok) {
    return renderMessage("Enlace no válido");
  }

  const tokenHash = hashPublicToken(validation.token);
  const result = await rejectPresupuestoAtomic(tokenHash);

  if (result.type === "NOT_FOUND") {
    return renderMessage("Enlace no válido");
  }

  if (result.type === "EXPIRED") {
    return renderMessage("Presupuesto expirado.");
  }

  if (result.type === "NOT_PENDING") {
    return renderMessage("Este presupuesto ya no está pendiente.");
  }

  return renderMessage("Presupuesto rechazado. Gracias por tu respuesta.");
}