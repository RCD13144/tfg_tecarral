import * as publicPresupuestoReparacionService from "../services/publicPresupuestoReparacion.service.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

export async function verPresupuestoReparacionHtml(req, res) {
  try {
    const token = req.params.token;
    const html =
      await publicPresupuestoReparacionService.getHtml(token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(error.statusCode ?? 500).send(renderMessage("Error"));
  }
}

export async function aceptarPresupuestoReparacion(req, res) {
  try {
    const token = req.params.token;
    const html =
      await publicPresupuestoReparacionService.accept(token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(error.statusCode ?? 500).send(renderMessage("Error"));
  }
}

export async function rechazarPresupuestoReparacion(req, res) {
  try {
    const token = req.params.token;
    const html =
      await publicPresupuestoReparacionService.reject(token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(error.statusCode ?? 500).send(renderMessage("Error"));
  }
}