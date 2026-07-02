import pool from "../config/db.js";
import { SERVICE_CONTEXT_TYPES } from "../constants/serviceContract.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isValidEmail(value) {
  const email = String(value ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function resolveCustomerContext(client, reparacion, propuestaAlquilerId) {
  const albaranRes = await client.query(
    `
    SELECT
      a.id_albaran,
      a.propuesta_alquiler_id,
      a.service_context_type,
      a.service_context_id,
      a.cliente,
      a.email_cliente,
      a.telefono,
      a.direccion,
      a.cp,
      a.poblacion
    FROM albaran a
    WHERE a.id_albaran = $1
    `,
    [reparacion.id_albaran]
  );

  const albaran = albaranRes.rows[0] ?? null;

  if (!albaran) {
    throw createHttpError(404, "Albarán no encontrado");
  }

  if (propuestaAlquilerId) {
    const propuestaRes = await client.query(
      `
      SELECT
        p.id,
        p.id_maquina,
        p.cliente,
        p.email_cliente,
        p.telefono,
        p.direccion,
        p.cp,
        p.poblacion,
        p.fecha_inicio,
        p.fecha_fin
      FROM propuesta_alquiler p
      WHERE p.id = $1
      FOR UPDATE
      `,
      [propuestaAlquilerId]
    );

    if (propuestaRes.rowCount === 0) {
      throw createHttpError(404, "Propuesta de alquiler no encontrada");
    }

    const propuesta = propuestaRes.rows[0];

    if (Number(reparacion.id_maquina) !== Number(propuesta.id_maquina)) {
      throw createHttpError(
        409,
        "La reparación y la propuesta de alquiler no pertenecen a la misma máquina"
      );
    }

    return {
      propuesta,
      albaran,
      serviceContextType: SERVICE_CONTEXT_TYPES.ALQUILER,
      serviceContextId: propuesta.id,
    };
  }

  return {
    propuesta: {
      id: null,
      cliente: albaran.cliente,
      email_cliente: albaran.email_cliente,
      telefono: albaran.telefono,
      direccion: albaran.direccion,
      cp: albaran.cp,
      poblacion: albaran.poblacion,
      id_maquina: reparacion.id_maquina,
      fecha_inicio: null,
      fecha_fin: null,
    },
    albaran,
    serviceContextType: albaran.service_context_type,
    serviceContextId: albaran.service_context_id,
  };
}


export async function findRepairBudgetCreationContext(reparacionId) {
  const result = await pool.query(
    `
    SELECT
      r.id_reparacion,
      r.id_maquina,
      r.id_albaran,
      r.estado,
      r.fault_cause,
      r.service_context_type,
      r.service_context_id,
      a.propuesta_alquiler_id AS albaran_propuesta_alquiler_id,
      a.estado AS albaran_estado,
      m.ownership_type,
      m.service_contract_id AS machine_service_contract_id,
      repair_contract.contract_type AS repair_contract_type,
      machine_contract.contract_type AS machine_contract_type
    FROM public.reparacion r
    JOIN public.albaran a
      ON a.id_albaran = r.id_albaran
    JOIN public.maquina m
      ON m.id_maquina = r.id_maquina
    LEFT JOIN public.service_contract repair_contract
      ON repair_contract.id = r.service_context_id
     AND r.service_context_type = 'CONTRATO_MANTENIMIENTO'
    LEFT JOIN public.service_contract machine_contract
      ON machine_contract.id = m.service_contract_id
    WHERE r.id_reparacion = $1
    LIMIT 1;
    `,
    [reparacionId]
  );

  return result.rows[0] ?? null;
}

export async function crearPresupuestoReparacionTx(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reparacionRes = await client.query(
      `
      SELECT
        r.id_reparacion,
        r.id_maquina,
        r.estado,
        r.id_albaran,
        r.service_context_type,
        r.service_context_id,
        a.estado AS estado_albaran
      FROM reparacion r
      JOIN albaran a ON a.id_albaran = r.id_albaran
      WHERE r.id_reparacion = $1
      FOR UPDATE;
      `,
      [data.reparacion_id]
    );

    if (reparacionRes.rowCount === 0) {
      throw createHttpError(404, "Reparación no encontrada");
    }

    const reparacion = reparacionRes.rows[0];

    if (reparacion.estado_albaran !== "FIRMADO") {
      throw createHttpError(
        409,
        "No se puede crear un presupuesto: el albarán correspondiente aún no está firmado"
      );
    }

    const context = await resolveCustomerContext(
      client,
      reparacion,
      data.propuesta_alquiler_id ?? null
    );

    if (data.payer_type === "CLIENTE" && !isValidEmail(context.propuesta.email_cliente)) {
      throw createHttpError(
        409,
        "El contexto de cliente no tiene un email válido"
      );
    }

    const presupuestoExistenteRes = await client.query(
      `
      SELECT 1
      FROM presupuesto_reparacion
      WHERE reparacion_id = $1
      LIMIT 1;
      `,
      [data.reparacion_id]
    );

    if (presupuestoExistenteRes.rowCount > 0) {
      throw createHttpError(
        409,
        "Ya existe un presupuesto de reparación para esta reparación"
      );
    }

    const insertRes = await client.query(
      `
      INSERT INTO presupuesto_reparacion (
        reparacion_id,
        propuesta_alquiler_id,
        albaran_origen_id,
        estado,
        payer_type,
        charge_reason,
        coverage_decision,
        coverage_reason,
        public_token,
        importe_total,
        base_imponible,
        iva_rate,
        iva_amount,
        condiciones,
        expira_at,
        resolved_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
      `,
      [
        data.reparacion_id,
        data.propuesta_alquiler_id ?? null,
        reparacion.id_albaran,
        data.estado,
        data.payer_type,
        data.charge_reason,
        data.coverage_decision,
        data.coverage_reason,
        data.public_token,
        data.importe_total,
        data.base_imponible,
        data.iva_rate,
        data.iva_amount,
        data.condiciones,
        data.expira_at,
        data.estado === "ACEPTADA" ? new Date().toISOString() : null,
      ]
    );

    const presupuesto = insertRes.rows[0];
    const lines = Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : [
          {
            referencia: null,
            descripcion: data.condiciones ?? "Reparaci?n seg?n presupuesto",
            unidades: 1,
            precio_unitario: data.base_imponible ?? data.importe_total ?? 0,
            line_total: data.base_imponible ?? data.importe_total ?? 0,
          },
        ];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      await client.query(
        `
        INSERT INTO public.presupuesto_reparacion_line (
          presupuesto_reparacion_id,
          line_order,
          referencia,
          descripcion,
          unidades,
          precio_unitario,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7);
        `,
        [
          presupuesto.id,
          index + 1,
          line.referencia ?? null,
          line.descripcion,
          line.unidades,
          line.precio_unitario,
          line.line_total,
        ]
      );
    }

    await client.query(
      `
      UPDATE reparacion
      SET estado = $2
      WHERE id_reparacion = $1;
      `,
      [data.reparacion_id, data.reparacion_estado]
    );

    await client.query("COMMIT");

    return {
      presupuesto,
      propuesta: context.propuesta,
      reparacion,
      serviceContextType: context.serviceContextType,
      serviceContextId: context.serviceContextId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findPresupuestoReparacionById(id) {
  const result = await pool.query(
    `
    SELECT
      pr.*,
      COALESCE(p.cliente, a.cliente) AS cliente,
      COALESCE(p.email_cliente, a.email_cliente) AS email_cliente,
      COALESCE(p.telefono, a.telefono) AS telefono,
      COALESCE(p.direccion, a.direccion) AS direccion,
      COALESCE(p.cp, a.cp) AS cp,
      COALESCE(p.poblacion, a.poblacion) AS poblacion,
      r.id_maquina,
      r.service_context_type,
      r.service_context_id,
      r.estado AS reparacion_estado,
      m.tipo AS maquina_tipo,
      m.marca AS maquina_marca,
      m.modelo AS maquina_modelo,
      m.ns AS maquina_ns
    FROM presupuesto_reparacion pr
    JOIN reparacion r
      ON r.id_reparacion = pr.reparacion_id
    JOIN albaran a
      ON a.id_albaran = r.id_albaran
    JOIN maquina m
      ON m.id_maquina = r.id_maquina
    LEFT JOIN propuesta_alquiler p
      ON p.id = pr.propuesta_alquiler_id
    WHERE pr.id = $1
    LIMIT 1;
    `,
    [id]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, "Presupuesto de reparación no encontrado");
  }

  const presupuesto = result.rows[0];
  presupuesto.items = await findPresupuestoLines(id);
  return presupuesto;
}

export async function findPresupuestoLines(idPresupuesto) {
  const result = await pool.query(
    `
    SELECT
      id,
      presupuesto_reparacion_id,
      line_order,
      referencia,
      descripcion,
      unidades,
      precio_unitario,
      line_total
    FROM public.presupuesto_reparacion_line
    WHERE presupuesto_reparacion_id = $1
    ORDER BY line_order ASC, id ASC
    `,
    [idPresupuesto]
  );

  return result.rows;
}

export async function findPresupuestoReparacionFullById(id) {
  return findPresupuestoReparacionById(id);
}

export async function findByPublicTokenHash(publicTokenHash) {
  const result = await pool.query(
    `
    SELECT
      pr.*,
      COALESCE(p.cliente, a.cliente) AS cliente,
      COALESCE(p.email_cliente, a.email_cliente) AS email_cliente,
      COALESCE(p.telefono, a.telefono) AS telefono,
      COALESCE(p.direccion, a.direccion) AS direccion,
      COALESCE(p.cp, a.cp) AS cp,
      COALESCE(p.poblacion, a.poblacion) AS poblacion,
      r.id_maquina,
      r.service_context_type,
      r.service_context_id,
      m.tipo AS maquina_tipo,
      m.marca AS maquina_marca,
      m.modelo AS maquina_modelo,
      m.motor AS maquina_motor,
      m.tipo_maquina AS maquina_tipo_maquina,
      m.logistics_status AS maquina_logistics_status,
      m.maintenance_status AS maquina_maintenance_status,
      r.estado AS reparacion_estado
    FROM presupuesto_reparacion pr
    JOIN reparacion r
      ON r.id_reparacion = pr.reparacion_id
    JOIN albaran a
      ON a.id_albaran = r.id_albaran
    JOIN maquina m
      ON m.id_maquina = r.id_maquina
    LEFT JOIN propuesta_alquiler p
      ON p.id = pr.propuesta_alquiler_id
    WHERE pr.public_token = $1
      AND pr.payer_type = 'CLIENTE'
    LIMIT 1;
    `,
    [publicTokenHash]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const presupuesto = result.rows[0];
  presupuesto.items = await findPresupuestoLines(presupuesto.id);
  return presupuesto;
}

export async function acceptPresupuestoAtomic(publicTokenHash, signature = null) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const presupuestoRes = await client.query(
      `
      SELECT *
      FROM presupuesto_reparacion
      WHERE public_token = $1
      LIMIT 1
      FOR UPDATE;
      `,
      [publicTokenHash]
    );

    if (presupuestoRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { type: "NOT_FOUND" };
    }

    const presupuesto = presupuestoRes.rows[0];
    const isExpired =
      presupuesto.expira_at !== null &&
      new Date(presupuesto.expira_at).getTime() <= Date.now();

    if (isExpired) {
      await client.query(
        `
        UPDATE presupuesto_reparacion
        SET
          estado = 'EXPIRADA',
          resolved_at = NOW()
        WHERE id = $1;
        `,
        [presupuesto.id]
      );

      await client.query(
        `
        UPDATE reparacion
        SET estado = 'PRESUPUESTO_EXPIRADO'
        WHERE id_reparacion = $1;
        `,
        [presupuesto.reparacion_id]
      );

      await client.query("COMMIT");
      return { type: "EXPIRED" };
    }

    if (presupuesto.estado !== "PENDING") {
      await client.query("ROLLBACK");
      return { type: "NOT_PENDING" };
    }

    if (!presupuesto.firmado_tecnico_at) {
      await client.query("ROLLBACK");
      return { type: "NOT_ISSUED" };
    }

    await client.query(
      `
      UPDATE presupuesto_reparacion
      SET
        estado = 'ACEPTADA',
        resolved_at = NOW(),
        firma_cliente = $2,
        firma_cliente_mime = $3,
        firmado_cliente_nombre = $4,
        firmado_cliente_at = NOW(),
        firma_cliente_ip = $5
      WHERE id = $1;
      `,
      [
        presupuesto.id,
        signature?.buffer ?? null,
        signature?.mimeType ?? null,
        signature?.signerName ?? null,
        signature?.ipAddress ?? null,
      ]
    );

    await client.query(
      `
      UPDATE reparacion
      SET estado = 'PRESUPUESTO_ACEPTADO'
      WHERE id_reparacion = $1;
      `,
      [presupuesto.reparacion_id]
    );

    await client.query("COMMIT");
    return { type: "OK", id: presupuesto.id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function signPresupuestoTecarralTx(id, signature) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const presupuestoRes = await client.query(
      `
      SELECT *
      FROM public.presupuesto_reparacion
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (presupuestoRes.rowCount === 0) {
      throw createHttpError(404, "Presupuesto de reparación no encontrado");
    }

    const presupuesto = presupuestoRes.rows[0];

    if (presupuesto.payer_type !== "CLIENTE") {
      throw createHttpError(409, "Solo se emiten presupuestos firmables cuando el coste corresponde al cliente");
    }

    if (presupuesto.estado !== "PENDING") {
      throw createHttpError(409, "Solo se puede firmar por Tecarral un presupuesto pendiente");
    }

    if (presupuesto.firmado_tecnico_at) {
      throw createHttpError(409, "Este presupuesto ya está firmado por Tecarral");
    }

    await client.query(
      `
      UPDATE public.presupuesto_reparacion
      SET
        firma_tecnico = $2,
        firma_tecnico_mime = $3,
        firmado_tecnico_nombre = $4,
        firmado_tecnico_at = NOW(),
        firmado_tecnico_user_id = $5,
        issued_at = NOW()
      WHERE id = $1
      `,
      [
        id,
        signature.buffer,
        signature.mimeType,
        signature.signerName,
        signature.userId ?? null,
      ]
    );

    await client.query("COMMIT");
    return findPresupuestoReparacionById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectPresupuestoAtomic(publicTokenHash) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const presupuestoRes = await client.query(
      `
      SELECT *
      FROM presupuesto_reparacion
      WHERE public_token = $1
      LIMIT 1
      FOR UPDATE;
      `,
      [publicTokenHash]
    );

    if (presupuestoRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { type: "NOT_FOUND" };
    }

    const presupuesto = presupuestoRes.rows[0];
    const isExpired =
      presupuesto.expira_at !== null &&
      new Date(presupuesto.expira_at).getTime() <= Date.now();

    if (isExpired) {
      await client.query(
        `
        UPDATE presupuesto_reparacion
        SET
          estado = 'EXPIRADA',
          resolved_at = NOW()
        WHERE id = $1;
        `,
        [presupuesto.id]
      );

      await client.query(
        `
        UPDATE reparacion
        SET estado = 'PRESUPUESTO_EXPIRADO'
        WHERE id_reparacion = $1;
        `,
        [presupuesto.reparacion_id]
      );

      await client.query("COMMIT");
      return { type: "EXPIRED" };
    }

    if (presupuesto.estado !== "PENDING") {
      await client.query("ROLLBACK");
      return { type: "NOT_PENDING" };
    }

    await client.query(
      `
      UPDATE presupuesto_reparacion
      SET
        estado = 'RECHAZADA',
        resolved_at = NOW()
      WHERE id = $1;
      `,
      [presupuesto.id]
    );

    await client.query(
      `
      UPDATE reparacion
      SET estado = 'PRESUPUESTO_RECHAZADO'
      WHERE id_reparacion = $1;
      `,
      [presupuesto.reparacion_id]
    );

    await client.query("COMMIT");
    return { type: "OK" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function expirePendingPresupuestosByDate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `
      SELECT id, reparacion_id
      FROM presupuesto_reparacion
      WHERE estado = 'PENDING'
        AND expira_at < NOW()
      FOR UPDATE
      `
    );

    const rows = res.rows;

    if (rows.length === 0) {
      await client.query("COMMIT");
      return 0;
    }

    const ids = rows.map((r) => r.id);
    const reparacionIds = rows.map((r) => r.reparacion_id);

    await client.query(
      `
      UPDATE presupuesto_reparacion
      SET estado = 'EXPIRADA',
          resolved_at = NOW()
      WHERE id = ANY($1::bigint[])
      `,
      [ids]
    );

    await client.query(
      `
      UPDATE reparacion
      SET estado = 'PRESUPUESTO_EXPIRADO'
      WHERE id_reparacion = ANY($1::bigint[])
      `,
      [reparacionIds]
    );

    await client.query("COMMIT");
    return rows.length;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}


export async function listPresupuestosReparacion({
  pendingClientSignatureOnly = false,
} = {}) {
  const conditions = [];

  if (pendingClientSignatureOnly) {
    conditions.push(`pr.payer_type = 'CLIENTE'`);
    conditions.push(`pr.estado = 'PENDING'`);
    conditions.push(`pr.firmado_tecnico_at IS NOT NULL`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT
      pr.*,
      COALESCE(p.cliente, a.cliente) AS cliente,
      COALESCE(p.email_cliente, a.email_cliente) AS email_cliente,
      COALESCE(p.telefono, a.telefono) AS telefono,
      COALESCE(p.direccion, a.direccion) AS direccion,
      COALESCE(p.cp, a.cp) AS cp,
      COALESCE(p.poblacion, a.poblacion) AS poblacion,
      r.id_maquina,
      r.service_context_type,
      r.service_context_id,
      r.estado AS reparacion_estado,
      m.marca AS maquina_marca,
      m.modelo AS maquina_modelo,
      m.ns AS maquina_ns
    FROM presupuesto_reparacion pr
    JOIN reparacion r
      ON r.id_reparacion = pr.reparacion_id
    JOIN albaran a
      ON a.id_albaran = r.id_albaran
    JOIN maquina m
      ON m.id_maquina = r.id_maquina
    LEFT JOIN propuesta_alquiler p
      ON p.id = pr.propuesta_alquiler_id
    ${where}
    ORDER BY pr.created_at DESC, pr.id DESC
    `
  );

  return result.rows;
}


export async function updatePresupuestoFormalData(id, patch) {
  const setClauses = [];
  const values = [];

  for (const [key, value] of Object.entries(patch)) {
    values.push(value);
    setClauses.push(`${key} = $${values.length}`);
  }

  if (setClauses.length === 0) {
    return findPresupuestoReparacionById(id);
  }

  values.push(id);

  const result = await pool.query(
    `
    UPDATE public.presupuesto_reparacion
    SET ${setClauses.join(', ')},
        updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING *
    `,
    values
  );

  return result.rows[0] ?? null;
}
