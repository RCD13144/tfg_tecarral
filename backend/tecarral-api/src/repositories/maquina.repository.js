import pool from "../config/db.js";
import { UBICACION_TEXT } from "../constants/ubicaciones.js";

function addStringFilter(field, value, values, conditions, upper = false) {
    values.push(value);

    const fn = upper ? "UPPER" : "LOWER";

    conditions.push(
        `${fn}(unaccent(TRIM(${field}))) = ${fn}(unaccent(TRIM($${values.length})))`
    );
}


function splitTokens(q) {
    const raw = String(q).trim().toLowerCase();
    return raw.split(/\s+/).filter(p => p.length > 0);
}


function buildBase({ tipoMaquina, subtipo, availability, ubicacion, marca, ubicacion_type, motor }) {
    const conditions = [];
    const values = [];

    if (tipoMaquina !== undefined)
        addStringFilter("m.tipo_maquina", tipoMaquina, values, conditions);

    if (subtipo !== undefined)
        addStringFilter("m.tipo", subtipo, values, conditions);

    if (availability !== undefined)
        addStringFilter("m.availability_status", availability, values, conditions, true);

    if (ubicacion !== undefined)
        addStringFilter("m.ubicacion", ubicacion, values, conditions);

    if (marca !== undefined)
        addStringFilter("m.marca", marca, values, conditions);

    if (ubicacion_type !== undefined)
        addStringFilter("m.ubicacion_tipo", ubicacion_type, values, conditions);

    if (motor !== undefined)
        addStringFilter("m.motor", motor, values, conditions);

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return { where, values };
}

export async function getAllMaquinaria() {
    const result = await pool.query(
        "SELECT * FROM maquina ORDER BY id_maquina ASC"
    );
    return result.rows;
}

export async function getMaquinariaByIdFromDB(id) {
    const result = await pool.query(
        "SELECT * FROM maquina WHERE id_maquina = $1",
        [id]
    );
    return result.rows[0] ?? null;
}

const COMBINED_VECTOR = "(m.search_vector || COALESCE(me.search_vector, ''::tsvector))";
const COMBINED_TEXT = "(m.search_text || ' ' || COALESCE(me.search_text, ''))";

const SELECT_JOINED = `
  SELECT
    m.*,
    me.ruedas          AS elev_ruedas,
    me.cap_carga       AS elev_cap_carga,
    me.replegado_mm    AS elev_replegado_mm,
    me.elevacion_libre AS elev_elevacion_libre,
    me.elevacion       AS elev_elevacion,
    me.desplazamiento  AS elev_desplazamiento,
    me.posicion        AS elev_posicion,
    me.antihuella      AS elev_antihuella,
    me.matricula       AS elev_matricula,
    me.largo           AS elev_largo,
    me.alto            AS elev_alto,
    me.ancho           AS elev_ancho,
    me.peso_kg         AS elev_peso_kg,
    me.horquillas      AS elev_horquillas
  FROM maquina m
  LEFT JOIN maquina_elevacion me
    ON me.id_maquina = m.id_maquina
`;

export async function findMaquinaria(filters) {
  const { q } = filters;
  const base = buildBase(filters);
  if (q === undefined) {
    const query = `
      ${SELECT_JOINED}
      ${base.where}
      ORDER BY m.id_maquina ASC
    `;
    const result = await pool.query(query, base.values);
    return result.rows;
  }

  {
    const values = [...base.values, q];
    const idx = values.length;

    const where = base.where.length > 0
      ? `${base.where} AND ${COMBINED_VECTOR} @@ websearch_to_tsquery('spanish', $${idx})`
      : `WHERE ${COMBINED_VECTOR} @@ websearch_to_tsquery('spanish', $${idx})`;

    const query = `
      ${SELECT_JOINED}
      ${where}
      ORDER BY ts_rank_cd(${COMBINED_VECTOR}, websearch_to_tsquery('spanish', $${idx})) DESC
    `;

    const result = await pool.query(query, values);
    if (result.rows.length > 0) return result.rows;
  }

  {
    const values = [...base.values, q];
    const idx = values.length;

    const where = base.where.length > 0
      ? `${base.where} AND ${COMBINED_VECTOR} @@ plainto_tsquery('spanish', $${idx})`
      : `WHERE ${COMBINED_VECTOR} @@ plainto_tsquery('spanish', $${idx})`;

    const query = `
      ${SELECT_JOINED}
      ${where}
      ORDER BY ts_rank_cd(${COMBINED_VECTOR}, plainto_tsquery('spanish', $${idx})) DESC
    `;

    const result = await pool.query(query, values);
    if (result.rows.length > 0) return result.rows;
  }

  {
    const tokens = splitTokens(q).filter((t) => t.length >= 3);
    const fallbackTokens = tokens.length > 0 ? tokens : [String(q).trim().toLowerCase()];

    const values = [...base.values];
    const tokenConditions = [];

    for (const token of fallbackTokens) {
      values.push(token);
      const idx = values.length;
      tokenConditions.push(`word_similarity($${idx}, ${COMBINED_TEXT}) > 0.35`);
    }

    const whereTokens = `(${tokenConditions.join(" OR ")})`;

    const where = base.where.length > 0
      ? `${base.where} AND ${whereTokens}`
      : `WHERE ${whereTokens}`;

    const simExpr = fallbackTokens
      .map((_, i) => {
        const idx = base.values.length + (i + 1);
        return `word_similarity($${idx}, ${COMBINED_TEXT})`;
      })
      .join(", ");

    const query = `
      ${SELECT_JOINED}
      ${where}
      ORDER BY GREATEST(${simExpr}) DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export async function suggestModelo(text) {
    const query = `
        SELECT modelo
        FROM (
            SELECT
                modelo,
                similarity(unaccent(modelo), unaccent($1)) AS score
            FROM maquina
            WHERE modelo IS NOT NULL
              AND word_similarity(unaccent($1), unaccent(modelo)) > 0.35
            GROUP BY modelo
        ) t
        ORDER BY t.score DESC
        LIMIT 8
    `;

    const result = await pool.query(query, [text]);
    return result.rows.map(r => r.modelo);
}


export async function suggestMarca(text) {
    const query = `
        SELECT marca
        FROM (
            SELECT
                marca,
                similarity(unaccent(marca), unaccent($1)) AS score
            FROM maquina
            WHERE marca IS NOT NULL
              AND word_similarity(unaccent($1), unaccent(marca)) > 0.35
            GROUP BY marca
        ) t
        ORDER BY t.score DESC
        LIMIT 8
    `;

    const result = await pool.query(query, [text]);
    return result.rows.map(r => r.marca);
}

export async function suggestSubtipo(text) {
    const query = `
        SELECT tipo
        FROM (
            SELECT
                tipo,
                similarity(unaccent(tipo), unaccent($1)) AS score
            FROM maquina
            WHERE tipo IS NOT NULL
              AND word_similarity(unaccent($1), unaccent(tipo)) > 0.35
            GROUP BY tipo
        ) t
        ORDER BY t.score DESC
        LIMIT 8
    `;

    const result = await pool.query(query, [text]);
    return result.rows.map(r => r.tipo);
}

export async function suggestNS(text) {
    const query = `
        SELECT ns
        FROM (
            SELECT
                ns,
                similarity(unaccent(ns), unaccent($1)) AS score
            FROM maquina
            WHERE ns IS NOT NULL
              AND word_similarity(unaccent($1), unaccent(ns)) > 0.35
            GROUP BY ns
        ) t
        ORDER BY t.score DESC
        LIMIT 8
    `;

    const result = await pool.query(query, [text]);
    return result.rows.map(r => r.ns);
}

export async function suggestMotor(text) {
    const query = `
        SELECT motor
        FROM (
            SELECT
                motor,
                similarity(unaccent(motor), unaccent($1)) AS score
            FROM maquina
            WHERE motor IS NOT NULL
              AND word_similarity(unaccent($1), unaccent(motor)) > 0.35
            GROUP BY motor
        ) t
        ORDER BY t.score DESC
        LIMIT 8
    `;

    const result = await pool.query(query, [text]);
    return result.rows.map(r => r.motor);
}

export async function suggestTipo(text) {
    const query = `
        SELECT tipo_maquina
        FROM (
            SELECT
                tipo_maquina,
                similarity(unaccent(tipo_maquina), unaccent($1)) AS score
            FROM maquina
            WHERE tipo_maquina IS NOT NULL
              AND word_similarity(unaccent($1), unaccent(tipo_maquina)) > 0.35
            GROUP BY tipo_maquina
        ) t
        ORDER BY t.score DESC
        LIMIT 8
    `;

    const result = await pool.query(query, [text]);
    return result.rows.map(r => r.tipo_maquina);
}

export async function crearMaquina(
    subtipo,
    marca,
    motor,
    modelo,
    ns,
    seguro,
    num_poliza,
    alquilada,
    ubicacion,
    observaciones,
    tipo,
    ubicacion_tipo
) {

    const query = `
        INSERT INTO maquina (
            marca, motor, modelo, ns, seguro, num_poliza, alquilada,
            ubicacion, observaciones, tipo, tipo_maquina, ubicacion_tipo
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *;
    `;

    const values = [
        marca,
        motor,
        modelo,
        ns,
        seguro,
        num_poliza,
        alquilada,
        ubicacion,
        observaciones,
        subtipo,
        tipo,
        ubicacion_tipo
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}

function isProvided(value) {
    return value !== undefined;
}

export async function editarMaquina(id, patch) {
    const columns = [];
    const values = [];

    function addSet(columnName, value) {
        values.push(value);
        columns.push(`${columnName} = $${values.length}`);
    }

    if (isProvided(patch.subtipo)) addSet("tipo", patch.subtipo);
    if (isProvided(patch.tipoMaquina)) addSet("tipo_maquina", patch.tipoMaquina);

    if (isProvided(patch.availability)) addSet("availability_status", patch.availability);

    if (isProvided(patch.motor)) addSet("motor", patch.motor);
    if (isProvided(patch.ubicacion_tipo)) addSet("ubicacion_tipo", patch.ubicacion_tipo);

    if (isProvided(patch.marca)) addSet("marca", patch.marca);
    if (isProvided(patch.modelo)) addSet("modelo", patch.modelo);
    if (isProvided(patch.ns)) addSet("ns", patch.ns);

    if (isProvided(patch.ubicacion)) addSet("ubicacion", patch.ubicacion);
    if (isProvided(patch.observaciones)) addSet("observaciones", patch.observaciones);

    if (isProvided(patch.seguro)) addSet("seguro", patch.seguro);

    if (isProvided(patch.num_poliza)) addSet("num_poliza", patch.num_poliza);
    if (isProvided(patch.alquilada)) addSet("alquilada", patch.alquilada);

    if (columns.length === 0) {
        const existing = await pool.query(
            "SELECT * FROM maquina WHERE id_maquina = $1",
            [id]
        );
        return existing.rows[0] ?? null;
    }

    values.push(id);
    const idIndex = values.length;

    const query = `
        UPDATE maquina
        SET ${columns.join(", ")}
        WHERE id_maquina = $${idIndex}
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0] ?? null;
}

export async function deleteMaquina(id) {
    const query = `
        DELETE FROM maquina
        WHERE id_maquina = $1
        RETURNING id_maquina;
    `;

    const values = [id];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
        return false;
    }

    return true;
}

export async function marcarEntregadaAtomic(idMaquina) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const lockRes = await client.query(
            `
      SELECT id_maquina
      FROM maquina
      WHERE id_maquina = $1
      FOR UPDATE;
      `,
            [idMaquina]
        );

        if (lockRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return { ok: false, reason: "MACHINE_NOT_FOUND" };
        }

        const pRes = await client.query(
            `
      SELECT id, direccion, poblacion
      FROM propuesta_alquiler
      WHERE id_maquina = $1
        AND estado = 'ACEPTADA'
      ORDER BY id ASC
      LIMIT 1;
      `,
            [idMaquina]
        );

        if (pRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return { ok: false, reason: "NO_ACCEPTED_PROPOSAL" };
        }

        const propuesta = pRes.rows[0];

        const ubicacionCliente = `${propuesta.direccion}, ${propuesta.poblacion}`;

        await client.query(
            `
      UPDATE maquina
      SET
        logistics_status = 'ENTREGADA',
        ubicacion_tipo = 'CLIENTE',
        ubicacion_ref_id = $2,
        ubicacion = $3
      WHERE id_maquina = $1;
      `,
            [idMaquina, propuesta.id, ubicacionCliente]
        );

        await client.query("COMMIT");
        return { ok: true };
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
}

function getUbicacionTextByTipo(ubicacionTipo) {
  const t = String(ubicacionTipo ?? "").trim().toUpperCase();

  if (t === "ALMACEN") return UBICACION_TEXT.ALMACEN;
  if (t === "TALLER") return UBICACION_TEXT.TALLER;

  return UBICACION_TEXT.DESCONOCIDA;
}


export async function marcarRecibidaEnBaseTx(idMaquina, ubicacionTipo) {
  const client = await pool.connect();
  let result = { ok: false, reason: null, data: null };

  try {
    await client.query("BEGIN");

    const lockRes = await client.query(
      `
      SELECT id_maquina, ubicacion_tipo
      FROM maquina
      WHERE id_maquina = $1
      FOR UPDATE;
      `,
      [idMaquina]
    );

    if (lockRes.rowCount === 0) {
      await client.query("ROLLBACK");
      result = { ok: false, reason: "NOT_FOUND", data: null };
    } else {
      const ubicacionActual = lockRes.rows[0].ubicacion_tipo;

      if (ubicacionActual !== "TRANSITO") {
        await client.query("ROLLBACK");
        result = { ok: false, reason: "NOT_IN_TRANSITO", data: null };
      } else {
        const endedRes = await client.query(
          `
          SELECT 1
          FROM propuesta_alquiler
          WHERE id_maquina = $1
            AND estado = 'ACEPTADA'
            AND fecha_fin < now()
          LIMIT 1;
          `,
          [idMaquina]
        );

        const alquilerTerminado = endedRes.rowCount > 0;

        if (alquilerTerminado) {
          await client.query(
            `
            UPDATE propuesta_alquiler
            SET estado = 'FINALIZADA'
            WHERE id_maquina = $1
              AND estado = 'ACEPTADA'
              AND fecha_fin < now();
            `,
            [idMaquina]
          );
        }

        const ubicacionText = getUbicacionTextByTipo(ubicacionTipo);

        const updateRes = await client.query(
          `
          UPDATE maquina
          SET
            ubicacion_tipo = $2,
            ubicacion = $3,
            ubicacion_ref_id = NULL,
            logistics_status = NULL,
            availability_status = CASE
              WHEN $4::boolean = true THEN 'DISPONIBLE'
              ELSE availability_status
            END
          WHERE id_maquina = $1
          RETURNING *;
          `,
          [idMaquina, ubicacionTipo, ubicacionText, alquilerTerminado]
        );

        await client.query("COMMIT");

        result = { ok: true, reason: null, data: updateRes.rows[0] };
      }
    }
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return result;
}


export async function marcarTransitoPorAlquilerTerminadoTx(options) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const limit = options.limit;

    const r = await client.query(
      `
      WITH ended AS (
        SELECT DISTINCT m.id_maquina
        FROM maquina m
        JOIN propuesta_alquiler p
          ON p.id_maquina = m.id_maquina
        WHERE p.estado = 'ACEPTADA'
          AND p.fecha_fin < now()
          AND m.availability_status = 'ALQUILADA'
          AND m.ubicacion_tipo <> 'TRANSITO'
        ORDER BY m.id_maquina ASC
        LIMIT $1
      ),
      updated AS (
        UPDATE maquina m
        SET
          ubicacion_tipo = 'TRANSITO',
          logistics_status = 'EN_CAMINO'
        FROM ended e
        WHERE m.id_maquina = e.id_maquina
        RETURNING m.id_maquina
      )
      SELECT
        COUNT(*)::int AS moved_count,
        ARRAY_AGG(id_maquina)::bigint[] AS machines
      FROM updated;
      `,
      [limit]
    );

    await client.query("COMMIT");

    return {
      moved_count: r.rows[0]?.moved_count ?? 0,
      machines: r.rows[0]?.machines ?? [],
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getMaquinaLabelById(idMaquina) {
    const q = `
    SELECT tipo, marca, modelo
    FROM maquina
    WHERE id_maquina = $1
    LIMIT 1;
  `;
    const r = await pool.query(q, [idMaquina]);

    if (r.rowCount === 0) return null;

    const m = r.rows[0];

    const tipo = String(m.tipo ?? "").trim();
    const marca = String(m.marca ?? "").trim();
    const modelo = String(m.modelo ?? "").trim();

    const parts = [tipo, marca, modelo].filter((x) => String(x).trim().length > 0);
    return parts.length > 0 ? parts.join(" - ") : null;
}

export async function moverEntreBasesTx(idMaquina, ubicacionTipo) {
  const client = await pool.connect();
  let result = { ok: false, reason: null, data: null };

  try {
    await client.query("BEGIN");

    const lockRes = await client.query(
      `
      SELECT id_maquina, availability_status
      FROM maquina
      WHERE id_maquina = $1
      FOR UPDATE;
      `,
      [idMaquina]
    );

    if (lockRes.rowCount === 0) {
      await client.query("ROLLBACK");
      result = { ok: false, reason: "NOT_FOUND", data: null };
    } else {
      const status = lockRes.rows[0].availability_status;

      if (status === "ALQUILADA") {
        await client.query("ROLLBACK");
        result = { ok: false, reason: "RENTED", data: null };
      } else {
        const ubicacionText = getUbicacionTextByTipo(ubicacionTipo);

        const updateRes = await client.query(
          `
          UPDATE maquina
          SET
            ubicacion_tipo = $2,
            ubicacion = $3,
            logistics_status = NULL,
            ubicacion_ref_id = NULL
          WHERE id_maquina = $1
          RETURNING *;
          `,
          [idMaquina, ubicacionTipo, ubicacionText]
        );

        await client.query("COMMIT");
        result = { ok: true, reason: null, data: updateRes.rows[0] };
      }
    }
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return result;
}
