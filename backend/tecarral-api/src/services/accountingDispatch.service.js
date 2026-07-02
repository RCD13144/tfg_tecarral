import { sendMail } from "../utils/mailer.js";
import { upsertAccountingDocumentQueue } from "../repositories/accountingDispatch.repository.js";
import { updateFormalDocumentAccountingStatus } from "../repositories/formalDocument.repository.js";

function getAccountingRecipient() {
  return String(
    process.env.ACCOUNTING_DOCUMENTS_EMAIL ??
      process.env.REPAIR_BUDGET_INTERNAL_EMAIL ??
      "rodriguezcamarmoldiego@gmail.com"
  ).trim();
}

export async function dispatchAccountingDocument({
  documentType,
  entityType,
  entityId,
  subject,
  html,
  text,
  payload,
  sendEmail = true,
}) {
  const recipient = getAccountingRecipient();

  if (!sendEmail) {
    await updateFormalDocumentAccountingStatus({
      entityType,
      entityId,
      documentType,
      accountingStatus: "PENDING",
    });

    await upsertAccountingDocumentQueue({
      document_type: documentType,
      entity_type: entityType,
      entity_id: entityId,
      recipient_email: recipient,
      subject,
      status: "PENDING",
      html_snapshot: html,
      payload_json: payload ?? null,
      sent_at: null,
      last_error: null,
    });

    return { sent: false, recipient, error: null, queued: true };
  }

  try {
    await sendMail({
      to: recipient,
      subject,
      html,
      text,
    });

    await updateFormalDocumentAccountingStatus({
      entityType,
      entityId,
      documentType,
      accountingStatus: "SENT",
    });

    await upsertAccountingDocumentQueue({
      document_type: documentType,
      entity_type: entityType,
      entity_id: entityId,
      recipient_email: recipient,
      subject,
      status: "SENT",
      html_snapshot: html,
      payload_json: payload ?? null,
      sent_at: new Date().toISOString(),
      last_error: null,
    });

    return { sent: true, recipient, error: null };
  } catch (error) {
    await updateFormalDocumentAccountingStatus({
      entityType,
      entityId,
      documentType,
      accountingStatus: "ERROR",
    });

    await upsertAccountingDocumentQueue({
      document_type: documentType,
      entity_type: entityType,
      entity_id: entityId,
      recipient_email: recipient,
      subject,
      status: "ERROR",
      html_snapshot: html,
      payload_json: payload ?? null,
      sent_at: null,
      last_error: error?.message ?? "Error enviando email a contabilidad",
    });

    return {
      sent: false,
      recipient,
      error: error?.message ?? "Error enviando email a contabilidad",
    };
  }
}
