import app from "./app.js";
import { runMigrations } from "./migrations/runMigrations.js";

const PORT = process.env.PORT ?? 3000;

async function start() {
  await runMigrations();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

start();
