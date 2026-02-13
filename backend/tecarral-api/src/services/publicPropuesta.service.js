import { hashPublicToken } from "../utils/publicToken.js";
import { validateTokenParam } from "../schemas/publicPropuesta.schema.js";
import {
    findByTokenHash,
    isUnavailableForThisProposal,
    acceptAtomic,
    rejectAtomic,
} from "../repositories/publicPropuesta.repository.js";

export async function getHtml(token) {
    const validation = validateTokenParam(token);
    if (!validation.ok) return renderMessage("Enlace no válido");

    const tokenHash = hashPublicToken(validation.token);
    const propuesta = await findByTokenHash(tokenHash);
    if (!propuesta) return renderMessage("Enlace no válido");

    const unavailable = await isUnavailableForThisProposal(propuesta);
    if (unavailable) {
        return renderPropuesta(propuesta, validation.token, {
            mode: "MESSAGE",
            message: "Lo siento, esta máquina ya no está disponible.",
        });
    }

    const expired = new Date(propuesta.expires_at).getTime() <= Date.now();

    if (propuesta.estado === "PENDING" && !expired) {
        return renderPropuesta(propuesta, validation.token, { mode: "ACTIONS" });
    }

    if (propuesta.estado === "ACEPTADA") return renderPropuesta(propuesta, validation.token, { mode: "MESSAGE", message: "Propuesta ya aceptada." });
    if (propuesta.estado === "RECHAZADA") return renderPropuesta(propuesta, validation.token, { mode: "MESSAGE", message: "Propuesta rechazada." });

    return renderPropuesta(propuesta, validation.token, { mode: "MESSAGE", message: "Propuesta expirada." });
}

export async function accept(token) {
    const validation = validateTokenParam(token);
    if (!validation.ok) return renderMessage("Enlace no válido");

    const tokenHash = hashPublicToken(validation.token);
    const result = await acceptAtomic(tokenHash);

    if (result.type === "NOT_FOUND") return renderMessage("Enlace no válido");
    if (result.type === "EXPIRED") return renderMessage("Propuesta expirada.");
    if (result.type === "NOT_PENDING") return renderMessage("Esta propuesta ya no está pendiente.");
    if (result.type === "UNAVAILABLE") return renderMessage("Lo siento, esta máquina ya no está disponible.");

    return renderMessage("¡Propuesta aceptada! Nos pondremos en contacto contigo.");
}

export async function reject(token) {
    const validation = validateTokenParam(token);
    if (!validation.ok) return renderMessage("Enlace no válido");

    const tokenHash = hashPublicToken(validation.token);
    const result = await rejectAtomic(tokenHash);

    if (result.type === "NOT_FOUND") return renderMessage("Enlace no válido");
    if (result.type === "EXPIRED") return renderMessage("Propuesta expirada.");
    if (result.type === "NOT_PENDING") return renderMessage("Esta propuesta ya no está pendiente.");
    if (result.type === "UNAVAILABLE") return renderMessage("Lo siento, esta máquina ya no está disponible.");

    return renderMessage("Propuesta rechazada. Gracias por tu respuesta.");
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

function renderPropuesta(p, token, opts) {
    const base = `/public/propuestas/${encodeURIComponent(token)}`;
    const acceptUrl = `${base}/accept`;
    const rejectUrl = `${base}/reject`;

    const rows = [
        ["Cliente", p.cliente],
        ["Email", p.email_cliente],
        ["Teléfono", p.telefono],
        ["Dirección", p.direccion],
        ["CP", p.cp],
        ["Población", p.poblacion],
        ["Precio", `${p.precio}`],
        ["Fecha inicio", `${p.fecha_inicio}`],
        ["Fecha fin", `${p.fecha_fin}`],
        ["Estado", p.estado],
    ];

    const rowsHtml = rows
        .map(([k, v]) => `<tr><td style="padding:6px 8px; font-weight:600;">${escapeHtml(k)}</td><td style="padding:6px 8px;">${escapeHtml(v)}</td></tr>`)
        .join("");

    const messageHtml =
        opts.mode === "MESSAGE"
            ? `<p style="margin-top:16px; font-weight:600;">${escapeHtml(opts.message ?? "")}</p>`
            : "";

    const actionsHtml =
        opts.mode === "ACTIONS"
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
  <title>Propuesta</title>
</head>
<body style="font-family: system-ui, Arial; padding: 24px; max-width: 720px; margin: 0 auto;">
  <h2>Propuesta de alquiler</h2>

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
