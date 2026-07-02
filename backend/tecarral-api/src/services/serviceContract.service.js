import pool from "../config/db.js";
import crypto from "node:crypto";
import { generatePublicToken, hashPublicToken } from "../utils/publicToken.js";
import {
  COVERAGE_DECISIONS,
  COVERAGE_REASONS,
  NOTIFICATION_TYPES,
  SERVICE_CONTRACT_STATES,
  SERVICE_CONTRACT_TYPES,
  SERVICE_CONTEXT_TYPES,
  SERVICE_VISIT_STATES,
} from "../constants/serviceContract.js";
import {
  createServiceContractTx,
  expireEndedContractsTx,
  findServiceContractById,
  findServiceContractByPublicTokenHash,
  findVisitById,
  findVisitsForReminderDispatch,
  getContractSignaturesTx,
  insertContractSignatureTx,
  listServiceContracts,
  listVisitsByContractId,
  markReminderSent,
  markVisitCompleted,
  replaceVisitsForContractTx,
  updateContractAfterSignatureTx,
} from "../repositories/serviceContract.repository.js";
import {
  getFormalDocumentArtifact,
  saveFormalDocumentArtifactTx,
  saveFormalDocumentPdfTx,
  upsertFormalDocumentTx,
} from "../repositories/formalDocument.repository.js";
import { broadcastNotification } from "./notification.service.js";
import { dispatchAccountingDocument } from "./accountingDispatch.service.js";
import { findPresupuestoReparacionById } from "../repositories/presupuestoReparacion.repository.js";
import {
  buildServiceContractFormalSnapshot,
  escapeHtml,
  formatDateEs,
  formatMoneyEs,
} from "../utils/formalDocuments.js";
import { generateServiceContractPdf } from "../documents/serviceContractPdf.document.js";
import { deliverServiceContractPdf } from "./serviceContractDelivery.service.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function base64ToBuffer(input) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return null;
  }

  const [, payload = raw] = raw.split("base64,");
  const buffer = Buffer.from(payload, "base64");
  return buffer.length > 0 ? buffer : null;
}

function isValidEmail(value) {
  const email = String(value ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function addInterval(baseDate, value, unit) {
  const next = new Date(baseDate.getTime());

  if (unit === "DAY") {
    next.setUTCDate(next.getUTCDate() + value);
    return next;
  }

  if (unit === "WEEK") {
    next.setUTCDate(next.getUTCDate() + value * 7);
    return next;
  }

  if (unit === "MONTH") {
    next.setUTCMonth(next.getUTCMonth() + value);
    return next;
  }

  next.setUTCFullYear(next.getUTCFullYear() + value);
  return next;
}

function parseDateOnly(value) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00.000Z` : raw;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeDateOnly(value) {
  const parsed = parseDateOnly(value);
  return parsed ? parsed.toISOString().slice(0, 10) : null;
}

function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function normalizeContractMachines(contract) {
  if (Array.isArray(contract?.machines)) {
    return contract.machines;
  }

  return [
    contract?.id_maquina
      ? {
          id_maquina: contract.id_maquina,
          marca: contract.maquina_marca ?? null,
          modelo: contract.maquina_modelo ?? null,
          ns: contract.maquina_ns ?? null,
        }
      : null,
  ].filter(Boolean);
}

function getContractDocumentNumber(contract) {
  return String(contract?.document_number ?? '').trim() || `CTR-${contract?.id ?? '-'}`;
}

function buildContractSnapshot(contract, signatures) {
  return buildServiceContractFormalSnapshot(
    { ...contract, document_number: getContractDocumentNumber(contract) },
    signatures
  );
}

function hashPdf(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function contractPdfFilename(contract) {
  return `${getContractDocumentNumber(contract)}.pdf`;
}

async function getContractSignatures(contractId) {
  const client = await pool.connect();
  try {
    return await getContractSignaturesTx(client, contractId);
  } finally {
    client.release();
  }
}

async function generateAndDeliverContractPdf({ contractId, stage, publicUrl = null, send = true }) {
  const contract = await findServiceContractById(contractId);
  if (!contract) {
    throw createHttpError(404, "Contrato no encontrado");
  }

  const signatures = await getContractSignatures(contractId);
  const pdfContent = await generateServiceContractPdf({ contract, signatures, stage });
  const pdfFilename = contractPdfFilename(contract);
  const pdfSha256 = hashPdf(pdfContent);
  const signatureStatus =
    signatures.some((item) => item.signer_type === "CLIENTE") &&
    signatures.some((item) => item.signer_type === "TECARRAL")
      ? "SIGNED"
      : signatures.length > 0
        ? "PARTIAL"
        : "PENDING";

  let formalDocument;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    formalDocument = await upsertFormalDocumentTx(client, {
      documentType: "CONTRATO_MANTENIMIENTO",
      entityType: "service_contract",
      entityId: contract.id,
      documentNumber: contract.document_number,
      snapshotHtml: buildContractSnapshot(contract, signatures),
      signatureStatus,
      publicUrl,
      accountingStatus: "PENDING",
    });

    await saveFormalDocumentArtifactTx(client, {
      formalDocumentId: formalDocument.id,
      artifactStage: stage,
      pdfContent,
      pdfMimeType: "application/pdf",
      pdfFilename,
      pdfSha256,
      pdfVersion: 1,
    });

    if (stage === "FINAL") {
      await saveFormalDocumentPdfTx(client, {
        formalDocumentId: formalDocument.id,
        pdfContent,
        pdfMimeType: "application/pdf",
        pdfFilename,
        pdfSha256,
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

  const delivery = send
    ? await deliverServiceContractPdf({
        formalDocumentId: formalDocument.id,
        contract,
        stage,
        pdfContent,
        pdfFilename,
        publicUrl,
      })
    : null;

  return {
    pdf_generated: true,
    stage,
    pdf_filename: pdfFilename,
    pdf_sha256: pdfSha256,
    formal_document_id: formalDocument.id,
    delivery,
  };
}


function moveToWeekday(date, weekday) {
  const target = Number(weekday);
  if (!Number.isInteger(target) || target < 0 || target > 6) {
    return date;
  }

  const next = new Date(date.getTime());
  const diff = (target - next.getUTCDay() + 7) % 7;
  next.setUTCDate(next.getUTCDate() + diff);
  return next;
}

function moveToMonthDay(date, dayOfMonth) {
  const target = Number(dayOfMonth);
  if (!Number.isInteger(target) || target < 1 || target > 31) {
    return date;
  }

  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(target, lastDay));

  if (next < date) {
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    const nextLastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
    next.setUTCDate(Math.min(target, nextLastDay));
  }

  return next;
}

function buildVisitsForContract(contract) {
  const machines = normalizeContractMachines(contract);
  const start = parseDateOnly(contract.start_date);

  if (!start || machines.length === 0) {
    return [];
  }

  const unit = String(contract.recurrencia_unidad ?? 'MONTH').trim().toUpperCase();
  const value = Math.max(1, Number(contract.recurrencia_valor ?? 1));
  const explicitEnd = parseDateOnly(contract.end_date);
  const end = explicitEnd ?? addInterval(start, 1, 'YEAR');
  const visits = [];
  let cursor = new Date(start.getTime());

  if (unit === 'WEEK') {
    cursor = moveToWeekday(cursor, contract.maintenance_weekday);
  } else if (unit === 'MONTH') {
    cursor = moveToMonthDay(cursor, contract.maintenance_day_of_month);
  }

  let guard = 0;
  while (cursor <= end && guard < 120) {
    const scheduledFor = toIsoDate(cursor);
    if (scheduledFor) {
      for (const machine of machines) {
        visits.push({
          service_contract_id: contract.id,
          id_maquina: machine.id_maquina,
          scheduled_for: scheduledFor,
          estado: SERVICE_VISIT_STATES.PENDIENTE,
        });
      }
    }

    cursor = addInterval(cursor, value, unit);
    if (unit === 'MONTH' && contract.maintenance_day_of_month) {
      cursor = moveToMonthDay(cursor, contract.maintenance_day_of_month);
    } else if (unit === 'WEEK' && contract.maintenance_weekday) {
      cursor = moveToWeekday(cursor, contract.maintenance_weekday);
    }
    guard += 1;
  }

  return visits;
}


async function findServiceContractByIdTx(client, contractId) {
  const result = await client.query(
    `
    SELECT
      sc.*,
      (
        SELECT scm1.id_maquina
        FROM public.service_contract_machine scm1
        WHERE scm1.service_contract_id = sc.id
        ORDER BY scm1.id_maquina ASC
        LIMIT 1
      ) AS id_maquina,
      (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id_maquina', m.id_maquina,
              'marca', m.marca,
              'modelo', m.modelo,
              'ns', m.ns,
              'ownership_type', m.ownership_type
            )
            ORDER BY m.id_maquina ASC
          ),
          '[]'::json
        )
        FROM public.service_contract_machine scm
        JOIN public.maquina m ON m.id_maquina = scm.id_maquina
        WHERE scm.service_contract_id = sc.id
      ) AS machines,
      EXISTS (
        SELECT 1
        FROM public.service_contract_signature sig
        WHERE sig.service_contract_id = sc.id
          AND sig.signer_type = 'CLIENTE'
      ) AS client_signed,
      EXISTS (
        SELECT 1
        FROM public.service_contract_signature sig
        WHERE sig.service_contract_id = sc.id
          AND sig.signer_type = 'TECARRAL'
      ) AS tecarral_signed
    FROM public.service_contract sc
    WHERE sc.id = $1
    LIMIT 1
    `,
    [contractId]
  );

  return result.rows[0] ?? null;
}

async function activateContractIfReady(client, contractId) {
  const contractRes = await client.query(
    `
    SELECT *
    FROM public.service_contract
    WHERE id = $1
    FOR UPDATE
    `,
    [contractId]
  );

  const lockedContract = contractRes.rows[0] ?? null;
  if (!lockedContract) {
    throw createHttpError(404, 'Contrato no encontrado');
  }

  const signatures = await getContractSignaturesTx(client, contractId);
  const hasClientSignature = signatures.some((signature) => signature.signer_type === 'CLIENTE');
  const hasTecarralSignature = signatures.some((signature) => signature.signer_type === 'TECARRAL');
  const active = hasClientSignature && hasTecarralSignature;
  const nextState = active
    ? SERVICE_CONTRACT_STATES.ACTIVO
    : hasClientSignature
      ? SERVICE_CONTRACT_STATES.PENDIENTE_FIRMA_TECARRAL
      : SERVICE_CONTRACT_STATES.PENDIENTE_FIRMA_CLIENTE;

  const snapshotHtml = buildContractSnapshot(
    { ...lockedContract, client_signed: hasClientSignature, tecarral_signed: hasTecarralSignature },
    signatures
  );

  await updateContractAfterSignatureTx(client, contractId, {
    estado: nextState,
    formal_snapshot_html: snapshotHtml,
  });

  const refreshedContract = await findServiceContractByIdTx(client, contractId);

  if (active && lockedContract.estado !== SERVICE_CONTRACT_STATES.ACTIVO) {
    await replaceVisitsForContractTx(client, contractId, buildVisitsForContract(refreshedContract));
  }

  return {
    activated: active && lockedContract.estado !== SERVICE_CONTRACT_STATES.ACTIVO,
    contract: refreshedContract,
  };
}

function buildContractPublicHtml(contract, token, message = null) {
  const action = `/public/contratos-mantenimiento/${encodeURIComponent(token)}/sign`;
  const machines = normalizeContractMachines(contract);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contrato de mantenimiento</title>
</head>
<body style="font-family: system-ui, Arial; padding: 24px; max-width: 760px; margin: 0 auto; color: #0b315f;">
  <h2>Contrato de mantenimiento</h2>
  ${message ? `<p style="font-weight:600;">${escapeHtml(message)}</p>` : ""}
  <p><strong>Número:</strong> ${escapeHtml(getContractDocumentNumber(contract))}</p>
  <p><strong>Tipo:</strong> ${escapeHtml(contract.contract_type)}</p>
  <p><strong>Cliente:</strong> ${escapeHtml(contract.cliente_nombre)}</p>
  <p><strong>Máquina/s incluidas:</strong> ${escapeHtml(machines.map((machine) => `#${machine.id_maquina}`).join(", ") || "-")}</p>
  <p><strong>Tarifa:</strong> ${formatMoneyEs(contract.tarifa_fija)}</p>
  <p><strong>Fecha de inicio:</strong> ${escapeHtml(formatDateEs(contract.start_date))}</p>
  <p><strong>Condiciones:</strong> ${escapeHtml(contract.condiciones ?? "-")}</p>
  <form method="post" action="${action}" onsubmit="return prepareSignature()" style="margin-top:16px;">
    <label style="display:block; margin-bottom:8px;">Nombre firmante</label>
    <input name="signer_name" required style="width:100%; height:40px; margin-bottom:12px;" />
    <label style="display:flex; gap:8px; margin-bottom:12px;">
      <input type="checkbox" name="accepted" value="yes" required />
      <span>Acepto las condiciones del contrato</span>
    </label>
    <p style="margin-bottom:6px;">Firma:</p>
    <canvas id="pad" width="700" height="220" style="width:100%; border:1px solid #999; border-radius:8px; touch-action:none;"></canvas>
    <input type="hidden" name="signature_base64" id="signature_base64" />
    <div style="margin-top:12px; display:flex; gap:12px;">
      <button type="button" onclick="clearPad()">Limpiar</button>
      <button type="submit">Firmar contrato</button>
    </div>
  </form>
  <script>
    const canvas = document.getElementById('pad');
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    let drawing = false;
    function point(evt) {
      const rect = canvas.getBoundingClientRect();
      const touch = evt.touches && evt.touches[0];
      const clientX = touch ? touch.clientX : evt.clientX;
      const clientY = touch ? touch.clientY : evt.clientY;
      return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
    }
    function start(evt) { drawing = true; const p = point(evt); ctx.beginPath(); ctx.moveTo(p.x, p.y); evt.preventDefault(); }
    function move(evt) { if (!drawing) return; const p = point(evt); ctx.lineTo(p.x, p.y); ctx.stroke(); evt.preventDefault(); }
    function stop(evt) { drawing = false; evt.preventDefault(); }
    function clearPad() { ctx.clearRect(0, 0, canvas.width, canvas.height); }
    function prepareSignature() { document.getElementById('signature_base64').value = canvas.toDataURL('image/png'); return true; }
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop, { passive: false });
  </script>
</body>
</html>`;
}

export async function createServiceContract(data, actorUserId) {
  const machineIds = Array.isArray(data?.id_maquinas)
    ? Array.from(new Set(data.id_maquinas.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)))
    : [Number(data?.id_maquina)].filter((value) => Number.isInteger(value) && value > 0);

  if (machineIds.length === 0) {
    throw createHttpError(400, "id_maquina inválido");
  }

  const machineRes = await pool.query(
    `
    SELECT id_maquina, ownership_type, service_contract_id, marca, modelo, ns
    FROM public.maquina
    WHERE id_maquina = ANY($1::bigint[])
    ORDER BY id_maquina ASC
    `,
    [machineIds]
  );

  if (machineRes.rowCount !== machineIds.length) {
    throw createHttpError(404, "Alguna máquina no existe");
  }

  for (const machine of machineRes.rows) {
    if (String(machine.ownership_type ?? "").trim().toUpperCase() !== "CLIENTE") {
      throw createHttpError(409, "Solo se pueden crear contratos sobre máquinas del cliente");
    }

    if (machine.service_contract_id) {
      throw createHttpError(409, `La máquina #${machine.id_maquina} ya tiene un contrato de mantenimiento vinculado`);
    }
  }

  if (!isValidEmail(data?.cliente_email)) {
    throw createHttpError(409, "El contrato necesita un email válido del cliente para la firma");
  }

  const normalizedStartDate = normalizeDateOnly(data?.start_date);
  const normalizedEndDate = normalizeDateOnly(data?.end_date);

  if (!normalizedStartDate) {
    throw createHttpError(400, "La fecha de inicio del contrato no es válida");
  }

  if (data?.end_date && !normalizedEndDate) {
    throw createHttpError(400, "La fecha de fin del contrato no es válida");
  }

  if (normalizedEndDate && normalizedEndDate <= normalizedStartDate) {
    throw createHttpError(400, "La fecha de fin debe ser posterior a la fecha de inicio");
  }

  const generatedToken = generatePublicToken();
  const createdContract = await createServiceContractTx({
    ...data,
    id_maquinas: machineIds,
    id_maquina: machineIds[0],
    start_date: normalizedStartDate,
    end_date: normalizedEndDate,
    estado: SERVICE_CONTRACT_STATES.PENDIENTE_FIRMA_CLIENTE,
    public_token_hash: generatedToken.tokenHash,
    created_by: actorUserId,
  });

  const contract = await findServiceContractById(createdContract.id);
  const publicUrl = `${String(process.env.PUBLIC_BASE_URL ?? "http://localhost:3000").trim()}/public/contratos-mantenimiento/${generatedToken.token}`;

  let issuedPdf = null;
  let emailError = null;

  try {
    issuedPdf = await generateAndDeliverContractPdf({
      contractId: contract.id,
      stage: "ISSUED",
      publicUrl,
      send: true,
    });
  } catch (error) {
    emailError = error?.message ?? "Error generando o enviando el contrato";
  }

  return {
    ...contract,
    public_url: publicUrl,
    issued_pdf_generated: issuedPdf?.pdf_generated === true,
    issued_delivery_status: issuedPdf?.delivery ?? null,
    email_sent:
      issuedPdf?.delivery?.customer_delivery_status === "SENT" &&
      issuedPdf?.delivery?.internal_delivery_status === "SENT",
    email_error: emailError,
  };
}
export async function getServiceContract(id) {
  const contract = await findServiceContractById(id);

  if (!contract) {
    throw createHttpError(404, "Contrato no encontrado");
  }

  const visits = await listVisitsByContractId(id);
  return { ...contract, visits };
}

export async function getServiceContractPdf(id, stage = "FINAL") {
  const normalizedStage = String(stage ?? "FINAL").trim().toUpperCase() === "ISSUED" ? "ISSUED" : "FINAL";
  const artifact = await getFormalDocumentArtifact({
    entityType: "service_contract",
    entityId: id,
    documentType: "CONTRATO_MANTENIMIENTO",
    artifactStage: normalizedStage,
  });

  if (!artifact) {
    throw createHttpError(404, "PDF del contrato no encontrado");
  }

  return artifact;
}
export async function listContracts(filters = {}) {
  return listServiceContracts(filters);
}

export async function getPublicContractHtml(token) {
  const tokenHash = hashPublicToken(token);
  const contract = await findServiceContractByPublicTokenHash(tokenHash);

  if (!contract) {
    return "<html><body><p>Enlace no válido</p></body></html>";
  }

  const message =
    contract.client_signed
      ? "Este contrato ya fue firmado por el cliente."
      : null;

  return buildContractPublicHtml(contract, token, message);
}

export async function signServiceContractByClientToken(token, payload) {
  const tokenHash = hashPublicToken(token);
  const contract = await findServiceContractByPublicTokenHash(tokenHash);

  if (!contract) {
    throw createHttpError(404, "Contrato no encontrado");
  }

  if (contract.client_signed) {
    throw createHttpError(409, "El cliente ya ha firmado este contrato");
  }

  const signatureBuffer = base64ToBuffer(payload.signature_base64);

  if (!signatureBuffer) {
    throw createHttpError(400, "Firma cliente inválida");
  }

  if (!String(payload.signer_name ?? "").trim()) {
    throw createHttpError(400, "Nombre del firmante requerido");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await insertContractSignatureTx(client, {
      service_contract_id: contract.id,
      signer_type: "CLIENTE",
      signer_name: String(payload.signer_name).trim(),
      signer_email: contract.cliente_email ?? null,
      signature_image: signatureBuffer,
      signature_mime: "image/png",
    });

    const activation = await activateContractIfReady(client, contract.id);
    await client.query("COMMIT");

    if (activation.activated) {
      try {
        activation.final_pdf = await generateAndDeliverContractPdf({
          contractId: contract.id,
          stage: "FINAL",
          publicUrl: null,
          send: true,
        });
      } catch (error) {
        activation.final_pdf_error = error?.message ?? "Error generando o enviando el contrato firmado";
      }
      await dispatchAccountingDocument({
        documentType: 'CONTRATO_MANTENIMIENTO',
        entityType: 'service_contract',
        entityId: contract.id,
        subject: `Contrato de mantenimiento ${contract.document_number ?? `#${contract.id}`}`,
        html:
          activation.contract.formal_snapshot_html ??
          activation.contract.snapshot_html ??
          buildContractSnapshot(activation.contract, []),
        text: `Contrato de mantenimiento ${contract.document_number ?? `#${contract.id}`} activado para ${contract.cliente_nombre}.`,
        sendEmail: false,
        payload: activation.contract,
      });
      await broadcastNotification({
        tipo: NOTIFICATION_TYPES.CONTRATO_FIRMADO,
        title: "Contrato de mantenimiento activado",
        message: `El contrato de mantenimiento #${contract.id} ya está activo para la máquina #${contract.id_maquina}.`,
        entity_type: "service_contract",
        entity_id: contract.id,
        dedupeKeyBase: `service-contract:${contract.id}:activated`,
        payload: { service_contract_id: contract.id, machine_id: contract.id_maquina },
      });
    }

    return {
      ...activation.contract,
      final_pdf: activation.final_pdf ?? null,
      final_pdf_error: activation.final_pdf_error ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function signServiceContractByTecarral(contractId, payload) {
  const contract = await findServiceContractById(contractId);

  if (!contract) {
    throw createHttpError(404, "Contrato no encontrado");
  }

  if (contract.tecarral_signed) {
    throw createHttpError(409, "Tecarral ya ha firmado este contrato");
  }

  const signatureBuffer = base64ToBuffer(payload.signature_base64);

  if (!signatureBuffer) {
    throw createHttpError(400, "Firma Tecarral inválida");
  }

  if (!String(payload.signer_name ?? "").trim()) {
    throw createHttpError(400, "Nombre del firmante requerido");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await insertContractSignatureTx(client, {
      service_contract_id: contract.id,
      signer_type: "TECARRAL",
      signer_name: String(payload.signer_name).trim(),
      signer_email: payload.signer_email ?? null,
      signature_image: signatureBuffer,
      signature_mime: "image/png",
    });

    const activation = await activateContractIfReady(client, contract.id);
    await client.query("COMMIT");

    if (activation.activated) {
      try {
        activation.final_pdf = await generateAndDeliverContractPdf({
          contractId: contract.id,
          stage: "FINAL",
          publicUrl: null,
          send: true,
        });
      } catch (error) {
        activation.final_pdf_error = error?.message ?? "Error generando o enviando el contrato firmado";
      }
      await dispatchAccountingDocument({
        documentType: 'CONTRATO_MANTENIMIENTO',
        entityType: 'service_contract',
        entityId: contract.id,
        subject: `Contrato de mantenimiento ${contract.document_number ?? `#${contract.id}`}`,
        html:
          activation.contract.formal_snapshot_html ??
          activation.contract.snapshot_html ??
          buildContractSnapshot(activation.contract, []),
        text: `Contrato de mantenimiento ${contract.document_number ?? `#${contract.id}`} activado para ${contract.cliente_nombre}.`,
        sendEmail: false,
        payload: activation.contract,
      });
      await broadcastNotification({
        tipo: NOTIFICATION_TYPES.CONTRATO_FIRMADO,
        title: "Contrato de mantenimiento activado",
        message: `El contrato de mantenimiento #${contract.id} ya está activo para la máquina #${contract.id_maquina}.`,
        entity_type: "service_contract",
        entity_id: contract.id,
        dedupeKeyBase: `service-contract:${contract.id}:activated`,
        payload: { service_contract_id: contract.id, machine_id: contract.id_maquina },
      });
    }

    return {
      ...activation.contract,
      final_pdf: activation.final_pdf ?? null,
      final_pdf_error: activation.final_pdf_error ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function resolveCoverageForRepair({ contractType = null, faultCause = null } = {}) {
  const normalizedContract = String(contractType ?? "").trim().toUpperCase();
  const normalizedCause = String(faultCause ?? "").trim().toUpperCase();

  if (normalizedCause === "GOLPE_ACCIDENTE") {
    return {
      payer_type: COVERAGE_DECISIONS.CLIENTE,
      charge_reason: COVERAGE_REASONS.GOLPE_ACCIDENTE,
      coverage_decision: COVERAGE_DECISIONS.CLIENTE,
      coverage_reason: COVERAGE_REASONS.GOLPE_ACCIDENTE,
    };
  }

  if (normalizedContract === SERVICE_CONTRACT_TYPES.TODO_INCLUIDO) {
    return {
      payer_type: COVERAGE_DECISIONS.TECARRAL,
      charge_reason: null,
      coverage_decision: COVERAGE_DECISIONS.TECARRAL,
      coverage_reason: COVERAGE_REASONS.TODO_INCLUIDO,
    };
  }

  if (normalizedContract === SERVICE_CONTRACT_TYPES.PREVENTIVO) {
    return {
      payer_type: COVERAGE_DECISIONS.CLIENTE,
      charge_reason: null,
      coverage_decision: COVERAGE_DECISIONS.CLIENTE,
      coverage_reason: COVERAGE_REASONS.PREVENTIVO_NO_CUBRE,
    };
  }

  return {
    payer_type: COVERAGE_DECISIONS.CLIENTE,
    charge_reason: null,
    coverage_decision: COVERAGE_DECISIONS.CLIENTE,
    coverage_reason: COVERAGE_REASONS.REPARACION_PUNTUAL,
  };
}
export async function completeServiceVisit(visitId, completedBy, notes) {
  const visit = await markVisitCompleted(visitId, completedBy, notes);

  if (!visit) {
    throw createHttpError(404, "Visita no encontrada");
  }

  return visit;
}

export async function dispatchMaintenanceReminders() {
  const visits = await findVisitsForReminderDispatch();
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let sent = 0;

  for (const visit of visits) {
    const scheduled = new Date(`${visit.scheduled_for}T00:00:00.000Z`);
    const diffDays = Math.round((scheduled.getTime() - todayUtc.getTime()) / 86400000);
    let notificationType = null;
    let reminderColumn = null;

    if (diffDays <= -7 && !visit.reminder_week_after_sent_at) {
      notificationType = NOTIFICATION_TYPES.MANTENIMIENTO_ATRASADO_7_DIAS;
    } else if (diffDays <= -2 && !visit.reminder_two_days_after_sent_at) {
      notificationType = NOTIFICATION_TYPES.MANTENIMIENTO_ATRASADO_2_DIAS;
    } else if (diffDays <= 0 && !visit.reminder_same_day_sent_at) {
      notificationType = NOTIFICATION_TYPES.MANTENIMIENTO_HOY;
    } else if (diffDays <= 7 && diffDays > 0 && !visit.reminder_week_before_sent_at) {
      notificationType = NOTIFICATION_TYPES.MANTENIMIENTO_PROXIMO;
    }

    if (!notificationType) {
      continue;
    }

    const reminder = buildReminder(notificationType, visit);
    reminderColumn = reminder.reminderColumn;

    await broadcastNotification({
      tipo: notificationType,
      title: reminder.title,
      message: reminder.message,
      entity_type: "service_visit_schedule",
      entity_id: visit.id,
      dedupeKeyBase: reminder.dedupeKeyBase,
      payload: reminder.payload,
    });

    await markReminderSent(visit.id, reminderColumn);
    sent += 1;
  }

  return sent;
}

export async function expireEndedContracts() {
  return expireEndedContractsTx();
}

export async function getCoverageSuggestionForBudget(idPresupuesto) {
  const presupuesto = await findPresupuestoReparacionById(idPresupuesto);
  return {
    coverage_decision: presupuesto.coverage_decision,
    coverage_reason: presupuesto.coverage_reason,
    service_context_type: presupuesto.service_context_type ?? SERVICE_CONTEXT_TYPES.ALQUILER,
  };
}














