import { hashPublicToken } from "../utils/publicToken.js";
import { validatePublicTokenParam } from "../schemas/publicPresupuestoReparacion.schema.js";
import { findByPublicTokenHash, rejectPresupuestoAtomic } from "../repositories/publicPresupuestoReparacion.repository.js";
import { acceptPublicPresupuesto } from "./presupuestoReparacion.service.js";
import { normalizeSignatureImage } from "../utils/signatureImage.js";

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
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDateES(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function renderMessage(message) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Presupuesto de reparación</title></head><body style="font-family:system-ui,Arial;padding:24px;max-width:760px;margin:0 auto;color:#0b355d;"><h2>Presupuesto de reparación</h2><p>${escapeHtml(message)}</p></body></html>`;
}

function renderPresupuesto(presupuesto, token, options) {
  const base = `/public/presupuestos-reparacion/${encodeURIComponent(token)}`;
  const acceptUrl = `${base}/accept`;
  const rejectUrl = `${base}/reject`;
  const maquinaLabel = [presupuesto.maquina_tipo, presupuesto.maquina_marca, presupuesto.maquina_modelo]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .join(" - ");

  const rows = [
    ["Número", presupuesto.document_number ?? `#${presupuesto.id}`],
    ["Cliente", presupuesto.cliente],
    ["Email", presupuesto.email_cliente],
    ["Teléfono", presupuesto.telefono],
    ["Dirección", presupuesto.direccion],
    ["Población", presupuesto.poblacion],
    ["Base imponible", formatMoneyES(presupuesto.base_imponible)],
    ["IVA", formatMoneyES(presupuesto.iva_amount)],
    ["Total", formatMoneyES(presupuesto.importe_total)],
    ["Válido hasta", formatDateES(presupuesto.expira_at)],
    ["Estado presupuesto", presupuesto.estado],
    ["Estado reparación", presupuesto.reparacion_estado],
    ["Cobertura", `${presupuesto.coverage_decision ?? "-"} · ${presupuesto.coverage_reason ?? "-"}`],
    ["Máquina", maquinaLabel || "-"],
  ];

  const rowsHtml = rows.map(([key, value]) => `<tr><td style="padding:8px;font-weight:700;border-bottom:1px solid #d9e5ef;">${escapeHtml(key)}</td><td style="padding:8px;border-bottom:1px solid #d9e5ef;">${escapeHtml(value ?? "-")}</td></tr>`).join("");
  const itemsHtml = (presupuesto.items ?? []).map((item) => `<tr><td>${escapeHtml(item.referencia ?? "-")}</td><td>${escapeHtml(item.descripcion)}</td><td style="text-align:right;">${escapeHtml(item.unidades)}</td><td style="text-align:right;">${escapeHtml(formatMoneyES(item.precio_unitario))}</td><td style="text-align:right;">${escapeHtml(formatMoneyES(item.line_total))}</td></tr>`).join("");

  const messageHtml = options.mode === "MESSAGE" ? `<p style="font-weight:700;margin-top:20px;">${escapeHtml(options.message ?? "")}</p>` : "";
  const actionsHtml = options.mode === "ACTIONS" ? `<form method="post" action="${acceptUrl}" onsubmit="return prepareSignature()"><label>Nombre firmante</label><input name="signer_name" required style="width:100%;height:42px;margin:8px 0 14px;border:1px solid #8db2cf;border-radius:8px;padding:0 10px;" /><p>Firma del cliente</p><canvas id="pad" width="700" height="220" style="width:100%;border:2px solid #0d5896;border-radius:12px;touch-action:none;"></canvas><input type="hidden" name="signature_base64" id="signature_base64" /><div style="margin-top:12px;display:flex;gap:12px;"><button type="button" onclick="clearPad()">Limpiar firma</button><button type="submit">Aceptar y firmar</button></div></form><form method="post" action="${rejectUrl}" style="margin-top:12px;"><button type="submit">Rechazar</button></form>` : "";
  const scripts = options.mode === "ACTIONS" ? `<script>const canvas=document.getElementById('pad');const ctx=canvas.getContext('2d');ctx.lineWidth=2;let drawing=false;function point(evt){const rect=canvas.getBoundingClientRect();const touch=evt.touches&&evt.touches[0];const clientX=touch?touch.clientX:evt.clientX;const clientY=touch?touch.clientY:evt.clientY;return{x:(clientX-rect.left)*(canvas.width/rect.width),y:(clientY-rect.top)*(canvas.height/rect.height)}}function start(evt){drawing=true;const p=point(evt);ctx.beginPath();ctx.moveTo(p.x,p.y);evt.preventDefault()}function move(evt){if(!drawing)return;const p=point(evt);ctx.lineTo(p.x,p.y);ctx.stroke();evt.preventDefault()}function stop(evt){drawing=false;evt.preventDefault()}function clearPad(){ctx.clearRect(0,0,canvas.width,canvas.height)}function prepareSignature(){document.getElementById('signature_base64').value=canvas.toDataURL('image/png');return true}canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);canvas.addEventListener('mouseup',stop);canvas.addEventListener('mouseleave',stop);canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',stop,{passive:false});</script>` : "";

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Presupuesto de reparación</title><style>body{font-family:system-ui,Arial;padding:24px;max-width:820px;margin:0 auto;color:#083c6b}table{border-collapse:collapse;width:100%;margin-top:12px}th,td{padding:8px;border-bottom:1px solid #d9e5ef;text-align:left}button{padding:10px 14px;border:1px solid #0d5896;border-radius:8px;background:#0d5896;color:white;font-weight:700}</style></head><body><h2>Presupuesto de reparación</h2><table><tbody>${rowsHtml}</tbody></table><h3>Líneas del presupuesto</h3><table><thead><tr><th>Ref.</th><th>Descripción</th><th>Ud.</th><th>Precio</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>${messageHtml}<div style="margin-top:18px;">${actionsHtml}</div>${scripts}</body></html>`;
}

async function parseSignaturePayload(body, ipAddress) {
  const signerName = String(body?.signer_name ?? "").trim();
  const signatureBase64 = String(body?.signature_base64 ?? "").trim();
  if (!signerName || !signatureBase64) return null;
  const buffer = await normalizeSignatureImage(signatureBase64, "Firma del cliente");
  return { signerName, buffer, mimeType: "image/png", ipAddress: ipAddress ?? null };
}

export async function getHtml(token) {
  const validation = validatePublicTokenParam(token);
  if (!validation.ok) return renderMessage("Enlace no válido");
  const presupuesto = await findByPublicTokenHash(hashPublicToken(validation.token));
  if (!presupuesto) return renderMessage("Enlace no válido");

  const isExpired = presupuesto.expira_at !== null && new Date(presupuesto.expira_at).getTime() <= Date.now();
  if (presupuesto.estado === "PENDING" && !isExpired) {
    return renderPresupuesto(presupuesto, validation.token, presupuesto.firmado_tecnico_at ? { mode: "ACTIONS" } : { mode: "MESSAGE", message: "Este presupuesto todavía está pendiente de emisión por Tecarral." });
  }
  if (presupuesto.estado === "ACEPTADA") return renderPresupuesto(presupuesto, validation.token, { mode: "MESSAGE", message: "Presupuesto aceptado y firmado." });
  if (presupuesto.estado === "RECHAZADA") return renderPresupuesto(presupuesto, validation.token, { mode: "MESSAGE", message: "Presupuesto rechazado." });
  if (presupuesto.estado === "FINALIZADA") return renderPresupuesto(presupuesto, validation.token, { mode: "MESSAGE", message: "Presupuesto finalizado." });
  return renderPresupuesto(presupuesto, validation.token, { mode: "MESSAGE", message: "Presupuesto expirado." });
}

export async function accept(token, body, ipAddress) {
  const validation = validatePublicTokenParam(token);
  if (!validation.ok) return renderMessage("Enlace no válido");
  const signature = await parseSignaturePayload(body, ipAddress);
  if (!signature) return renderMessage("Faltan datos de firma");
  const result = await acceptPublicPresupuesto(hashPublicToken(validation.token), signature);
  if (result.type === "NOT_FOUND") return renderMessage("Enlace no válido");
  if (result.type === "EXPIRED") return renderMessage("Presupuesto expirado.");
  if (result.type === "NOT_PENDING") return renderMessage("Este presupuesto ya no está pendiente.");
  if (result.type === "NOT_ISSUED") return renderMessage("Este presupuesto todavía no ha sido emitido por Tecarral.");
  return renderMessage("Presupuesto aceptado y firmado correctamente.");
}

export async function reject(token) {
  const validation = validatePublicTokenParam(token);
  if (!validation.ok) return renderMessage("Enlace no válido");
  const result = await rejectPresupuestoAtomic(hashPublicToken(validation.token));
  if (result.type === "NOT_FOUND") return renderMessage("Enlace no válido");
  if (result.type === "EXPIRED") return renderMessage("Presupuesto expirado.");
  if (result.type === "NOT_PENDING") return renderMessage("Este presupuesto ya no está pendiente.");
  return renderMessage("Presupuesto rechazado. Gracias por tu respuesta.");
}
