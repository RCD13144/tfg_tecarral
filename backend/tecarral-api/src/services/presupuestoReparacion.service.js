import pool from "../config/db.js";
import { generatePublicToken } from "../utils/publicToken.js";
import { normalizeSignatureImage } from "../utils/signatureImage.js";
import {
  acceptPresupuestoAtomic,
  crearPresupuestoReparacionTx,
  findPresupuestoReparacionById,
  findRepairBudgetCreationContext,
  listPresupuestosReparacion,
  signPresupuestoTecarralTx,
} from "../repositories/presupuestoReparacion.repository.js";
import {
  ensureEntityDocumentNumberTx,
  saveFormalDocumentArtifactTx,
  saveFormalDocumentPdfTx,
  upsertFormalDocumentTx,
} from "../repositories/formalDocument.repository.js";
import { NOTIFICATION_TYPES } from "../constants/serviceContract.js";
import { dispatchAccountingDocument } from "./accountingDispatch.service.js";
import { broadcastNotification } from "./notification.service.js";
import { deliverRepairBudgetPdf } from "./repairBudgetDelivery.service.js";
import { generateRepairBudgetPdf } from "../documents/repairBudgetPdf.document.js";
import { resolveCoverageForRepair } from "./serviceContract.service.js";
import { buildRepairBudgetFormalSnapshot } from "../utils/formalDocuments.js";

function getPublicBaseUrl() {
  const base = String(process.env.PUBLIC_BASE_URL ?? "").trim();
  return base.length > 0 ? base : "http://localhost:3000";
}

function getBudgetDocumentNumber(budget) {
  return String(budget?.document_number ?? "").trim() || `PRE-${budget?.id ?? "-"}`;
}

function calculateTotals(items, ivaRate = 21) {
  const normalized = items.map((item) => ({
    ...item,
    unidades: Number(item.unidades),
    precio_unitario: Number(item.precio_unitario),
    line_total: Number((Number(item.unidades) * Number(item.precio_unitario)).toFixed(2)),
  }));
  const base = Number(normalized.reduce((sum, item) => sum + item.line_total, 0).toFixed(2));
  const iva = Number((base * (Number(ivaRate) / 100)).toFixed(2));
  const total = Number((base + iva).toFixed(2));
  return { items: normalized, base_imponible: base, iva_rate: ivaRate, iva_amount: iva, importe_total: total };
}


function normalizeContractType(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return ["PREVENTIVO", "TODO_INCLUIDO"].includes(normalized) ? normalized : null;
}

function normalizeFaultCause(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return ["DESGASTE_USO", "GOLPE_ACCIDENTE"].includes(normalized) ? normalized : null;
}

function buildRepairBudgetPayloadFromRepair(body, context) {
  if (!context) {
    const error = new Error("Reparación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  const contractType = normalizeContractType(
    context.repair_contract_type ?? context.machine_contract_type ?? body.contract_type
  );
  const faultCause = normalizeFaultCause(context.fault_cause ?? body.charge_reason);

  if (contractType === "TODO_INCLUIDO" && faultCause !== "GOLPE_ACCIDENTE") {
    const error = new Error(
      "Este contrato todo incluido cubre la avería; no procede crear un presupuesto al cliente salvo golpe o accidente."
    );
    error.statusCode = 409;
    throw error;
  }

  const resolvedCoverage = resolveCoverageForRepair({
    contractType,
    faultCause,
  });

  const propuestaAlquilerId = body.propuesta_alquiler_id ?? context.albaran_propuesta_alquiler_id ?? null;

  return {
    ...body,
    propuesta_alquiler_id: propuestaAlquilerId,
    payer_type: resolvedCoverage.payer_type,
    charge_reason: faultCause === "GOLPE_ACCIDENTE" ? "GOLPE_ACCIDENTE" : null,
    coverage_decision: resolvedCoverage.coverage_decision,
    coverage_reason: resolvedCoverage.coverage_reason,
    contract_type: contractType,
    fault_cause: faultCause,
  };
}

async function ensureFormalDocumentForBudget({ presupuesto, propuesta, reparacion, publicUrl, signatureStatus }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let resolvedPublicUrl = publicUrl;

    if (!resolvedPublicUrl) {
      const existingFormalRes = await client.query(
        `
        SELECT public_url
        FROM public.formal_document
        WHERE entity_type = 'presupuesto_reparacion'
          AND entity_id = $1
          AND document_type = 'PRESUPUESTO_REPARACION'
        LIMIT 1
        `,
        [presupuesto.id]
      );
      resolvedPublicUrl = existingFormalRes.rows[0]?.public_url ?? null;
    }

    const documentNumber = await ensureEntityDocumentNumberTx(client, {
      entityTable: "presupuesto_reparacion",
      entityIdColumn: "id",
      entityId: presupuesto.id,
      documentType: "PRESUPUESTO_REPARACION",
    });

    const snapshotHtml = buildRepairBudgetFormalSnapshot({
      presupuesto: { ...presupuesto, document_number: documentNumber },
      propuesta,
      reparacion,
      publicUrl: resolvedPublicUrl,
    });

    await client.query(
      `
      UPDATE public.presupuesto_reparacion
      SET document_number = $2,
          formal_snapshot_html = $3,
          updated_at = NOW()
      WHERE id = $1
      `,
      [presupuesto.id, documentNumber, snapshotHtml]
    );

    const formalDocument = await upsertFormalDocumentTx(client, {
      documentType: "PRESUPUESTO_REPARACION",
      entityType: "presupuesto_reparacion",
      entityId: presupuesto.id,
      documentNumber,
      snapshotHtml,
      signatureStatus,
      publicUrl: resolvedPublicUrl,
      accountingStatus: "PENDING",
    });

    await client.query("COMMIT");
    return { documentNumber, snapshotHtml, formalDocument, publicUrl: resolvedPublicUrl };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function saveBudgetPdfArtifact({ formalDocumentId, stage, pdf }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await saveFormalDocumentArtifactTx(client, {
      formalDocumentId,
      artifactStage: stage,
      pdfContent: pdf.content,
      pdfMimeType: pdf.mimeType,
      pdfFilename: pdf.filename,
      pdfSha256: pdf.sha256,
      pdfVersion: 1,
    });

    if (stage === "FINAL") {
      await saveFormalDocumentPdfTx(client, {
        formalDocumentId,
        pdfContent: pdf.content,
        pdfMimeType: pdf.mimeType,
        pdfFilename: pdf.filename,
        pdfSha256: pdf.sha256,
        pdfVersion: 1,
      });
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function crearPresupuestoReparacionIntoDB(body) {
  const context = await findRepairBudgetCreationContext(body.reparacion_id);
  const payload = buildRepairBudgetPayloadFromRepair(body, context);
  const isClientPayer = payload.payer_type === "CLIENTE";
  const generatedToken = isClientPayer ? generatePublicToken() : null;
  const totals = calculateTotals(payload.items, payload.iva_rate);

  const created = await crearPresupuestoReparacionTx({
    ...payload,
    ...totals,
    estado: isClientPayer ? "PENDING" : "ACEPTADA",
    reparacion_estado: isClientPayer ? "PENDIENTE_ACEPTACION" : "PRESUPUESTO_ACEPTADO",
    public_token: generatedToken?.tokenHash ?? null,
  });

  const publicUrl =
    isClientPayer && generatedToken
      ? `${getPublicBaseUrl()}/public/presupuestos-reparacion/${generatedToken.token}`
      : null;

  const formal = await ensureFormalDocumentForBudget({
    presupuesto: created.presupuesto,
    propuesta: created.propuesta,
    reparacion: created.reparacion,
    publicUrl,
    signatureStatus: isClientPayer ? "PENDING" : "SIGNED",
  });

  const enrichedBudget = await findPresupuestoReparacionById(created.presupuesto.id);

  return {
    ...enrichedBudget,
    document_number: formal.documentNumber,
    formal_snapshot_html: formal.snapshotHtml,
    public_url: publicUrl,
    requires_tecarral_signature: isClientPayer,
    email_sent: false,
    email_error: null,
  };
}

export async function signPresupuestoByTecarral(id, body, user) {
  const signatureBuffer = await normalizeSignatureImage(body.signature_base64, "Firma de Tecarral");
  const signed = await signPresupuestoTecarralTx(id, {
    buffer: signatureBuffer,
    mimeType: "image/png",
    signerName: body.signer_name,
    userId: user?.id_user ?? user?.id ?? null,
  });

  const issuedToken = generatePublicToken();
  await pool.query(
    `
    UPDATE public.presupuesto_reparacion
    SET public_token = $2,
        updated_at = NOW()
    WHERE id = $1
    `,
    [signed.id, issuedToken.tokenHash]
  );
  const publicUrl = `${getPublicBaseUrl()}/public/presupuestos-reparacion/${issuedToken.token}`;
  const signedWithPublicUrl = { ...signed, public_token: issuedToken.tokenHash };

  const formal = await ensureFormalDocumentForBudget({
    presupuesto: signedWithPublicUrl,
    propuesta: signedWithPublicUrl,
    reparacion: signedWithPublicUrl,
    publicUrl,
    signatureStatus: "PARTIAL",
  });

  const issuedPdf = await generateRepairBudgetPdf({ presupuesto: signedWithPublicUrl, stage: "ISSUED" });
  await saveBudgetPdfArtifact({
    formalDocumentId: formal.formalDocument.id,
    stage: "ISSUED",
    pdf: issuedPdf,
  });

  const delivery = await deliverRepairBudgetPdf({
    formalDocumentId: formal.formalDocument.id,
    presupuesto: { ...signedWithPublicUrl, document_number: formal.documentNumber },
    stage: "ISSUED",
    pdfContent: issuedPdf.content,
    pdfFilename: issuedPdf.filename,
    publicUrl: formal.publicUrl,
  });

  await broadcastNotification({
    tipo: NOTIFICATION_TYPES.PRESUPUESTO_PENDIENTE_FIRMA,
    title: "Presupuesto pendiente de firma",
    message: `El presupuesto de reparación ${getBudgetDocumentNumber(signed)} se ha emitido y queda pendiente del cliente.`,
    entity_type: "presupuesto_reparacion",
    entity_id: signed.id,
    dedupeKeyBase: `repair-budget:${signed.id}:issued`,
    payload: { presupuesto_reparacion_id: signed.id, reparacion_id: signed.reparacion_id },
  });

  return {
    ...signedWithPublicUrl,
    document_number: formal.documentNumber,
    public_url: formal.publicUrl,
    pdf_generated: true,
    pdf_sha256: issuedPdf.sha256,
    issued_delivery_status: delivery,
  };
}

export async function acceptPublicPresupuesto(tokenHash, signature) {
  const result = await acceptPresupuestoAtomic(tokenHash, signature);

  if (result.type !== "OK") {
    return result;
  }

  const presupuesto = await findPresupuestoReparacionById(result.id);
  const formal = await ensureFormalDocumentForBudget({
    presupuesto,
    propuesta: presupuesto,
    reparacion: presupuesto,
    publicUrl: null,
    signatureStatus: "SIGNED",
  });

  const finalPdf = await generateRepairBudgetPdf({ presupuesto, stage: "FINAL" });
  await saveBudgetPdfArtifact({
    formalDocumentId: formal.formalDocument.id,
    stage: "FINAL",
    pdf: finalPdf,
  });

  const delivery = await deliverRepairBudgetPdf({
    formalDocumentId: formal.formalDocument.id,
    presupuesto: { ...presupuesto, document_number: formal.documentNumber },
    stage: "FINAL",
    pdfContent: finalPdf.content,
    pdfFilename: finalPdf.filename,
    publicUrl: formal.publicUrl,
  });

  await dispatchAccountingDocument({
    documentType: "PRESUPUESTO_REPARACION",
    entityType: "presupuesto_reparacion",
    entityId: presupuesto.id,
    subject: `Presupuesto de reparación ${getBudgetDocumentNumber(presupuesto)} aceptado`,
    html: presupuesto.formal_snapshot_html ?? buildRepairBudgetFormalSnapshot({ presupuesto, propuesta: presupuesto, reparacion: presupuesto, publicUrl: formal.publicUrl }),
    text: `Presupuesto ${getBudgetDocumentNumber(presupuesto)} aceptado y preparado para contabilidad.`,
    sendEmail: false,
    payload: { presupuesto, pdf_sha256: finalPdf.sha256 },
  });

  return { type: "OK", presupuesto, pdf: finalPdf, delivery };
}

export async function getPresupuestoReparacionById(id) {
  return findPresupuestoReparacionById(id);
}

export async function listRepairBudgets(filters = {}) {
  return listPresupuestosReparacion(filters);
}

