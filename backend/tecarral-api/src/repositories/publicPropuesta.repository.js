import pool from "../config/db.js";

export async function findByTokenHash(tokenHash) {
  const query = `
    SELECT
      p.*,
      m.tipo AS maquina_tipo,
      m.marca AS maquina_marca,
      m.modelo AS maquina_modelo,
      m.motor AS maquina_motor,
      m.tipo_maquina AS maquina_tipo_maquina,
      m.logistics_status AS maquina_logistics_status,
      m.maintenance_status AS maquina_maintenance_status
    FROM propuesta_alquiler p
    JOIN maquina m ON m.id_maquina = p.id_maquina
    WHERE p.token_hash = $1
    LIMIT 1;
  `;

  const result = await pool.query(query, [tokenHash]);
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function isUnavailableForThisProposal(propuesta) {
  const q = `
    SELECT 1
    FROM propuesta_alquiler
    WHERE id_maquina = $1
      AND estado = 'ACEPTADA'
      AND id <> $2
    LIMIT 1;
  `;
  const r = await pool.query(q, [propuesta.id_maquina, propuesta.id]);
  return r.rowCount > 0;
}

export async function acceptAtomic(tokenHash) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pRes = await client.query(
      `
      SELECT *
      FROM propuesta_alquiler
      WHERE token_hash = $1
      LIMIT 1
      FOR UPDATE;
      `,
      [tokenHash]
    );

    if (pRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { type: "NOT_FOUND" };
    }

    const propuesta = pRes.rows[0];

    const expired = new Date(propuesta.expires_at).getTime() <= Date.now();
    if (expired) {
      await client.query("ROLLBACK");
      return { type: "EXPIRED" };
    }

    if (propuesta.estado !== "PENDING") {
      await client.query("ROLLBACK");
      return { type: "NOT_PENDING" };
    }

    await client.query(
      `
      SELECT id_maquina
      FROM maquina
      WHERE id_maquina = $1
      FOR UPDATE;
      `,
      [propuesta.id_maquina]
    );

    const acceptedRes = await client.query(
      `
      SELECT 1
      FROM propuesta_alquiler
      WHERE id_maquina = $1
        AND estado = 'ACEPTADA'
      LIMIT 1;
      `,
      [propuesta.id_maquina]
    );

    if (acceptedRes.rowCount > 0) {
      await client.query("ROLLBACK");
      return { type: "UNAVAILABLE" };
    }

    await client.query(
      `
      UPDATE propuesta_alquiler
      SET estado = 'ACEPTADA'
      WHERE id = $1;
      `,
      [propuesta.id]
    );

    await client.query(
      `
      UPDATE propuesta_alquiler
      SET estado = 'EXPIRADA'
      WHERE id_maquina = $1
        AND estado = 'PENDING'
        AND id <> $2;
      `,
      [propuesta.id_maquina, propuesta.id]
    );

    await client.query(
      `
      UPDATE maquina
      SET
        availability_status = 'ALQUILADA',
        logistics_status = 'EN_CAMINO',
        ubicacion_tipo = 'TRANSITO',
        transit_reason = NULL
      WHERE id_maquina = $1;
      `,
      [propuesta.id_maquina]
    );

    await client.query("COMMIT");
    return { type: "OK" };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}


export async function rejectAtomic(tokenHash) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pRes = await client.query(
      `
      SELECT *
      FROM propuesta_alquiler
      WHERE token_hash = $1
      LIMIT 1
      FOR UPDATE;
      `,
      [tokenHash]
    );

    if (pRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { type: "NOT_FOUND" };
    }

    const propuesta = pRes.rows[0];

    const expired = new Date(propuesta.expires_at).getTime() <= Date.now();
    if (expired) {
      await client.query("ROLLBACK");
      return { type: "EXPIRED" };
    }

    if (propuesta.estado !== "PENDING") {
      await client.query("ROLLBACK");
      return { type: "NOT_PENDING" };
    }

    await client.query(
      `
      SELECT id_maquina
      FROM maquina
      WHERE id_maquina = $1
      FOR UPDATE;
      `,
      [propuesta.id_maquina]
    );

    const acceptedRes = await client.query(
      `
      SELECT 1
      FROM propuesta_alquiler
      WHERE id_maquina = $1
        AND estado = 'ACEPTADA'
      LIMIT 1;
      `,
      [propuesta.id_maquina]
    );

    if (acceptedRes.rowCount > 0) {
      await client.query("ROLLBACK");
      return { type: "UNAVAILABLE" };
    }

    await client.query(
      `
      UPDATE propuesta_alquiler
      SET estado = 'RECHAZADA'
      WHERE id = $1;
      `,
      [propuesta.id]
    );

    const pendingRes = await client.query(
      `
      SELECT 1
      FROM propuesta_alquiler
      WHERE id_maquina = $1
        AND estado = 'PENDING'
        AND expires_at > now()
      LIMIT 1;
      `,
      [propuesta.id_maquina]
    );

    const nextStatus = pendingRes.rowCount > 0 ? "SOLICITADA" : "DISPONIBLE";

    await client.query(
      `
      UPDATE maquina
      SET
      availability_status = $2,
      logistics_status = NULL,
      transit_reason = NULL
      WHERE id_maquina = $1;
      `,
      [propuesta.id_maquina, nextStatus]
    );



    await client.query("COMMIT");
    return { type: "OK" };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
