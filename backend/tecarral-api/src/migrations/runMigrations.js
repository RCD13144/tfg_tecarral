import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { fileURLToPath } from "url";

function listSqlMigrations(migrationsDir) {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function getAppliedMigrations(client) {
  const result = await client.query("SELECT filename FROM schema_migrations");
  const applied = new Set();

  for (const row of result.rows) {
    applied.add(row.filename);
  }

  return applied;
}

export async function runMigrations() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const migrationsDir = path.resolve(__dirname, "../migrations");

  const files = listSqlMigrations(migrationsDir);

  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock(123456789)");

    await client.query("BEGIN");

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
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(123456789)");
    } catch {
      // no-op
    }
    client.release();
  }
}
