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

export function buildPresupuestoReparacionEmailHtml(data) {
  const cliente = escapeHtml(data.cliente);
  const importe = escapeHtml(formatMoneyES(data.importeTotal));
  const condiciones = escapeHtml(data.condiciones ?? "No disponible");
  const expiraAt = escapeHtml(formatDateES(data.expiraAt));
  const url = escapeHtml(data.url);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Presupuesto de reparación</title>
</head>
<body style="font-family: system-ui, Arial; max-width: 720px; margin: 0 auto; padding: 24px;">
  <h2>Presupuesto de reparación</h2>
  <p>Hola ${cliente},</p>
  <p>Te hemos enviado un presupuesto de reparación para tu revisión.</p>
  <ul>
    <li><strong>Importe total:</strong> ${importe}</li>
    <li><strong>Condiciones:</strong> ${condiciones}</li>
    <li><strong>Válido hasta:</strong> ${expiraAt}</li>
  </ul>
  <p>Puedes revisar el detalle completo y aceptar o rechazar el presupuesto en este enlace:</p>
  <p><a href="${url}">${url}</a></p>
</body>
</html>`;
}

export function buildPresupuestoReparacionEmailText(data) {
  const cliente = String(data.cliente ?? "").trim() || "cliente";
  const importe = formatMoneyES(data.importeTotal);
  const condiciones =
    String(data.condiciones ?? "").trim() || "No disponible";
  const expiraAt = formatDateES(data.expiraAt);
  const url = String(data.url ?? "").trim();

  return [
    `Hola ${cliente},`,
    "",
    "Te hemos enviado un presupuesto de reparación para tu revisión.",
    `Importe total: ${importe}`,
    `Condiciones: ${condiciones}`,
    `Válido hasta: ${expiraAt}`,
    "",
    "Puedes revisar el detalle completo y aceptar o rechazar el presupuesto aquí:",
    url,
  ].join("\n");
}