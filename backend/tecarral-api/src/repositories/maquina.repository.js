import pool from "../config/db.js";

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
        addStringFilter("tipo_maquina", tipoMaquina, values, conditions);

    if (subtipo !== undefined)
        addStringFilter("tipo", subtipo, values, conditions);

    if (availability !== undefined)
        addStringFilter("availability_status", availability, values, conditions, true);

    if (ubicacion !== undefined)
        addStringFilter("ubicacion", ubicacion, values, conditions);

    if (marca !== undefined)
        addStringFilter("marca", marca, values, conditions);

    if (ubicacion_type !== undefined)
        addStringFilter("ubicacion_tipo", ubicacion_type, values, conditions);

    if (motor !== undefined)
        addStringFilter("motor", motor, values, conditions);

    const where = conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

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


export async function findMaquinaria(filters) {
    const { q } = filters;
    const base = buildBase(filters);

    if (q === undefined) {
        const query = `
            SELECT *
            FROM maquina
            ${base.where}
            ORDER BY id_maquina ASC
        `;
        const result = await pool.query(query, base.values);
        return result.rows;
    }

    {
        const values = [...base.values, q];
        const idx = values.length;

        const where = base.where.length > 0
            ? `${base.where} AND search_vector @@ websearch_to_tsquery('spanish', $${idx})`
            : `WHERE search_vector @@ websearch_to_tsquery('spanish', $${idx})`;

        const query = `
            SELECT *
            FROM maquina
            ${where}
            ORDER BY ts_rank_cd(search_vector, websearch_to_tsquery('spanish', $${idx})) DESC
        `;

        const result = await pool.query(query, values);
        if (result.rows.length > 0) return result.rows;
    }

    {
        const values = [...base.values, q];
        const idx = values.length;

        const where = base.where.length > 0
            ? `${base.where} AND search_vector @@ plainto_tsquery('spanish', $${idx})`
            : `WHERE search_vector @@ plainto_tsquery('spanish', $${idx})`;

        const query = `
            SELECT *
            FROM maquina
            ${where}
            ORDER BY ts_rank_cd(search_vector, plainto_tsquery('spanish', $${idx})) DESC
        `;

        const result = await pool.query(query, values);
        if (result.rows.length > 0) return result.rows;
    }

    {
        const tokens = splitTokens(q).filter(t => t.length >= 3);
        const fallbackTokens = tokens.length > 0 ? tokens : [String(q).trim().toLowerCase()];

        const values = [...base.values];
        const tokenConditions = [];

        for (const token of fallbackTokens) {
            values.push(token);
            const idx = values.length;

            tokenConditions.push(`word_similarity($${idx}, search_text) > 0.35`);
        }

        const whereTokens = `(${tokenConditions.join(" OR ")})`;

        const where = base.where.length > 0
            ? `${base.where} AND ${whereTokens}`
            : `WHERE ${whereTokens}`;

        const simExpr = fallbackTokens
            .map((_, i) => {
                const idx = base.values.length + (i + 1);
                return `word_similarity($${idx}, search_text)`;
            })
            .join(", ");

        const query = `
            SELECT *
            FROM maquina
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
