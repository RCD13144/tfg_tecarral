import pool from "../config/db.js";

export async function upsertFormalDocumentDelivery({
  formalDocumentId,
  recipientType,
  recipientEmail,
  deliveryStage = "FINAL",
  status = "PENDING",
  lastError = null,
  sentAt = null,
  messageId = null,
  incrementAttempts = false,
}) {
  const result = await pool.query(
    `
    INSERT INTO public.formal_document_delivery (
      formal_document_id,
      recipient_type,
      delivery_stage,
      recipient_email,
      status,
      attempts,
      last_error,
      sent_at,
      message_id,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (formal_document_id, recipient_type, delivery_stage)
    DO UPDATE SET
      recipient_email = EXCLUDED.recipient_email,
      status = EXCLUDED.status,
      attempts = CASE
        WHEN $10 THEN public.formal_document_delivery.attempts + 1
        ELSE public.formal_document_delivery.attempts
      END,
      last_error = EXCLUDED.last_error,
      sent_at = EXCLUDED.sent_at,
      message_id = EXCLUDED.message_id,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      formalDocumentId,
      recipientType,
      deliveryStage,
      recipientEmail || null,
      status,
      incrementAttempts ? 1 : 0,
      lastError,
      sentAt,
      messageId,
      incrementAttempts,
    ]
  );

  return result.rows[0] ?? null;
}

export async function getFormalDocumentDeliveries(formalDocumentId) {
  const result = await pool.query(
    `
    SELECT *
    FROM public.formal_document_delivery
    WHERE formal_document_id = $1
    ORDER BY delivery_stage, recipient_type
    `,
    [formalDocumentId]
  );

  return result.rows;
}
