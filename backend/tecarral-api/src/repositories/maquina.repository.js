import pool from "../config/db.js";

function addStringFilter(field, value, values, conditions, upper = false) {
    values.push(value);
    const fn = upper ? "UPPER" : "LOWER";
    conditions.push(`${fn}(TRIM(${field})) = ${fn}(TRIM($${values.length}))`);
}

function splitTokens(q) {
    const raw = String(q).trim().toLowerCase();
    return raw.split(/\s+/).filter(p => p.length > 0);
}


function buildBase({ tipoMaquina, subtipo, availability, ubicacion, marca }) {
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
