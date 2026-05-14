import "dotenv/config";

import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

function listSqlMigrations(migrationsDir) {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query("SELECT filename FROM schema_migrations");
  const applied = new Set();

  for (const row of result.rows) {
    applied.add(row.filename);
  }

  return applied;
}

function buildMigrationClient() {
  return new pg.Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

export async function runMigrations() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const migrationsDir = path.resolve(__dirname, "../migrations");
  const files = listSqlMigrations(migrationsDir);

  const client = buildMigrationClient();

  await client.connect();

  try {
    await client.query("SELECT pg_advisory_lock(123456789)");
    await client.query("BEGIN");

    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);

    for (const file of files) {
      if (!applied.has(file)) {
        const fullPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(fullPath, "utf8");

        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file]
        );
        console.log(`Applied migration: ${file}`);
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
    }

    throw error;
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(123456789)");
    } catch {
    }

    await client.end();
  }
}

const executedAsScript = (() => {
  const entrypoint = process.argv[1];

  if (!entrypoint) {
    return false;
  }

  return path.resolve(entrypoint) === fileURLToPath(import.meta.url);
})();

if (executedAsScript) {
  runMigrations().catch((error) => {
    console.error("Error ejecutando migraciones:", error.message);
    process.exitCode = 1;
  });
}
