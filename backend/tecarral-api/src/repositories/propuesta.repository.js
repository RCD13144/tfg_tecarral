import pool from "../config/db.js";

async function marcarMaquinaSolicitadaSiProcede(client, idMaquina) {
  const acceptedQuery = `
    SELECT 1
    FROM propuesta_alquiler
    WHERE id_maquina = $1 AND estado = 'ACEPTADA'
    LIMIT 1;
  `;
  const acceptedRes = await client.query(acceptedQuery, [idMaquina]);

  if (acceptedRes.rowCount === 0) {
    const updateQuery = `
      UPDATE maquina
      SET availability_status = 'SOLICITADA'
      WHERE id_maquina = $1;
    `;
    await client.query(updateQuery, [idMaquina]);
  }
}

export async function crearPropuestaTx(body) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO propuesta_alquiler(
        id_maquina,
        cliente, email_cliente, telefono,
        direccion, cp, poblacion,
        precio,
        fecha_inicio, fecha_fin,
        estado,
        token_hash,
        expires_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING',$11,$12)
      RETURNING *;
    `;

    const values = [
      body.id_maquina,
      body.cliente,
      body.email_cliente,
      body.telefono,
      body.direccion,
      body.cp,
      body.poblacion,
      body.precio,
      body.fecha_inicio,
      body.fecha_fin,
      body.token_hash,
      body.expires_at,
    ];

    const result = await client.query(insertQuery, values);
    const propuesta = result.rows[0];

    await marcarMaquinaSolicitadaSiProcede(client, body.id_maquina);

    await client.query("COMMIT");
    return propuesta;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function findById(id) {
  const q = `
    SELECT *
    FROM propuesta_alquiler
    WHERE id = $1
    LIMIT 1;
  `;
  const r = await pool.query(q, [id]);
  return r.rows[0] ?? null;
}

export async function updatePropuestaPendingById(id, patch) {
  const keys = Object.keys(patch);

  if (keys.length === 0) {
    return findById(id);
  }

  const setClauses = [];
  const values = [];
  let idx = 1;

  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    setClauses.push(`${k} = $${idx}`);
    values.push(patch[k]);
    idx += 1;
  }

  values.push(id);
  values.push("PENDING");

  const q = `
    UPDATE propuesta_alquiler
    SET ${setClauses.join(", ")}
    WHERE id = $${idx} AND estado = $${idx + 1}
    RETURNING *;
  `;

  const r = await pool.query(q, values);

  if (r.rowCount === 0) {
    const err = new Error("No se pudo editar: la propuesta ya no está en PENDING");
    err.statusCode = 409;
    throw err;
  }

  return r.rows[0];
}

export async function deletePropuestaById(id){
  const query = `
        DELETE FROM propuesta_alquiler
        WHERE id = $1
        RETURNING id;
    `;

    const values = [id];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
        return false;
    }

    return true;
}
