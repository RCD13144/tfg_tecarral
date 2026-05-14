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

async function ensureDataMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.data_migrations (
      key TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function ensureSeedTablesExist(client) {
  const requiredTables = ["public.maquina", "public.maquina_elevacion"];

  for (const tableName of requiredTables) {
    const result = await client.query("SELECT to_regclass($1) AS table_name", [tableName]);

    if (!result.rows[0]?.table_name) {
      const error = new Error(
        `Falta la tabla ${tableName}. Ejecuta primero las migraciones con npm run migrate.`
      );
      error.code = "MISSING_REQUIRED_TABLE";
      throw error;
    }
  }
}

async function syncMachineSequence(client) {
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('public.maquina', 'id_maquina'),
      COALESCE((SELECT MAX(id_maquina) FROM public.maquina), 1),
      true
    );
  `);
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
    await ensureDataMigrationsTable(client);
    await ensureSeedTablesExist(client);

    const check = await client.query(
      "SELECT 1 FROM public.data_migrations WHERE key = $1",
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
    await syncMachineSequence(client);

    await client.query("ALTER TABLE public.maquina ENABLE TRIGGER USER");
    await client.query("ALTER TABLE public.maquina_elevacion ENABLE TRIGGER USER");

    await client.query(
      "INSERT INTO public.data_migrations (key) VALUES ($1)",
      [SEED_KEY]
    );

    await client.query("COMMIT");

    console.log("Seed aplicado correctamente.");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
    }
    console.error("Error en seed:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}
