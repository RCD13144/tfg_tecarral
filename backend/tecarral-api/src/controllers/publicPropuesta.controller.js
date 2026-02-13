import * as publicPropuestaService from "../services/publicPropuesta.service.js";

export async function verPropuestaHtml(req, res) {
  try {
    const token = req.params.token;
    const html = await publicPropuestaService.getHtml(token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (e) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(e.statusCode ?? 500).send(renderMessage("Error"));
  }
}

export async function aceptarPropuesta(req, res) {
  try {
    const token = req.params.token;
    const html = await publicPropuestaService.accept(token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (e) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(e.statusCode ?? 500).send(renderMessage("Error"));
  }
}

export async function rechazarPropuesta(req, res) {
  try {
    const token = req.params.token;
    const html = await publicPropuestaService.reject(token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (e) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(e.statusCode ?? 500).send(renderMessage("Error"));
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMessage(message) {
  const msg = escapeHtml(message);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Propuesta</title>
</head>
<body style="font-family: system-ui, Arial; padding: 24px; max-width: 720px; margin: 0 auto;">
  <h2>Propuesta de alquiler</h2>
  <p>${msg}</p>
</body>
</html>`;
}
