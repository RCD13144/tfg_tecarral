import pool from "../config/db.js";
import {
  SERVICE_CONTRACT_STATES,
  SERVICE_VISIT_STATES,
} from "../constants/serviceContract.js";
import { ensureEntityDocumentNumberTx } from "./formalDocument.repository.js";

function normalizeMachineIds(data) {
  const ids = Array.isArray(data?.id_maquinas) ? data.id_maquinas : [data?.id_maquina];
  return Array.from(
    new Set(
      ids
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );
}

export async function createServiceContractTx(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const machineIds = normalizeMachineIds(data);

    const contractRes = await client.query(
      `
      INSERT INTO public.service_contract (
        contract_type,
        estado,
        public_token_hash,
        titulo,
        descripcion,
        tarifa_fija,
        recurrencia_valor,
        recurrencia_unidad,
        maintenance_day_of_month,
        maintenance_weekday,
        start_date,
        end_date,
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        cliente_direccion,
        cliente_poblacion,
        cliente_cp,
        condiciones,
        created_by,
        formal_snapshot_html
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING *;
      `,
      [
        data.contract_type,
        data.estado,
        data.public_token_hash,
        data.titulo ?? null,
        data.descripcion ?? null,
        data.tarifa_fija,
        data.recurrencia_valor,
        data.recurrencia_unidad,
        data.maintenance_day_of_month ?? null,
        data.maintenance_weekday ?? null,
        data.start_date,
        data.end_date ?? null,
        data.cliente_nombre,
        data.cliente_email ?? null,
        data.cliente_telefono ?? null,
        data.cliente_direccion ?? null,
        data.cliente_poblacion ?? null,
        data.cliente_cp ?? null,
        data.condiciones ?? null,
        data.created_by ?? null,
        data.formal_snapshot_html ?? null,
      ]
    );

    const contract = contractRes.rows[0];

    for (const machineId of machineIds) {
      await client.query(
        `
        INSERT INTO public.service_contract_machine (
          service_contract_id,
          id_maquina
        )
        VALUES ($1, $2)
        ON CONFLICT (service_contract_id, id_maquina)
        DO NOTHING
        `,
        [contract.id, machineId]
      );

      await client.query(
        `
        UPDATE public.maquina
        SET service_contract_id = $2
        WHERE id_maquina = $1
        `,
        [machineId, contract.id]
      );
    }

    const documentNumber = await ensureEntityDocumentNumberTx(client, {
      entityTable: 'service_contract',
      entityIdColumn: 'id',
      entityId: contract.id,
      documentType: 'CONTRATO_MANTENIMIENTO',
    });

    await client.query("COMMIT");
    return { ...contract, document_number: documentNumber };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

const CONTRACT_SELECT = `
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
      SELECT m1.marca
      FROM public.service_contract_machine scm1
      JOIN public.maquina m1 ON m1.id_maquina = scm1.id_maquina
      WHERE scm1.service_contract_id = sc.id
      ORDER BY scm1.id_maquina ASC
      LIMIT 1
    ) AS maquina_marca,
    (
      SELECT m1.modelo
      FROM public.service_contract_machine scm1
      JOIN public.maquina m1 ON m1.id_maquina = scm1.id_maquina
      WHERE scm1.service_contract_id = sc.id
      ORDER BY scm1.id_maquina ASC
      LIMIT 1
    ) AS maquina_modelo,
    (
      SELECT m1.ns
      FROM public.service_contract_machine scm1
      JOIN public.maquina m1 ON m1.id_maquina = scm1.id_maquina
      WHERE scm1.service_contract_id = sc.id
      ORDER BY scm1.id_maquina ASC
      LIMIT 1
    ) AS maquina_ns,
    (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id_maquina', m2.id_maquina,
            'marca', m2.marca,
            'modelo', m2.modelo,
            'ns', m2.ns,
            'ownership_type', m2.ownership_type
          )
          ORDER BY m2.id_maquina ASC
        ),
        '[]'::json
      )
      FROM public.service_contract_machine scm2
      JOIN public.maquina m2 ON m2.id_maquina = scm2.id_maquina
      WHERE scm2.service_contract_id = sc.id
    ) AS machines,
    (
      SELECT COUNT(*)
      FROM public.service_contract_signature sig
      WHERE sig.service_contract_id = sc.id
    )::int AS signatures_count,
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
`;

export async function findServiceContractById(id) {
  const result = await pool.query(
    `
    ${CONTRACT_SELECT}
    WHERE sc.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function findServiceContractByPublicTokenHash(publicTokenHash) {
  const result = await pool.query(
    `
    ${CONTRACT_SELECT}
    WHERE sc.public_token_hash = $1
    LIMIT 1
    `,
    [publicTokenHash]
  );

  return result.rows[0] ?? null;
}

export async function listServiceContracts({ machineId = null, pendingTecarralOnly = false } = {}) {
  const values = [];
  const conditions = [];

  if (machineId !== null) {
    values.push(machineId);
    conditions.push(`EXISTS (
      SELECT 1
      FROM public.service_contract_machine scm
      WHERE scm.service_contract_id = sc.id
        AND scm.id_maquina = $${values.length}
    )`);
  }

  if (pendingTecarralOnly) {
    conditions.push(`sc.estado IN ('PENDIENTE_FIRMA_TECARRAL', 'PENDIENTE_FIRMA_CLIENTE')`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    ${CONTRACT_SELECT}
    ${where}
    ORDER BY sc.created_at DESC, sc.id DESC
    `,
    values
  );

  return result.rows;
}

export async function listVisitsByContractId(serviceContractId) {
  const result = await pool.query(
    `
    SELECT *
    FROM public.service_visit_schedule
    WHERE service_contract_id = $1
    ORDER BY scheduled_for ASC, id ASC
    `,
    [serviceContractId]
  );

  return result.rows;
}

export async function listPendingContractsNeedingExpiration() {
  const result = await pool.query(
    `
    SELECT *
    FROM public.service_contract
    WHERE estado = 'ACTIVO'
      AND end_date IS NOT NULL
      AND end_date < CURRENT_DATE
    `
  );

  return result.rows;
}

export async function expireEndedContractsTx() {
  const result = await pool.query(
    `
    UPDATE public.service_contract
    SET estado = $2,
        updated_at = NOW()
    WHERE estado = $1
      AND end_date IS NOT NULL
      AND end_date < CURRENT_DATE
    RETURNING id
    `,
    [SERVICE_CONTRACT_STATES.ACTIVO, SERVICE_CONTRACT_STATES.VENCIDO]
  );

  return result.rowCount ?? 0;
}

export async function insertContractSignatureTx(client, data) {
  const result = await client.query(
    `
    INSERT INTO public.service_contract_signature (
      service_contract_id,
      signer_type,
      signer_name,
      signer_email,
      signature_image,
      signature_mime
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (service_contract_id, signer_type)
    DO UPDATE SET
      signer_name = EXCLUDED.signer_name,
      signer_email = EXCLUDED.signer_email,
      signature_image = EXCLUDED.signature_image,
      signature_mime = EXCLUDED.signature_mime,
      signed_at = NOW()
    RETURNING *
    `,
    [
      data.service_contract_id,
      data.signer_type,
      data.signer_name,
      data.signer_email ?? null,
      data.signature_image,
      data.signature_mime ?? "image/png",
    ]
  );

  return result.rows[0];
}

export async function getContractSignaturesTx(client, serviceContractId) {
  const result = await client.query(
    `
    SELECT *
    FROM public.service_contract_signature
    WHERE service_contract_id = $1
    ORDER BY id ASC
    `,
    [serviceContractId]
  );

  return result.rows;
}

export async function updateContractAfterSignatureTx(client, serviceContractId, patch) {
  const setClauses = [];
  const values = [];

  for (const [key, value] of Object.entries(patch)) {
    values.push(value);
    setClauses.push(`${key} = $${values.length}`);
  }

  values.push(serviceContractId);

  const result = await client.query(
    `
    UPDATE public.service_contract
    SET ${setClauses.join(", ")},
        updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING *
    `,
    values
  );

  return result.rows[0] ?? null;
}

export async function replaceVisitsForContractTx(client, serviceContractId, visits) {
  await client.query(
    `
    DELETE FROM public.service_visit_schedule
    WHERE service_contract_id = $1
      AND estado = $2
    `,
    [serviceContractId, SERVICE_VISIT_STATES.PENDIENTE]
  );

  for (const visit of visits) {
    await client.query(
      `
      INSERT INTO public.service_visit_schedule (
        service_contract_id,
        id_maquina,
        scheduled_for,
        estado
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (service_contract_id, id_maquina, scheduled_for)
      DO NOTHING
      `,
      [
        serviceContractId,
        visit.id_maquina,
        visit.scheduled_for,
        visit.estado ?? SERVICE_VISIT_STATES.PENDIENTE,
      ]
    );
  }
}

export async function markVisitCompleted(visitId, completedBy, notes) {
  const result = await pool.query(
    `
    UPDATE public.service_visit_schedule
    SET estado = 'REALIZADA',
        completed_at = NOW(),
        completed_by = $2,
        notes = COALESCE($3, notes),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [visitId, completedBy, notes ?? null]
  );

  return result.rows[0] ?? null;
}

export async function findVisitById(visitId) {
  const result = await pool.query(
    `
    SELECT svs.*, sc.cliente_nombre, sc.contract_type,
      (
        SELECT scm.id_maquina
        FROM public.service_contract_machine scm
        WHERE scm.service_contract_id = sc.id
        ORDER BY scm.id_maquina ASC
        LIMIT 1
      ) AS id_maquina
    FROM public.service_visit_schedule svs
    JOIN public.service_contract sc
      ON sc.id = svs.service_contract_id
    WHERE svs.id = $1
    LIMIT 1
    `,
    [visitId]
  );

  return result.rows[0] ?? null;
}

export async function findVisitsForReminderDispatch() {
  const result = await pool.query(
    `
    SELECT
      svs.*,
      sc.contract_type,
      sc.cliente_nombre,
      sc.cliente_email,
      m.marca,
      m.modelo,
      m.ns
    FROM public.service_visit_schedule svs
    JOIN public.service_contract sc
      ON sc.id = svs.service_contract_id
    JOIN public.maquina m
      ON m.id_maquina = svs.id_maquina
    WHERE sc.estado = $1
      AND svs.estado = $2
    ORDER BY svs.scheduled_for ASC, svs.id ASC
    `,
    [SERVICE_CONTRACT_STATES.ACTIVO, SERVICE_VISIT_STATES.PENDIENTE]
  );

  return result.rows;
}

export async function markReminderSent(visitId, reminderColumn) {
  const allowedColumns = new Set([
    "reminder_week_before_sent_at",
    "reminder_same_day_sent_at",
    "reminder_two_days_after_sent_at",
    "reminder_week_after_sent_at",
  ]);

  if (!allowedColumns.has(reminderColumn)) {
    throw new Error("Reminder column inválida");
  }

  await pool.query(
    `
    UPDATE public.service_visit_schedule
    SET ${reminderColumn} = NOW(),
        updated_at = NOW()
    WHERE id = $1
    `,
    [visitId]
  );
}
