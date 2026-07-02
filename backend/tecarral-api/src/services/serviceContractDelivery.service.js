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
    process.env.SIGNED_SERVICE_CONTRACT_INTERNAL_EMAIL ??
      process.env.SIGNED_ALBARAN_INTERNAL_EMAIL ??
      process.env.ACCOUNTING_DOCUMENTS_EMAIL ??
      "rodriguezcamarmoldiego@gmail.com"
  );
}

function contractLabel(contract) {
  return String(contract.document_number ?? `CTR-${contract.id}`).trim();
}

function contractTypeLabel(contract) {
  return contract.contract_type === "TODO_INCLUIDO"
    ? "mantenimiento todo incluido"
    : "mantenimiento preventivo";
}

function machineLabel(contract) {
  const machines = Array.isArray(contract?.machines) ? contract.machines : [];
  const labels = machines
    .map((machine) =>
      [
        `#${machine.id_maquina}`,
        machine.marca,
        machine.modelo,
        machine.ns ? `N.? serie ${machine.ns}` : null,
      ]
        .filter(Boolean)
        .join(" - ")
    )
    .filter(Boolean);

  if (labels.length > 0) {
    return labels.join(" | ");
  }

  return [
    contract.id_maquina ? `#${contract.id_maquina}` : null,
    contract.maquina_marca,
    contract.maquina_modelo,
  ]
    .filter(Boolean)
    .join(" - ") || "-";
}

function buildEmail({ contract, stage, publicUrl, pdfFilename }) {
  const documentNumber = contractLabel(contract);
  const customer = String(contract.cliente_nombre ?? "cliente").trim();
  const type = contractTypeLabel(contract);
  const machines = machineLabel(contract);

  if (stage === "ISSUED") {
    return {
      subject: `Contrato de ${type} ${documentNumber} - pendiente de firma`,
      text:
        `Se adjunta el contrato de ${type} ${documentNumber}.\n\n` +
        `Cliente: ${customer}\nMáquina/s: ${machines}\n\n` +
        `Enlace para revisar y firmar: ${publicUrl ?? "-"}\n\n` +
        `Documento adjunto: ${pdfFilename}\n`,
      html: `
        <p>Se adjunta el contrato de <strong>${escapeHtml(type)}</strong> <strong>${escapeHtml(documentNumber)}</strong>.</p>
        <p><strong>Cliente:</strong> ${escapeHtml(customer)}<br><strong>Máquina/s:</strong> ${escapeHtml(machines)}</p>
        ${publicUrl ? `<p><a href="${escapeHtml(publicUrl)}">Revisar y firmar contrato</a></p>` : ""}
        <p>Documento adjunto: ${escapeHtml(pdfFilename)}</p>
      `,
    };
  }

  return {
    subject: `Contrato de ${type} ${documentNumber} firmado`,
    text:
      `Se adjunta el contrato de ${type} ${documentNumber}, firmado por el cliente y por Tecarral.\n\n` +
      `Cliente: ${customer}\nMáquina/s: ${machines}\n\nDocumento adjunto: ${pdfFilename}\n`,
    html: `
      <p>Se adjunta el contrato de <strong>${escapeHtml(type)}</strong> <strong>${escapeHtml(documentNumber)}</strong>, firmado por el cliente y por Tecarral.</p>
      <p><strong>Cliente:</strong> ${escapeHtml(customer)}<br><strong>Máquina/s:</strong> ${escapeHtml(machines)}</p>
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

export async function deliverServiceContractPdf({
  formalDocumentId,
  contract,
  stage,
  pdfContent,
  pdfFilename,
  publicUrl = null,
}) {
  const recipients = [
    { type: RECIPIENT_TYPES.CUSTOMER, email: normalizeEmail(contract.cliente_email) },
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

  const email = buildEmail({ contract, stage, publicUrl, pdfFilename });
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
          lastError: error?.message ?? "Error enviando el contrato",
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
