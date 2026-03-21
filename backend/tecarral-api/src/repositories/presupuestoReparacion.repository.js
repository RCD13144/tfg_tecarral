import pool from "../config/db.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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
      FOR UPDATE;
      `,
      [data.propuesta_alquiler_id]
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
        estado,
        public_token,
        importe_total,
        condiciones,
        expira_at
      )
      VALUES ($1, $2, 'PENDING', $3, $4, $5, $6)
      RETURNING *;
      `,
      [
        data.reparacion_id,
        data.propuesta_alquiler_id,
        data.public_token,
        data.importe_total,
        data.condiciones,
        data.expira_at,
      ]
    );

    await client.query(
      `
      UPDATE reparacion
      SET estado = 'PENDIENTE_ACEPTACION'
      WHERE id_reparacion = $1;
      `,
      [data.reparacion_id]
    );

    await client.query("COMMIT");

    return {
      presupuesto: insertRes.rows[0],
      propuesta,
      reparacion,
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
      p.cliente,
      p.email_cliente,
      p.telefono,
      p.direccion,
      p.cp,
      p.poblacion,
      p.id_maquina,
      r.estado AS reparacion_estado
    FROM presupuesto_reparacion pr
    JOIN propuesta_alquiler p
      ON p.id = pr.propuesta_alquiler_id
    JOIN reparacion r
      ON r.id_reparacion = pr.reparacion_id
    WHERE pr.id = $1
    LIMIT 1;
    `,
    [id]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, "Presupuesto de reparación no encontrado");
  }

  return result.rows[0];
}

export async function findByPublicTokenHash(publicTokenHash) {
  const result = await pool.query(
    `
    SELECT
      pr.*,
      p.cliente,
      p.email_cliente,
      p.telefono,
      p.direccion,
      p.cp,
      p.poblacion,
      p.id_maquina,
      p.fecha_inicio,
      p.fecha_fin,
      m.tipo AS maquina_tipo,
      m.marca AS maquina_marca,
      m.modelo AS maquina_modelo,
      m.motor AS maquina_motor,
      m.tipo_maquina AS maquina_tipo_maquina,
      m.logistics_status AS maquina_logistics_status,
      m.maintenance_status AS maquina_maintenance_status,
      r.estado AS reparacion_estado
    FROM presupuesto_reparacion pr
    JOIN propuesta_alquiler p
      ON p.id = pr.propuesta_alquiler_id
    JOIN reparacion r
      ON r.id_reparacion = pr.reparacion_id
    JOIN maquina m
      ON m.id_maquina = p.id_maquina
    WHERE pr.public_token = $1
    LIMIT 1;
    `,
    [publicTokenHash]
  );

  return result.rowCount === 0 ? null : result.rows[0];
}

export async function acceptPresupuestoAtomic(publicTokenHash) {
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
        estado = 'ACEPTADA',
        resolved_at = NOW()
      WHERE id = $1;
      `,
      [presupuesto.id]
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
    return { type: "OK" };
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