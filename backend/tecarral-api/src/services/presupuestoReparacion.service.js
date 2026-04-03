import { generatePublicToken } from "../utils/publicToken.js";
import { sendMail } from "../utils/mailer.js";
import {
  crearPresupuestoReparacionTx,
  findPresupuestoReparacionById
} from "../repositories/presupuestoReparacion.repository.js";
import {
  buildPresupuestoReparacionEmailHtml,
  buildPresupuestoReparacionEmailText,
} from "../templates/presupuestoReparacionEmail.template.js";

function getPublicBaseUrl() {
  const base = String(process.env.PUBLIC_BASE_URL ?? "").trim();
  return base.length > 0 ? base : "http://localhost:3000";
}

export async function crearPresupuestoReparacionIntoDB(body) {
  const { token, tokenHash } = generatePublicToken();

  const created = await crearPresupuestoReparacionTx({
    ...body,
    public_token: tokenHash,
  });

  const presupuesto = created.presupuesto;
  const propuesta = created.propuesta;

  const publicUrl =
    `${getPublicBaseUrl()}/public/presupuestos-reparacion/${token}`;

  let emailSent = false;
  let emailError = null;

  try {
    const subject = `Presupuesto de reparación #${presupuesto.id}`;

    const html = buildPresupuestoReparacionEmailHtml({
      cliente: propuesta.cliente,
      importeTotal: presupuesto.importe_total,
      condiciones: presupuesto.condiciones,
      expiraAt: presupuesto.expira_at,
      url: publicUrl,
    });

    const text = buildPresupuestoReparacionEmailText({
      cliente: propuesta.cliente,
      importeTotal: presupuesto.importe_total,
      condiciones: presupuesto.condiciones,
      expiraAt: presupuesto.expira_at,
      url: publicUrl,
    });

    await sendMail({
      to: propuesta.email_cliente,
      subject,
      html,
      text,
    });

    emailSent = true;
  } catch (error) {
    emailSent = false;
    emailError = error?.message ?? "Error enviando email";
  }

  return {
    ...presupuesto,
    public_url: publicUrl,
    email_sent: emailSent,
    email_error: emailError,
  };
}

export async function getPresupuestoReparacionById(id) {
  return findPresupuestoReparacionById(id);
}

