import pool from "../config/db.js";
import { UBICACION_TEXT } from "../constants/ubicaciones.js";
import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";
import { REPARACION_ESTADOS } from "../constants/reparacionEstados.js";

function addStringFilter(field, value, values, conditions, upper = false) {
    const items = Array.isArray(value) ? value.filter((item) => item !== undefined) : [value];

    if (items.length === 0) {
        return;
    }

    const fn = upper ? "UPPER" : "LOWER";
    const comparisons = [];

    for (const item of items) {
        values.push(item);
        comparisons.push(
            `${fn}(unaccent(TRIM(${field}))) = ${fn}(unaccent(TRIM($${values.length})))`
        );
    }

    conditions.push(
        comparisons.length === 1 ? comparisons[0] : `(${comparisons.join(" OR ")})`
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

export async function getMaquinaByIdForImageUpdate(idMaquina) {
    const result = await pool.query(
        `
        SELECT id_maquina, image_path
        FROM maquina
        WHERE id_maquina = $1
        `,
        [idMaquina]
    );

    return result.rows[0] ?? null;
}

export async function updateMachineImagePath(idMaquina, imagePath) {
    const result = await pool.query(
        `
        UPDATE maquina
        SET image_path = $2
        WHERE id_maquina = $1
        RETURNING *;
        `,
        [idMaquina, imagePath]
    );

    return result.rows[0] ?? null;
}

export async function enforceTransitLogisticsConsistency(idMaquina = null) {
    const values = [];
    let machineCondition = "";

    if (Number.isInteger(idMaquina) && idMaquina > 0) {
        values.push(idMaquina);
        machineCondition = ` AND id_maquina = $${values.length}`;
    }

    await pool.query(
        `
        UPDATE maquina
        SET logistics_status = 'EN_CAMINO'
        WHERE ubicacion_tipo = 'TRANSITO'
          AND COALESCE(logistics_status, '') <> 'EN_CAMINO'
          ${machineCondition}
        `,
        values
    );
}

export async function reconcileEndedRentalsTransit(idMaquina = null) {
    const values = [];
    let proposalCondition = "";

    if (Number.isInteger(idMaquina) && idMaquina > 0) {
        values.push(idMaquina);
        proposalCondition = ` AND p.id_maquina = $${values.length}`;
    }

    await pool.query(
        `
        WITH ended AS (
          SELECT DISTINCT p.id_maquina
          FROM propuesta_alquiler p
          JOIN maquina m
            ON m.id_maquina = p.id_maquina
          WHERE p.estado = 'FINALIZADA'
            AND m.availability_status = 'ALQUILADA'
            AND NOT EXISTS (
              SELECT 1
              FROM propuesta_alquiler pa
              WHERE pa.id_maquina = p.id_maquina
                AND pa.estado = 'ACEPTADA'
            )
            AND (
              m.ubicacion_tipo <> 'TRANSITO'
              OR COALESCE(m.logistics_status, '') <> 'EN_CAMINO'
              OR COALESCE(m.transit_reason, '') <> 'ALQUILER_FINALIZADO'
            )
            ${proposalCondition}
        )
        UPDATE maquina m
        SET
          ubicacion_tipo = 'TRANSITO',
          logistics_status = 'EN_CAMINO',
          transit_reason = 'ALQUILER_FINALIZADO'
        FROM ended e
        WHERE m.id_maquina = e.id_maquina
        `,
        values
    );
}

export async function getMaquinariaByIdFromDB(id) {
    const result = await pool.query(
        `
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
        WHERE m.id_maquina = $1
        `,
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
    const trimmedQuery = String(q).trim();

    if (/^\d+$/.test(trimmedQuery)) {
      const values = [...base.values, `${trimmedQuery}%`];
      const idx = values.length;

      const where = base.where.length > 0
        ? `${base.where} AND CAST(m.id_maquina AS TEXT) ILIKE $${idx}`
        : `WHERE CAST(m.id_maquina AS TEXT) ILIKE $${idx}`;

      const query = `
        ${SELECT_JOINED}
        ${where}
        ORDER BY m.id_maquina ASC
      `;

      const result = await pool.query(query, values);
      if (result.rows.length > 0) return result.rows;
    }
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

export async function suggestIdMaquina(text) {
    const query = `
        SELECT CAST(id_maquina AS text) AS id_maquina
        FROM maquina
        WHERE CAST(id_maquina AS text) LIKE $1 || '%'
        ORDER BY id_maquina ASC
        LIMIT 8
    `;

    const result = await pool.query(query, [String(text).trim()]);
    return result.rows.map((r) => r.id_maquina);
}

export async function crearMaquina(data) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const query = `
            INSERT INTO maquina (
                marca, motor, modelo, ns, seguro, num_poliza,
                ubicacion, observaciones, tipo, tipo_maquina, ubicacion_tipo,
                availability_status, maintenance_status, logistics_status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'DISPONIBLE','OK',NULL)
            RETURNING *;
        `;

        const values = [
            data.marca,
            data.motor,
            data.modelo,
            data.ns,
            data.seguro,
            data.num_poliza,
            data.ubicacion ?? UBICACION_TEXT.TALLER,
            data.observaciones,
            data.subtipo,
            data.tipo,
            data.ubicacion_tipo ?? "TALLER"
        ];

        const insertRes = await client.query(query, values);
        const maquina = insertRes.rows[0];

        if (data.tipo === "elevacion") {
            await client.query(
                `
                INSERT INTO maquina_elevacion (
                    id_maquina,
                    ruedas,
                    cap_carga,
                    replegado_mm,
                    elevacion_libre,
                    elevacion,
                    desplazamiento,
                    posicion,
                    antihuella,
                    matricula,
                    largo,
                    alto,
                    ancho,
                    peso_kg,
                    horquillas
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                `,
                [
                    maquina.id_maquina,
                    data.elev_ruedas ?? null,
                    data.elev_cap_carga ?? null,
                    data.elev_replegado_mm ?? null,
                    data.elev_elevacion_libre ?? null,
                    data.elev_elevacion ?? null,
                    data.elev_desplazamiento ?? null,
                    data.elev_posicion ?? null,
                    data.elev_antihuella ?? null,
                    data.elev_matricula ?? null,
                    data.elev_largo ?? null,
                    data.elev_alto ?? null,
                    data.elev_ancho ?? null,
                    data.elev_peso_kg ?? null,
                    data.elev_horquillas ?? null,
                ]
            );
        }

        await client.query("COMMIT");
        return maquina;
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
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
        ubicacion = $3,
        transit_reason = NULL
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
      SELECT id_maquina, ubicacion_tipo, maintenance_status, availability_status, transit_reason
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
      const maquina = lockRes.rows[0];
      const ubicacionActual = maquina.ubicacion_tipo;

      if (ubicacionActual !== "TRANSITO") {
        await client.query("ROLLBACK");
        result = { ok: false, reason: "NOT_IN_TRANSITO", data: null };
      } else {
        const transitReason = String(maquina.transit_reason ?? '').trim().toUpperCase();
        const alquilerFinalizado = transitReason === 'ALQUILER_FINALIZADO';
        const reparacionTerminada = transitReason === 'REPARACION_TERMINADA';

        if (alquilerFinalizado) {
          const ubicacionText = getUbicacionTextByTipo(ubicacionTipo);

          const updateRes = await client.query(
            `
            UPDATE maquina
            SET
              ubicacion_tipo = $2,
              ubicacion = $3,
              ubicacion_ref_id = NULL,
              logistics_status = NULL,
              availability_status = 'DISPONIBLE',
              transit_reason = NULL
            WHERE id_maquina = $1
            RETURNING *;
            `,
            [idMaquina, ubicacionTipo, ubicacionText]
          );

          await client.query("COMMIT");
          result = { ok: true, reason: null, data: updateRes.rows[0] };
        } else if (reparacionTerminada) {
          await client.query("ROLLBACK");
          result = { ok: false, reason: "REPAIR_RETURN_REQUIRES_CLIENT_DELIVERY", data: null };
        } else {
          const averiadaGrave =
            maquina.maintenance_status === MAINTENANCE_STATUS.AVERIADA_GRAVE;

          if (!averiadaGrave) {
            await client.query("ROLLBACK");
            result = { ok: false, reason: "NOT_SEVERE_BREAKDOWN", data: null };
          } else {
            const albaranRes = await client.query(
              `
              SELECT a.estado
              FROM reparacion r
              JOIN albaran a
                ON a.id_albaran = r.id_albaran
              WHERE r.id_maquina = $1
              ORDER BY r.id_reparacion DESC
              LIMIT 1
              `,
              [idMaquina]
            );

            const estadoAlbaran = albaranRes.rows[0]?.estado ?? null;

            if (estadoAlbaran !== "FIRMADO") {
              await client.query("ROLLBACK");
              result = { ok: false, reason: "ALBARAN_NOT_SIGNED", data: null };
            } else {
              const ubicacionText = getUbicacionTextByTipo(ubicacionTipo);

              const updateRes = await client.query(
                `
                UPDATE maquina
                SET
                  ubicacion_tipo = $2,
                  ubicacion = $3,
                  ubicacion_ref_id = NULL,
                  logistics_status = NULL,
                  transit_reason = NULL
                WHERE id_maquina = $1
                RETURNING *;
                `,
                [idMaquina, ubicacionTipo, ubicacionText]
              );

              await client.query("COMMIT");
              result = { ok: true, reason: null, data: updateRes.rows[0] };
            }
          }
        }
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
        WHERE p.estado = 'FINALIZADA'
          AND m.availability_status = 'ALQUILADA'
          AND (
            m.ubicacion_tipo <> 'TRANSITO'
            OR COALESCE(m.logistics_status, '') <> 'EN_CAMINO'
            OR COALESCE(m.transit_reason, '') <> 'ALQUILER_FINALIZADO'
          )
        ORDER BY m.id_maquina ASC
        LIMIT $1
      ),
      updated AS (
        UPDATE maquina m
        SET
          ubicacion_tipo = 'TRANSITO',
          logistics_status = 'EN_CAMINO',
          transit_reason = 'ALQUILER_FINALIZADO'
        FROM ended e
        WHERE m.id_maquina = e.id_maquina
        RETURNING m.id_maquina
      )
      SELECT
        COUNT(*)::int AS moved_count,
        COALESCE(ARRAY_AGG(id_maquina), ARRAY[]::bigint[]) AS machines
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
      SELECT id_maquina, availability_status, maintenance_status, ubicacion_tipo
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
      const maquina = lockRes.rows[0];
      const status = maquina.availability_status;
      const maintenanceStatus = maquina.maintenance_status;
      const ubicacionActual = maquina.ubicacion_tipo;

      if (status === "ALQUILADA") {
        await client.query("ROLLBACK");
        result = { ok: false, reason: "RENTED", data: null };
      } else if (
        ubicacionActual === "CLIENTE" ||
        ubicacionActual === "TRANSITO" ||
        maintenanceStatus === MAINTENANCE_STATUS.AVERIADA
      ) {
        await client.query("ROLLBACK");
        result = { ok: false, reason: "MOVE_NOT_ALLOWED", data: null };
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

export async function getMaintenanceStatusById(idMaquina) {
  const { rows } = await pool.query(
    `SELECT maintenance_status FROM public.maquina WHERE id_maquina = $1`,
    [idMaquina]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].maintenance_status ?? null;
}

export async function updateMaintenanceStatus(idMaquina, maintenanceStatus) {
  await pool.query(
    `UPDATE public.maquina SET maintenance_status = $2 WHERE id_maquina = $1`,
    [idMaquina, maintenanceStatus]
  );
}

export async function abrirIncidenciaTx({
  idMaquina,
  maintenanceStatus,
  propuestaAlquilerId,
  comentario,
  idUser,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const maquinaRes = await client.query(
      `
      SELECT id_maquina, maintenance_status, marca, modelo, ns, ubicacion
      FROM public.maquina
      WHERE id_maquina = $1
      FOR UPDATE
      `,
      [idMaquina]
    );

    if (maquinaRes.rows.length === 0) {
      throw buildErr(404, "Máquina no encontrada", { idMaquina });
    }

    const maquina = maquinaRes.rows[0];

    if (maquina.maintenance_status !== MAINTENANCE_STATUS.OK) {
      throw buildErr(409, "No se puede abrir incidencia: la máquina no está en OK", {
        from: maquina.maintenance_status,
        to: maintenanceStatus,
      });
    }

    const propRes = await client.query(
      `
      SELECT
        id,
        id_maquina,
        cliente,
        email_cliente,
        telefono,
        direccion,
        cp,
        poblacion,
        estado,
        fecha_inicio,
        fecha_fin
      FROM public.propuesta_alquiler
      WHERE id = $1
      `,
      [propuestaAlquilerId]
    );

    if (propRes.rows.length === 0) {
      throw buildErr(404, "propuesta_alquiler no encontrada", { propuestaAlquilerId });
    }

    const propuesta = propRes.rows[0];

    if (Number(propuesta.id_maquina) !== Number(idMaquina)) {
      throw buildErr(409, "La propuesta_alquiler no corresponde con la máquina", {
        propuestaAlquilerId,
        idMaquina,
        propuestaIdMaquina: propuesta.id_maquina,
      });
    }

    if (propuesta.estado !== "ACEPTADA") {
      throw buildErr(409, "La propuesta_alquiler debe estar en estado ACEPTADA", {
        propuestaAlquilerId,
        estado: propuesta.estado,
      });
    }

    const nowRes = await client.query(`SELECT NOW() as now`);
    const now = nowRes.rows[0].now;

    if (propuesta.fecha_fin && propuesta.fecha_fin <= now) {
      throw buildErr(409, "La propuesta_alquiler ya ha finalizado por fecha", {
        propuestaAlquilerId,
        fecha_fin: propuesta.fecha_fin,
      });
    }

    const logisticsStatus =
      maintenanceStatus === MAINTENANCE_STATUS.AVERIADA_GRAVE
        ? "EN_CAMINO"
        : null;

    const ubicacionTipo =
      maintenanceStatus === MAINTENANCE_STATUS.AVERIADA_GRAVE
        ? "TRANSITO"
        : "CLIENTE";

    const ubicacionCliente = `${propuesta.direccion}, ${propuesta.poblacion}`;

    const updateFields = ["maintenance_status = $2"];
    const updateValues = [idMaquina, maintenanceStatus];
    let paramIndex = 3;

    updateFields.push(`logistics_status = $${paramIndex}`);
    updateValues.push(logisticsStatus);
    paramIndex += 1;

    if (ubicacionTipo !== null) {
      updateFields.push(`ubicacion_tipo = $${paramIndex}`);
      updateValues.push(ubicacionTipo);
      paramIndex += 1;
    }

    if (maintenanceStatus === MAINTENANCE_STATUS.AVERIADA) {
      updateFields.push(`ubicacion_ref_id = $${paramIndex}`);
      updateValues.push(propuestaAlquilerId);
      paramIndex += 1;

      updateFields.push(`ubicacion = $${paramIndex}`);
      updateValues.push(ubicacionCliente);
      paramIndex += 1;
    }

    await client.query(
      `
      UPDATE public.maquina
      SET ${updateFields.join(", ")}
      WHERE id_maquina = $1
      `,
      updateValues
    );

    const albaranRes = await client.query(
      `
      INSERT INTO public.albaran (
        id_user,
        id_maquina,
        propuesta_alquiler_id,
        cliente,
        direccion,
        telefono,
        poblacion,
        cp,
        email_cliente,
        marca,
        modelo,
        ns,
        observaciones,
        estado
      )
      VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8, $9,
        $10, $11, $12,
        $13, 'BORRADOR'
      )
      RETURNING id_albaran
      `,
      [
        idUser,
        idMaquina,
        propuestaAlquilerId,
        propuesta.cliente,
        propuesta.direccion,
        propuesta.telefono,
        propuesta.poblacion,
        propuesta.cp,
        propuesta.email_cliente,
        maquina.marca,
        maquina.modelo,
        maquina.ns,
        comentario ?? null,
      ]
    );

    const idAlbaran = albaranRes.rows[0]?.id_albaran;

    if (!idAlbaran) {
      throw buildErr(500, "No se pudo crear el albarán", { idMaquina });
    }

    const idUserAsignado =
      maintenanceStatus === MAINTENANCE_STATUS.AVERIADA ? idUser : null;

    const reparacionEstado =
      maintenanceStatus === MAINTENANCE_STATUS.AVERIADA_GRAVE
        ? "PENDIENTE_PRESUPUESTO"
        : REPARACION_ESTADOS.CREADA;

    const reparacionRes = await client.query(
      `
      INSERT INTO public.reparacion (
        id_maquina,
        id_albaran,
        id_user_asignado,
        comentario,
        solucion_aplicada,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_reparacion
      `,
      [
        idMaquina,
        idAlbaran,
        idUserAsignado,
        comentario ?? null,
        null,
        reparacionEstado,
      ]
    );

    const idReparacion = reparacionRes.rows[0]?.id_reparacion;

    if (!idReparacion) {
      throw buildErr(500, "No se pudo crear la reparación", { idMaquina });
    }

    await client.query("COMMIT");

    return {
      id_maquina: idMaquina,
      maintenance_status: maintenanceStatus,
      ubicacion_tipo: ubicacionTipo,
      logistics_status: logisticsStatus,
      id_albaran: idAlbaran,
      id_reparacion: idReparacion,
      reparacion_estado: reparacionEstado,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

function buildErr(statusCode, message, meta) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.meta = meta;
  return err;
}

export async function escalarAveriaGraveTx({ idMaquina, comentario }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const maquinaRes = await client.query(
      `
      SELECT id_maquina, maintenance_status
      FROM public.maquina
      WHERE id_maquina = $1
      FOR UPDATE
      `,
      [idMaquina]
    );

    if (maquinaRes.rows.length === 0) {
      throw buildErr(404, "Máquina no encontrada", { idMaquina });
    }

    const current = maquinaRes.rows[0].maintenance_status;

    if (current === MAINTENANCE_STATUS.OK) {
      throw buildErr(409, "No se puede escalar desde OK. Abre incidencia grave.", {
        from: current,
        to: MAINTENANCE_STATUS.AVERIADA_GRAVE,
      });
    }

    if (current === MAINTENANCE_STATUS.AVERIADA_GRAVE) {
      await client.query("COMMIT");
      return { id_maquina: idMaquina, maintenance_status: MAINTENANCE_STATUS.AVERIADA_GRAVE };
    }

    if (current !== MAINTENANCE_STATUS.AVERIADA) {
      throw buildErr(409, "Transición no permitida", {
        from: current,
        to: MAINTENANCE_STATUS.AVERIADA_GRAVE,
      });
    }

    await client.query(
      `
      UPDATE public.maquina
      SET maintenance_status = $2
      WHERE id_maquina = $1
      `,
      [idMaquina, MAINTENANCE_STATUS.AVERIADA_GRAVE]
    );

    await client.query(
      `
      UPDATE public.reparacion
      SET
        id_user_asignado = NULL,
        estado = 'PENDIENTE_PRESUPUESTO',
        comentario = COALESCE($2, comentario)
      WHERE id_maquina = $1
        AND estado NOT IN ('TERMINADA','CANCELADA')
      `,
      [idMaquina, comentario ?? null]
    );

    await client.query(
      `
      UPDATE public.albaran
      SET observaciones = COALESCE($2, observaciones)
      WHERE id_albaran = (
        SELECT r.id_albaran
        FROM public.reparacion r
        WHERE r.id_maquina = $1
          AND r.estado NOT IN ('TERMINADA', 'CANCELADA')
        ORDER BY r.id_reparacion DESC
        LIMIT 1
      )
      `,
      [idMaquina, comentario ?? null]
    );

    await client.query("COMMIT");

    return {
      id_maquina: idMaquina,
      maintenance_status: MAINTENANCE_STATUS.AVERIADA_GRAVE,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
