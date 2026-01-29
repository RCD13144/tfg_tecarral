import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import pool from "../config/db.js";


const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);

const backendRoot = path.resolve(scriptDir, "..", "..");

dotenv.config({
  path: path.join(backendRoot, ".env"),
});


const ELEVACION_TYPES = new Set([
  "apiladora",
  "carretilla elevadora",
  "plataforma articulada",
  "plataforma de tijera",
  "preparapedidos",
  "retractil",
  "retráctil",
  "transpaleta electrica",
  "transpaleta eléctrica",
  "transpaleta manual",
]);

const LIMPIEZA_TYPES = new Set([
  "barredora",
  "fregadora",
  "criogená",
  "criógena",
  "hidrolimpiadora",
  "vaporeta",
  "limpiamoquetas",
  "aspirador",
  "pulidora",
  "limpia escaleras",
]);

function normalizeType(value) {
  let result = null;

  if (value !== undefined && value !== null) {
    const text = String(value).trim().toLowerCase();
    if (text.length > 0) {
      result = text;
    }
  }

  return result;
}


function toBooleanOrNull(value) {
  let result = null;

  if (value !== undefined && value !== null) {
    const text = String(value).trim().toLowerCase();

    if (
      text === "si" ||
      text === "sí" ||
      text === "s" ||
      text === "1" ||
      text === "true" ||
      text === "x"
    ) {
      result = true;
    } else if (
      text === "no" ||
      text === "n" ||
      text === "0" ||
      text === "false"
    ) {
      result = false;
    }
  }

  return result;
}

function toTextOrNull(value) {
  let result = null;

  if (value !== undefined && value !== null) {
    const text = String(value).trim();
    if (text.length > 0) {
      result = text;
    }
  }

  return result;
}

function toIntOrNull(value) {
  let result = null;

  if (value !== undefined && value !== null) {
    const text = String(value).trim();
    const parsed = Number.parseInt(text, 10);

    if (!Number.isNaN(parsed)) {
      result = parsed;
    }
  }

  return result;
}

function toNumberOrNull(value) {
  let result = null;

  if (value !== undefined && value !== null) {
    const text = String(value).trim().replace(",", ".");
    const parsed = Number.parseFloat(text);

    if (!Number.isNaN(parsed)) {
      result = parsed;
    }
  }

  return result;
}

function pick(row, keys) {
  let result = undefined;

  for (const key of keys) {
    if (result === undefined && Object.prototype.hasOwnProperty.call(row, key)) {
      result = row[key];
    }
  }

  return result;
}


function isElevacionByCampos(elev) {
  const values = [
    elev.ruedas,
    elev.cap_carga,
    elev.replegado_mm,
    elev.elevacion_libre,
    elev.elevacion,
    elev.desplazamiento,
    elev.posicion,
    elev.antihuella,
    elev.matricula,
    elev.largo,
    elev.alto,
    elev.ancho,
    elev.peso_kg,
    elev.horquillas,
  ];

  let any = false;
  for (const v of values) {
    if (any === false) {
      const hasValue =
        v !== null &&
        v !== undefined &&
        String(v).trim().length > 0;
      if (hasValue) {
        any = true;
      }
    }
  }

  return any;
}

function decideIsElevacion(tipo, elev, unknownTypesCollector) {
  const normalized = normalizeType(tipo);
  const byCampos = isElevacionByCampos(elev);

  const inElevacion = normalized !== null && ELEVACION_TYPES.has(normalized);
  const inLimpieza = normalized !== null && LIMPIEZA_TYPES.has(normalized);

  let isElevacion = false;

  if (inLimpieza) {
    isElevacion = byCampos;
  } else if (inElevacion) {
    isElevacion = true;
  } else {
    isElevacion = byCampos;

    if (normalized !== null) {
      unknownTypesCollector.unknown.add(normalized);
    } else {
      unknownTypesCollector.emptyTipo += 1;
    }
  }

  return isElevacion;
}

function emptyElevacion() {
  return {
    ruedas: null,
    cap_carga: null,
    replegado_mm: null,
    elevacion_libre: null,
    elevacion: null,
    desplazamiento: null,
    posicion: null,
    antihuella: null,
    matricula: null,
    largo: null,
    alto: null,
    ancho: null,
    peso_kg: null,
    horquillas: null,
  };
}


function readExcelRows(filePath) {
  const workbook = xlsx.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];

  return xlsx.utils.sheet_to_json(sheet, { defval: null });
}


async function insertMaquina(client, maquina) {
  const query = `
    INSERT INTO maquina (
      tipo,
      marca,
      motor,
      modelo,
      ns,
      seguro,
      num_poliza,
      alquilada,
      ubicacion,
      observaciones
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id_maquina
  `;

  const params = [
    maquina.tipo,
    maquina.marca,
    maquina.motor,
    maquina.modelo,
    maquina.ns,
    maquina.seguro,
    maquina.num_poliza,
    maquina.alquilada,
    maquina.ubicacion,
    maquina.observaciones,
  ];

  const result = await client.query(query, params);
  return result.rows[0].id_maquina;
}

async function insertMaquinaElevacion(client, idMaquina, elev) {
  const query = `
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
  `;

  const params = [
    idMaquina,
    elev.ruedas,
    elev.cap_carga,
    elev.replegado_mm,
    elev.elevacion_libre,
    elev.elevacion,
    elev.desplazamiento,
    elev.posicion,
    elev.antihuella,
    elev.matricula,
    elev.largo,
    elev.alto,
    elev.ancho,
    elev.peso_kg,
    elev.horquillas,
  ];

  await client.query(query, params);
}


function mapRowToMaquinaFromTecarral(row) {
  return {
    tipo: toTextOrNull(pick(row, ["Tipo", "tipo"])),
    marca: toTextOrNull(pick(row, ["Marca", "marca"])),
    motor: toTextOrNull(pick(row, ["Motor", "motor"])),
    modelo: toTextOrNull(pick(row, ["Modelo", "modelo"])),
    ns: toTextOrNull(
      pick(row, ["NS", "Ns", "Nº Serie", "Numero de serie", "Número de serie"])
    ),
    seguro: toBooleanOrNull(pick(row, ["Seg.", "Seguro", "seguro"])),
    num_poliza: toTextOrNull(
      pick(row, ["Nº Póliza", "N° Póliza", "No Poliza", "Nº poliza", "NºPoliza"])
    ),
    alquilada: toBooleanOrNull(pick(row, ["Alquilada", "alquilada"])),
    ubicacion: toTextOrNull(
      pick(row, ["Ubicacion", "UBICACION", "Ubicación", "ubicacion"])
    ),
    observaciones: toTextOrNull(pick(row, ["Observaciones", "observaciones"])),
  };
}

function mapRowToElevacionFromTecarral(row) {
  return {
    ruedas: toTextOrNull(pick(row, ["Ruedas"])),
    cap_carga: toTextOrNull(
      pick(row, ["Cap. Carga", "Cap.Carga", "Capacidad de Carga"])
    ),
    replegado_mm: toIntOrNull(
      pick(row, ["Repleg. mm", "Replegado (mm)", "Replegado", "Repleg"])
    ),
    elevacion_libre: toBooleanOrNull(
      pick(row, ["Elev. Libre", "Elevación libre"])
    ),
    elevacion: toTextOrNull(pick(row, ["ELEVACION", "Elevacion", "Elevación"])),
    desplazamiento: toTextOrNull(pick(row, ["Desplaz.", "Desplazamiento"])),
    posicion: toTextOrNull(pick(row, ["Posic.", "Posición"])),
    antihuella: toTextOrNull(pick(row, ["Antihuella", "Antihuellas"])),
    matricula: toTextOrNull(pick(row, ["Matrícula", "Matricula"])),
    largo: toNumberOrNull(pick(row, ["Largo"])),
    alto: toNumberOrNull(pick(row, ["Alto"])),
    ancho: toNumberOrNull(pick(row, ["Ancho"])),
    peso_kg: toNumberOrNull(pick(row, ["Peso", "Peso kg", "Peso (kg)"])),
    horquillas: toTextOrNull(pick(row, ["HORQUILLAS", "Horquillas"])),
  };
}

function mapRowToMaquinaFromLimpieza(row) {
  return {
    tipo: toTextOrNull(pick(row, ["Tipo", "tipo"])),
    marca: toTextOrNull(pick(row, ["Marca", "marca"])),
    motor: toTextOrNull(pick(row, ["Energía", "Energia", "energia"])),
    modelo: toTextOrNull(pick(row, ["Modelo", "modelo"])),
    ns: toTextOrNull(
      pick(row, ["NS", "Ns", "Nº Serie", "Numero de serie", "Número de serie"])
    ),
    seguro: toBooleanOrNull(pick(row, ["Seguro", "seguro"])),
    num_poliza: toTextOrNull(
      pick(row, ["Nº Póliza", "N° Póliza", "No Poliza", "Nº poliza", "NºPoliza"])
    ),
    alquilada: toBooleanOrNull(pick(row, ["Alquilada", "alquilada"])),
    ubicacion: toTextOrNull(
      pick(row, ["Ubicacion", "UBICACION", "Ubicación", "ubicacion"])
    ),
    observaciones: toTextOrNull(pick(row, ["Otros", "otros"])),
  };
}

/* --------------------------------- Paths --------------------------------- */

function getExcelPaths() {
  const baseDir = path.join(backendRoot, "database");

  return {
    tecarralPath: path.join(baseDir, "Maquinaria_de_Tecarral.xlsx"),
    limpiezaPath: path.join(baseDir, "Maquinaria_Limpieza_Tecarral.xlsx"),
  };
}

function validateFilesExist(paths) {
  const missing = [];

  if (!fs.existsSync(paths.tecarralPath)) missing.push(paths.tecarralPath);
  if (!fs.existsSync(paths.limpiezaPath)) missing.push(paths.limpiezaPath);

  if (missing.length > 0) {
    throw new Error(`No encuentro los Excel. Revisa rutas o nombres:\n- ${missing.join("\n- ")}`);
  }
}

/* --------------------------------- Main ---------------------------------- */

async function main() {
  // Comprobación simple de env para evitar el error SCRAM
  const dbPassType = typeof process.env.DB_PASSWORD;
  if (dbPassType !== "string") {
    throw new Error(
      `DB_PASSWORD no está cargada (tipo: ${dbPassType}). Revisa backend/tecarral-api/.env`
    );
  }

  const paths = getExcelPaths();
  validateFilesExist(paths);

  const tecarralRows = readExcelRows(paths.tecarralPath);
  const limpiezaRows = readExcelRows(paths.limpiezaPath);

  const unknownTypesCollector = {
    unknown: new Set(),
    emptyTipo: 0,
  };

  const stats = {
    tecarral_total: tecarralRows.length,
    limpieza_total: limpiezaRows.length,
    insert_maquina: 0,
    insert_elevacion: 0,
  };

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Maquinaria_de_Tecarral
    for (const row of tecarralRows) {
      const maquina = mapRowToMaquinaFromTecarral(row);
      const elev = mapRowToElevacionFromTecarral(row);

      const idMaquina = await insertMaquina(client, maquina);
      stats.insert_maquina += 1;

      const isElevacion = decideIsElevacion(maquina.tipo, elev, unknownTypesCollector);
      if (isElevacion) {
        await insertMaquinaElevacion(client, idMaquina, elev);
        stats.insert_elevacion += 1;
      }
    }

    // 2) Maquinaria_Limpieza_Tecarral
    for (const row of limpiezaRows) {
      const maquina = mapRowToMaquinaFromLimpieza(row);
      const elev = emptyElevacion();

      const idMaquina = await insertMaquina(client, maquina);
      stats.insert_maquina += 1;

      const isElevacion = decideIsElevacion(maquina.tipo, elev, unknownTypesCollector);
      if (isElevacion) {
        // Si por error el tipo es de elevación, crea fila hija vacía (todo NULL)
        await insertMaquinaElevacion(client, idMaquina, elev);
        stats.insert_elevacion += 1;
      }
    }

    await client.query("COMMIT");

    console.log("Importación completada correctamente.");
    console.log(`- Filas Tecarral: ${stats.tecarral_total}`);
    console.log(`- Filas Limpieza: ${stats.limpieza_total}`);
    console.log(`- Insert maquina: ${stats.insert_maquina}`);
    console.log(`- Insert maquina_elevacion: ${stats.insert_elevacion}`);

    const unknownList = Array.from(unknownTypesCollector.unknown).sort();
    if (unknownList.length > 0) {
      console.log("\n Tipos desconocidos (no están en tus listas):");
      for (const t of unknownList) {
        console.log(`- ${t}`);
      }
    }

    if (unknownTypesCollector.emptyTipo > 0) {
      console.log(`\n Filas con Tipo vacío o null: ${unknownTypesCollector.emptyTipo}`);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error importando:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
