import fs from "fs/promises";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_KEY = "maquinaria_seed_v1";

function shouldRunSeed() {
  return process.env.RUN_MAQUINARIA_SEED === "true";
}

function buildClient() {
  return new pg.Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

function sanitizeSeedSql(sql) {
  return String(sql ?? "")
    .replace(/^\s*\\(?:restrict|unrestrict)\b.*$/gm, "")
    .trim();
}

export async function runData() {
  if (!shouldRunSeed()) {
    console.log("Seed desactivado (RUN_MAQUINARIA_SEED != true)");
    return;
  }

  const client = buildClient();
  await client.connect();

  try {
    const check = await client.query(
      "SELECT 1 FROM data_migrations WHERE key = $1",
      [SEED_KEY]
    );

    if (check.rows.length > 0) {
      console.log("Seed ya aplicado, se omite.");
      return;
    }

    console.log("Ejecutando seed de maquinaria...");

    const seedPath = path.resolve(__dirname, "./maquinaria.sql");
    const rawSql = await fs.readFile(seedPath, "utf8");
    const sql = sanitizeSeedSql(rawSql);

    await client.query("BEGIN");
    await client.query("ALTER TABLE public.maquina DISABLE TRIGGER USER");
    await client.query("ALTER TABLE public.maquina_elevacion DISABLE TRIGGER USER");

    await client.query(sql);

    await client.query("ALTER TABLE public.maquina ENABLE TRIGGER USER");
    await client.query("ALTER TABLE public.maquina_elevacion ENABLE TRIGGER USER");

    await client.query(
      "INSERT INTO data_migrations (key) VALUES ($1)",
      [SEED_KEY]
    );

    await client.query("COMMIT");

    console.log("Seed aplicado correctamente.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en seed:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}
