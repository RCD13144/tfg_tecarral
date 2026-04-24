import "dotenv/config";

import app from "./app.js";
import { runMigrations } from "./migrations/runMigrations.js";
import { runData } from "./data/runData.js";

const PORT = process.env.PORT ?? 3000;

async function start() {
  await runMigrations();
  await runData();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

start();
