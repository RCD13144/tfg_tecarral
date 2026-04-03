import dotenv from "dotenv";

export default async function globalSetup() {
  dotenv.config({
    path: ".env.test",
  });

  const { runMigrations } = await import("../../src/migrations/runMigrations.js");

  await runMigrations();
}