import { generatePublicToken } from "../utils/publicToken.js";
import { sendMail } from "../utils/mailer.js";
import {
  crearPresupuestoReparacionTx,
  findPresupuestoReparacionById,
} from "../repositories/presupuestoReparacion.repository.js";
import {
  buildPresupuestoReparacionEmailHtml,
  buildPresupuestoReparacionEmailText,
  buildPresupuestoReparacionInternalEmailHtml,
  buildPresupuestoReparacionInternalEmailText,
} from "../templates/presupuestoReparacionEmail.template.js";

function getPublicBaseUrl() {
  const base = String(process.env.PUBLIC_BASE_URL ?? "").trim();
  return base.length > 0 ? base : "http://localhost:3000";
}

function getInternalBudgetEmail() {
  const email = String(process.env.REPAIR_BUDGET_INTERNAL_EMAIL ?? "").trim();

  if (!email) {
    const error = new Error(
      "Falta la variable REPAIR_BUDGET_INTERNAL_EMAIL para enviar presupuestos internos"
    );
    error.statusCode = 500;
    throw error;
  }

  return email;
}

function getChargeReason(body) {
  const providedReason = String(body.charge_reason ?? "").trim().toUpperCase();

  if (providedReason.length > 0) {
    return providedReason;
  }

  return body.payer_type === "CLIENTE" ? "GOLPE_ACCIDENTE" : null;
}

export async function crearPresupuestoReparacionIntoDB(body) {
  const isClientPayer = body.payer_type === "CLIENTE";
  const internalEmail = isClientPayer ? null : getInternalBudgetEmail();
  const generatedToken = isClientPayer ? generatePublicToken() : null;

  const created = await crearPresupuestoReparacionTx({
    ...body,
    charge_reason: getChargeReason(body),
    estado: isClientPayer ? "PENDING" : "ACEPTADA",
    reparacion_estado: isClientPayer
      ? "PENDIENTE_ACEPTACION"
      : "PRESUPUESTO_ACEPTADO",
    public_token: generatedToken?.tokenHash ?? null,
  });

  const presupuesto = created.presupuesto;
  const propuesta = created.propuesta;

  const publicUrl =
    isClientPayer && generatedToken
      ? `${getPublicBaseUrl()}/public/presupuestos-reparacion/${generatedToken.token}`
      : null;

  const emailRecipient = isClientPayer
    ? String(propuesta.email_cliente ?? "").trim()
    : internalEmail;

  let emailSent = false;
  let emailError = null;

  try {
    const subject = isClientPayer
      ? `Presupuesto de reparación #${presupuesto.id}`
      : `Presupuesto interno de reparación #${presupuesto.id}`;

    const html = isClientPayer
      ? buildPresupuestoReparacionEmailHtml({
          cliente: propuesta.cliente,
          importeTotal: presupuesto.importe_total,
          condiciones: presupuesto.condiciones,
          expiraAt: presupuesto.expira_at,
          url: publicUrl,
        })
      : buildPresupuestoReparacionInternalEmailHtml({
          cliente: propuesta.cliente,
          importeTotal: presupuesto.importe_total,
          condiciones: presupuesto.condiciones,
          expiraAt: presupuesto.expira_at,
          maquinaId: created.reparacion.id_maquina,
          reparacionId: presupuesto.reparacion_id,
        });

    const text = isClientPayer
      ? buildPresupuestoReparacionEmailText({
          cliente: propuesta.cliente,
          importeTotal: presupuesto.importe_total,
          condiciones: presupuesto.condiciones,
          expiraAt: presupuesto.expira_at,
          url: publicUrl,
        })
      : buildPresupuestoReparacionInternalEmailText({
          cliente: propuesta.cliente,
          importeTotal: presupuesto.importe_total,
          condiciones: presupuesto.condiciones,
          expiraAt: presupuesto.expira_at,
          maquinaId: created.reparacion.id_maquina,
          reparacionId: presupuesto.reparacion_id,
        });

    await sendMail({
      to: emailRecipient,
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
    email_recipient: emailRecipient,
    email_sent: emailSent,
    email_error: emailError,
  };
}

export async function getPresupuestoReparacionById(id) {
  return findPresupuestoReparacionById(id);
}
