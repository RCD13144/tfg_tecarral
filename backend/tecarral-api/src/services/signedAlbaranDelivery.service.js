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
    process.env.SIGNED_ALBARAN_INTERNAL_EMAIL ??
      process.env.ACCOUNTING_DOCUMENTS_EMAIL ??
      "rodriguezcamarmoldiego@gmail.com"
  );
}

function buildEmail(data, pdfFilename) {
  const documentNumber = String(data.document_number ?? `#${data.id_albaran}`).trim();
  const customer = String(data.cliente ?? "cliente").trim();
  const machine = [data.maquina?.marca, data.maquina?.modelo].filter(Boolean).join(" ") || "-";
  const serialNumber = data.maquina?.ns ?? "-";
  const subject = `Albar?n firmado ${documentNumber} - ${customer}`;
  const text =
    `Se adjunta el albarán ${documentNumber}, firmado por el cliente y por Tecarral.\n\n` +
    `Cliente: ${customer}\n` +
    `Máquina: ${machine}\n` +
    `N.? de serie: ${serialNumber}\n\n` +
    `El documento adjunto (${pdfFilename}) es la copia firmada.\n`;
  const html = `
    <p>Se adjunta el albarán <strong>${escapeHtml(documentNumber)}</strong>, firmado por el cliente y por Tecarral.</p>
    <p><strong>Cliente:</strong> ${escapeHtml(customer)}<br>
    <strong>Máquina:</strong> ${escapeHtml(machine)}<br>
    <strong>N.? de serie:</strong> ${escapeHtml(serialNumber)}</p>
    <p>El PDF adjunto es la copia firmada e inmutable del documento.</p>
  `;

  return { subject, text, html };
}

function summarize(deliveries, recipientType) {
  const delivery = deliveries.find((item) => item.recipient_type === recipientType);
  return delivery?.status ?? "ERROR";
}

export async function deliverSignedAlbaran({
  formalDocumentId,
  data,
  pdfContent,
  pdfFilename,
}) {
  const recipients = [
    { type: RECIPIENT_TYPES.CUSTOMER, email: normalizeEmail(data.email_cliente) },
    { type: RECIPIENT_TYPES.INTERNAL, email: internalRecipient() },
  ];

  for (const recipient of recipients) {
    await upsertFormalDocumentDelivery({
      formalDocumentId,
      recipientType: recipient.type,
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

  const email = buildEmail(data, pdfFilename);
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
          recipientEmail,
          status: "ERROR",
          lastError: error?.message ?? "Error enviando el albarán firmado",
          incrementAttempts: true,
        });
      }
    }
  }

  const deliveries = await getFormalDocumentDeliveries(formalDocumentId);
  return {
    customer_delivery_status: summarize(deliveries, RECIPIENT_TYPES.CUSTOMER),
    internal_delivery_status: summarize(deliveries, RECIPIENT_TYPES.INTERNAL),
    deliveries,
  };
}
