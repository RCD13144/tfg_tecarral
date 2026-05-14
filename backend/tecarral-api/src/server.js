import "dotenv/config";

import app from "./app.js";

const PORT = process.env.PORT ?? 3000;

async function start() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

start();
