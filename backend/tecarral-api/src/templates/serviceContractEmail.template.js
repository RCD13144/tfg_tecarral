function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildServiceContractEmailHtml({
  clienteNombre,
  contractType,
  tarifaFija,
  startDate,
  machineLabel,
  publicUrl,
}) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contrato de mantenimiento Tecarral</title>
</head>
<body style="font-family: system-ui, Arial; padding: 24px; max-width: 720px; margin: 0 auto;">
  <h2>Contrato de mantenimiento</h2>
  <p>Hola ${escapeHtml(clienteNombre ?? "cliente")},</p>
  <p>Ya tienes disponible tu contrato de mantenimiento para firma.</p>
  <p><strong>Tipo:</strong> ${escapeHtml(contractType)}</p>
  <p><strong>Maquina:</strong> ${escapeHtml(machineLabel)}</p>
  <p><strong>Tarifa fija:</strong> ${escapeHtml(tarifaFija)}</p>
  <p><strong>Inicio:</strong> ${escapeHtml(startDate)}</p>
  <p>Puedes revisarlo y firmarlo aqui:</p>
  <p><a href="${escapeHtml(publicUrl)}">${escapeHtml(publicUrl)}</a></p>
</body>
</html>`;
}

export function buildServiceContractEmailText({
  clienteNombre,
  contractType,
  tarifaFija,
  startDate,
  machineLabel,
  publicUrl,
}) {
  return [
    `Hola ${String(clienteNombre ?? "cliente").trim() || "cliente"},`,
    "",
    "Ya tienes disponible tu contrato de mantenimiento para firma.",
    `Tipo: ${contractType}`,
    `Maquina: ${machineLabel}`,
    `Tarifa fija: ${tarifaFija}`,
    `Inicio: ${startDate}`,
    "",
    "Puedes revisarlo y firmarlo aqui:",
    publicUrl,
  ].join("\n");
}
