import fs from "fs";
import path from "path";
import pool from "../config/db.js";

export async function runMigrations() {
  const migrationsDir = path.resolve("src/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    await pool.query(sql);
  }
}
