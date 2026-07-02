import pool from "../config/db.js";

const DOCUMENT_PREFIXES = Object.freeze({
  ALBARAN: "ALB",
  PRESUPUESTO_REPARACION: "PRE",
  CONTRATO_MANTENIMIENTO: "CTR",
});

function normalizeYear2Digits(value = new Date()) {
  const year = value instanceof Date ? value.getUTCFullYear() : new Date(value).getUTCFullYear();
  return String(year).slice(-2);
}

function formatDocumentNumber(documentType, year2Digits, sequence) {
  const prefix = DOCUMENT_PREFIXES[documentType] ?? "DOC";
  return `${prefix}-${year2Digits}-${String(sequence).padStart(5, "0")}`;
}

export async function reserveDocumentNumberTx(client, documentType, createdAt = new Date()) {
  const year2Digits = normalizeYear2Digits(createdAt);

  const result = await client.query(
    `
    INSERT INTO public.document_series_counter (document_type, year_2_digits, current_value, updated_at)
    VALUES ($1, $2, 1, NOW())
    ON CONFLICT (document_type, year_2_digits)
    DO UPDATE
      SET current_value = public.document_series_counter.current_value + 1,
          updated_at = NOW()
    RETURNING current_value;
    `,
    [documentType, year2Digits]
  );

  const currentValue = Number(result.rows[0]?.current_value ?? 0);
  return formatDocumentNumber(documentType, year2Digits, currentValue);
}

export async function ensureEntityDocumentNumberTx(client, {
  entityTable,
  entityIdColumn,
  entityId,
  documentType,
}) {
  const existingRes = await client.query(
    `SELECT document_number FROM public.${entityTable} WHERE ${entityIdColumn} = $1 LIMIT 1`,
    [entityId]
  );

  const existing = String(existingRes.rows[0]?.document_number ?? "").trim();
  if (existing) {
    return existing;
  }

  const documentNumber = await reserveDocumentNumberTx(client, documentType);

  await client.query(
    `UPDATE public.${entityTable} SET document_number = $2 WHERE ${entityIdColumn} = $1`,
    [entityId, documentNumber]
  );

  return documentNumber;
}

export async function upsertFormalDocumentTx(client, {
  documentType,
  entityType,
  entityId,
  documentNumber,
  snapshotHtml,
  signatureStatus,
  publicUrl = null,
  accountingStatus = "PENDING",
}) {
  const result = await client.query(
    `
    INSERT INTO public.formal_document (
      document_type,
      entity_type,
      entity_id,
      document_number,
      snapshot_html,
      signature_status,
      public_url,
      accounting_status,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (entity_type, entity_id, document_type)
    DO UPDATE SET
      document_number = EXCLUDED.document_number,
      snapshot_html = EXCLUDED.snapshot_html,
      signature_status = EXCLUDED.signature_status,
      public_url = EXCLUDED.public_url,
      accounting_status = EXCLUDED.accounting_status,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      documentType,
      entityType,
      entityId,
      documentNumber,
      snapshotHtml ?? null,
      signatureStatus ?? "PENDING",
      publicUrl,
      accountingStatus,
    ]
  );

  return result.rows[0] ?? null;
}

export async function saveFormalDocumentPdfTx(client, {
  formalDocumentId,
  pdfContent,
  pdfMimeType,
  pdfFilename,
  pdfSha256,
  pdfVersion = 1,
}) {
  const result = await client.query(
    `
    UPDATE public.formal_document
    SET pdf_content = $2,
        pdf_mime_type = $3,
        pdf_filename = $4,
        pdf_sha256 = $5,
        pdf_generated_at = NOW(),
        pdf_version = $6,
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, document_number, pdf_mime_type, pdf_filename,
              pdf_sha256, pdf_generated_at, pdf_version;
    `,
    [
      formalDocumentId,
      pdfContent,
      pdfMimeType,
      pdfFilename,
      pdfSha256,
      pdfVersion,
    ]
  );

  return result.rows[0] ?? null;
}

export async function saveFormalDocumentArtifactTx(client, {
  formalDocumentId,
  artifactStage,
  pdfContent,
  pdfMimeType,
  pdfFilename,
  pdfSha256,
  pdfVersion = 1,
}) {
  const result = await client.query(
    `
    INSERT INTO public.formal_document_artifact (
      formal_document_id,
      artifact_stage,
      pdf_content,
      pdf_mime_type,
      pdf_filename,
      pdf_sha256,
      pdf_version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (formal_document_id, artifact_stage, pdf_version)
    DO UPDATE SET
      pdf_content = EXCLUDED.pdf_content,
      pdf_mime_type = EXCLUDED.pdf_mime_type,
      pdf_filename = EXCLUDED.pdf_filename,
      pdf_sha256 = EXCLUDED.pdf_sha256,
      pdf_generated_at = NOW()
    RETURNING *;
    `,
    [
      formalDocumentId,
      artifactStage,
      pdfContent,
      pdfMimeType,
      pdfFilename,
      pdfSha256,
      pdfVersion,
    ]
  );

  return result.rows[0] ?? null;
}

export async function getFormalDocumentArtifact({
  entityType,
  entityId,
  documentType,
  artifactStage,
}) {
  const result = await pool.query(
    `
    SELECT
      fda.*,
      fd.document_number
    FROM public.formal_document_artifact fda
    INNER JOIN public.formal_document fd
      ON fd.id = fda.formal_document_id
    WHERE fd.entity_type = $1
      AND fd.entity_id = $2
      AND fd.document_type = $3
      AND fda.artifact_stage = $4
    ORDER BY fda.pdf_version DESC
    LIMIT 1
    `,
    [entityType, entityId, documentType, artifactStage]
  );

  return result.rows[0] ?? null;
}

export async function getAlbaranFormalDocumentPdf({ idAlbaran, idUser }) {
  const result = await pool.query(
    `
    SELECT
      fd.id,
      fd.document_number,
      fd.pdf_content,
      fd.pdf_mime_type,
      fd.pdf_filename,
      fd.pdf_sha256,
      fd.pdf_generated_at,
      fd.pdf_version
    FROM public.formal_document fd
    INNER JOIN public.albaran a
      ON a.id_albaran = fd.entity_id
     AND fd.entity_type = 'albaran'
     AND fd.document_type = 'ALBARAN'
    WHERE a.id_albaran = $1
      AND a.id_user = $2
      AND a.estado = 'FIRMADO'
    LIMIT 1
    `,
    [idAlbaran, idUser]
  );

  return result.rows[0] ?? null;
}

export async function updateFormalDocumentAccountingStatus({
  entityType,
  entityId,
  documentType,
  accountingStatus,
}) {
  await pool.query(
    `
    UPDATE public.formal_document
    SET accounting_status = $4,
        updated_at = NOW()
    WHERE entity_type = $1
      AND entity_id = $2
      AND document_type = $3
    `,
    [entityType, entityId, documentType, accountingStatus]
  );
}
