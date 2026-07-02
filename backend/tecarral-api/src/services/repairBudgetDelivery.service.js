import { sendMail } from "../utils/mailer.js";
import {
  getFormalDocumentDeliveries,
  upsertFormalDocumentDelivery,
} from "../repositories/formalDocumentDelivery.repository.js";

const RECIPIENT_TYPES = Object.freeze({
  CUSTOMER: "CUSTOMER",
  INTERNAL: "INTERNAL",
});

function normalizeEmail(input) {
  return String(input ?? "").trim().toLowerCase();
}

function escapeHtml(input) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function internalRecipient() {
  return normalizeEmail(
    process.env.SIGNED_REPAIR_BUDGET_INTERNAL_EMAIL ??
      process.env.REPAIR_BUDGET_INTERNAL_EMAIL ??
      process.env.SIGNED_ALBARAN_INTERNAL_EMAIL ??
      process.env.ACCOUNTING_DOCUMENTS_EMAIL ??
      "rodriguezcamarmoldiego@gmail.com"
  );
}

function buildEmail({ presupuesto, stage, publicUrl, pdfFilename }) {
  const documentNumber = String(presupuesto.document_number ?? `PRE-${presupuesto.id}`).trim();
  const customer = String(presupuesto.cliente ?? "cliente").trim();
  const machine = [presupuesto.maquina_marca, presupuesto.maquina_modelo].filter(Boolean).join(" ") || "-";

  if (stage === "ISSUED") {
    return {
      subject: `Presupuesto de reparación ${documentNumber} - pendiente de aceptación`,
      text:
        `Se adjunta el presupuesto de reparación ${documentNumber}, emitido y firmado por Tecarral.\n\n` +
        `Cliente: ${customer}\nMáquina: ${machine}\n\n` +
        `Enlace para aceptar, rechazar y firmar: ${publicUrl ?? "-"}\n\n` +
        `Documento adjunto: ${pdfFilename}\n`,
      html: `
        <p>Se adjunta el presupuesto de reparación <strong>${escapeHtml(documentNumber)}</strong>, emitido y firmado por Tecarral.</p>
        <p><strong>Cliente:</strong> ${escapeHtml(customer)}<br><strong>Máquina:</strong> ${escapeHtml(machine)}</p>
        ${publicUrl ? `<p><a href="${escapeHtml(publicUrl)}">Aceptar, rechazar y firmar presupuesto</a></p>` : ""}
        <p>Documento adjunto: ${escapeHtml(pdfFilename)}</p>
      `,
    };
  }

  return {
    subject: `Presupuesto de reparación ${documentNumber} aceptado y firmado`,
    text:
      `Se adjunta el presupuesto de reparación ${documentNumber}, aceptado y firmado por el cliente y por Tecarral.\n\n` +
      `Cliente: ${customer}\nMáquina: ${machine}\n\nDocumento adjunto: ${pdfFilename}\n`,
    html: `
      <p>Se adjunta el presupuesto de reparación <strong>${escapeHtml(documentNumber)}</strong>, aceptado y firmado por el cliente y por Tecarral.</p>
      <p><strong>Cliente:</strong> ${escapeHtml(customer)}<br><strong>Máquina:</strong> ${escapeHtml(machine)}</p>
      <p>El PDF adjunto es la copia final firmada.</p>
    `,
  };
}

function summarize(deliveries, recipientType, stage) {
  const delivery = deliveries.find(
    (item) => item.recipient_type === recipientType && item.delivery_stage === stage
  );
  return delivery?.status ?? "ERROR";
}

export async function deliverRepairBudgetPdf({
  formalDocumentId,
  presupuesto,
  stage,
  pdfContent,
  pdfFilename,
  publicUrl = null,
}) {
  const recipients = [
    { type: RECIPIENT_TYPES.CUSTOMER, email: normalizeEmail(presupuesto.email_cliente) },
    { type: RECIPIENT_TYPES.INTERNAL, email: internalRecipient() },
  ];

  for (const recipient of recipients) {
    await upsertFormalDocumentDelivery({
      formalDocumentId,
      recipientType: recipient.type,
      deliveryStage: stage,
      recipientEmail: recipient.email,
      status: recipient.email ? "PENDING" : "ERROR",
      lastError: recipient.email ? null : "No hay un correo configurado para este destinatario",
    });
  }

  const byEmail = new Map();
  for (const recipient of recipients.filter((item) => item.email)) {
    const group = byEmail.get(recipient.email) ?? [];
    group.push(recipient);
    byEmail.set(recipient.email, group);
  }

  const email = buildEmail({ presupuesto, stage, publicUrl, pdfFilename });
  for (const [recipientEmail, recipientGroup] of byEmail.entries()) {
    try {
      const info = await sendMail({
        to: recipientEmail,
        ...email,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfContent,
            contentType: "application/pdf",
          },
        ],
      });

      for (const recipient of recipientGroup) {
        await upsertFormalDocumentDelivery({
          formalDocumentId,
          recipientType: recipient.type,
          deliveryStage: stage,
          recipientEmail,
          status: "SENT",
          sentAt: new Date().toISOString(),
          messageId: info?.messageId ?? null,
          incrementAttempts: true,
        });
      }
    } catch (error) {
      for (const recipient of recipientGroup) {
        await upsertFormalDocumentDelivery({
          formalDocumentId,
          recipientType: recipient.type,
          deliveryStage: stage,
          recipientEmail,
          status: "ERROR",
          lastError: error?.message ?? "Error enviando el presupuesto",
          incrementAttempts: true,
        });
      }
    }
  }

  const deliveries = await getFormalDocumentDeliveries(formalDocumentId);
  return {
    customer_delivery_status: summarize(deliveries, RECIPIENT_TYPES.CUSTOMER, stage),
    internal_delivery_status: summarize(deliveries, RECIPIENT_TYPES.INTERNAL, stage),
    deliveries,
  };
}
