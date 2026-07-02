import { createHash } from "crypto";
import pool from "../config/db.js";
import {
  firmarAlbaranTx,
  getAlbaranDetailById,
  getAlbaranesByUser,
} from "../repositories/albaranes.repository.js";
import {
  getAlbaranFormalDocumentPdf,
  saveFormalDocumentPdfTx,
  upsertFormalDocumentTx,
} from "../repositories/formalDocument.repository.js";
import { generateSignedAlbaranPdf } from "../documents/albaranPdf.document.js";
import { buildAlbaranFormalSnapshot } from "../utils/formalDocuments.js";
import { normalizeSignatureImage } from "../utils/signatureImage.js";
import { dispatchAccountingDocument } from "./accountingDispatch.service.js";
import { deliverSignedAlbaran } from "./signedAlbaranDelivery.service.js";

export function getAlbaranes(payload) {
  return getAlbaranesByUser(payload);
}

export function getAlbaranDetail(payload) {
  return getAlbaranDetailById(payload);
}

export async function getAlbaranPdf(payload) {
  const document = await getAlbaranFormalDocumentPdf(payload);

  if (!document?.pdf_content) {
    const error = new Error("El PDF firmado del albarán no está disponible");
    error.statusCode = 404;
    throw error;
  }

  return {
    content: document.pdf_content,
    mimeType: document.pdf_mime_type || "application/pdf",
    filename: document.pdf_filename || `${document.document_number || "albaran"}.pdf`,
    sha256: document.pdf_sha256,
  };
}

export async function firmarAlbaranIntoDB(idAlbaran, payload) {
  const [firmaCliente, firmaTecnico] = await Promise.all([
    normalizeSignatureImage(payload.firmaClienteBase64, "Firma del cliente"),
    normalizeSignatureImage(payload.firmaTecnicoBase64, "Firma de Tecarral"),
  ]);

  const dbResult = await firmarAlbaranTx({
    idAlbaran,
    idUser: payload.idUser,
    observaciones: payload.observaciones ?? null,
    firmaCliente,
    firmaTecnico,
    firmaClienteMime: "image/png",
    firmaTecnicoMime: "image/png",
  });

  const pdfContent = await generateSignedAlbaranPdf({
    data: dbResult,
    customerSignature: firmaCliente,
    tecarralSignature: firmaTecnico,
  });
  const snapshotHtml = buildAlbaranFormalSnapshot(dbResult);
  const pdfFilename = `${dbResult.document_number}.pdf`;
  const pdfSha256 = createHash("sha256").update(pdfContent).digest("hex");
  const syncClient = await pool.connect();
  let formalDocument;

  try {
    await syncClient.query("BEGIN");
    await syncClient.query(
      `UPDATE public.albaran SET document_snapshot_html = $2 WHERE id_albaran = $1`,
      [dbResult.id_albaran, snapshotHtml]
    );
    formalDocument = await upsertFormalDocumentTx(syncClient, {
      documentType: "ALBARAN",
      entityType: "albaran",
      entityId: dbResult.id_albaran,
      documentNumber: dbResult.document_number,
      snapshotHtml,
      signatureStatus: "SIGNED",
      publicUrl: null,
      accountingStatus: "PENDING",
    });
    await saveFormalDocumentPdfTx(syncClient, {
      formalDocumentId: formalDocument.id,
      pdfContent,
      pdfMimeType: "application/pdf",
      pdfFilename,
      pdfSha256,
      pdfVersion: 1,
    });
    await syncClient.query("COMMIT");
  } catch (error) {
    await syncClient.query("ROLLBACK");
    throw error;
  } finally {
    syncClient.release();
  }

  const delivery = await deliverSignedAlbaran({
    formalDocumentId: formalDocument.id,
    data: dbResult,
    pdfContent,
    pdfFilename,
  });

  await dispatchAccountingDocument({
    documentType: "ALBARAN",
    entityType: "albaran",
    entityId: dbResult.id_albaran,
    subject: `Albarán ${dbResult.document_number}`,
    html: snapshotHtml,
    text: `Albarán ${dbResult.document_number} firmado para ${dbResult.cliente ?? "cliente"}.`,
    sendEmail: false,
    payload: {
      ...dbResult,
      pdf_filename: pdfFilename,
      pdf_sha256: pdfSha256,
    },
  });

  const allDelivered =
    delivery.customer_delivery_status === "SENT" &&
    delivery.internal_delivery_status === "SENT";

  return {
    id_albaran: dbResult.id_albaran,
    document_number: dbResult.document_number,
    estado: dbResult.estado,
    firmado: dbResult.firmado,
    maintenance_status: dbResult.maintenance_status,
    reparacion_paso_a_pendiente_presupuesto: dbResult.reparacion_paso_a_pendiente_presupuesto,
    pdf_generated: true,
    pdf_sha256: pdfSha256,
    customer_delivery_status: delivery.customer_delivery_status,
    internal_delivery_status: delivery.internal_delivery_status,
    email_sent: allDelivered,
    email_error: allDelivered ? null : "El PDF se ha guardado, pero queda algún envío pendiente o con error",
  };
}
