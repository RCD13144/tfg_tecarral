import pool from "../config/db.js";

export async function upsertAccountingDocumentQueue(data) {
  const result = await pool.query(
    `
    INSERT INTO public.accounting_document_queue (
      document_type,
      entity_type,
      entity_id,
      recipient_email,
      subject,
      status,
      html_snapshot,
      payload_json,
      queued_at,
      sent_at,
      last_error
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10)
    ON CONFLICT (entity_type, entity_id, document_type)
    DO UPDATE SET
      recipient_email = EXCLUDED.recipient_email,
      subject = EXCLUDED.subject,
      status = EXCLUDED.status,
      html_snapshot = EXCLUDED.html_snapshot,
      payload_json = EXCLUDED.payload_json,
      sent_at = EXCLUDED.sent_at,
      last_error = EXCLUDED.last_error
    RETURNING *
    `,
    [
      data.document_type,
      data.entity_type,
      data.entity_id,
      data.recipient_email,
      data.subject,
      data.status,
      data.html_snapshot ?? null,
      data.payload_json ?? null,
      data.sent_at ?? null,
      data.last_error ?? null,
    ]
  );

  return result.rows[0] ?? null;
}
