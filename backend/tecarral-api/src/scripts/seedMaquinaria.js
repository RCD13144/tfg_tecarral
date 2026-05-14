import "dotenv/config";

import { runData } from "../data/runData.js";

runData().catch((error) => {
  console.error("Error ejecutando el seed de maquinaria:", error.message);
  process.exitCode = 1;
});
