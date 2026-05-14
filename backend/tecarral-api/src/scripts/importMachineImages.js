import "dotenv/config";

import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";
import {
  buildMachineImageAbsolutePath,
  buildMachineImageRelativePath,
  ensureMachineImagesDirectory,
  normalizeMachineImageKey,
} from "../utils/machine-image-storage.js";

function buildClient() {
  return new pg.Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

function resolveFirstExistingPath(paths) {
  for (const candidate of paths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getRepoRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "../../../..");
}

function getMachineImageAssetsDir() {
  const repoRoot = getRepoRoot();

  return resolveFirstExistingPath([
    process.env.MACHINE_IMAGE_ASSETS_DIR,
    path.resolve(repoRoot, "frontend/tecarral-app/assets/machines"),
    "/seed-assets/machines",
  ]);
}

function getMachineImageMapFile() {
  const repoRoot = getRepoRoot();

  return resolveFirstExistingPath([
    process.env.MACHINE_IMAGE_MAP_FILE,
    path.resolve(repoRoot, "frontend/tecarral-app/constants/machine-images.ts"),
    "/seed-assets/machine-images.ts",
  ]);
}

function parseBundledImageMap(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const regex = /'([^']+)': require\('@\/assets\/machines\/([^']+)'\)/g;
  const map = new Map();
  let match = regex.exec(source);

  while (match) {
    const [, key, fileName] = match;
    map.set(key, fileName);
    match = regex.exec(source);
  }

  return map;
}

function normalizeExtension(fileName) {
  const ext = path.extname(fileName).replace(/^\./, "").toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
}

async function main() {
  const assetsDir = getMachineImageAssetsDir();
  const mapFile = getMachineImageMapFile();

  if (!assetsDir || !mapFile) {
    throw new Error(
      "No se encontraron los assets actuales de maquinaria. Define MACHINE_IMAGE_ASSETS_DIR y MACHINE_IMAGE_MAP_FILE si hace falta."
    );
  }

  ensureMachineImagesDirectory();

  const overwrite = String(process.env.MACHINE_IMAGE_IMPORT_OVERWRITE ?? "")
    .trim()
    .toLowerCase() === "true";

  const imageMap = parseBundledImageMap(mapFile);
  const client = buildClient();

  await client.connect();

  try {
    const result = await client.query(
      `
      SELECT id_maquina, modelo, image_path
      FROM maquina
      ORDER BY id_maquina ASC
      `
    );

    let imported = 0;
    let skippedExisting = 0;
    let missingMatch = 0;
    let missingAsset = 0;

    for (const row of result.rows) {
      if (row.image_path && !overwrite) {
        skippedExisting += 1;
        continue;
      }

      const normalizedKey = normalizeMachineImageKey(row.modelo);
      const sourceFileName = imageMap.get(normalizedKey);

      if (!sourceFileName) {
        missingMatch += 1;
        continue;
      }

      const sourcePath = path.join(assetsDir, sourceFileName);

      if (!fs.existsSync(sourcePath)) {
        missingAsset += 1;
        continue;
      }

      const extension = normalizeExtension(sourceFileName);
      const relativePath = buildMachineImageRelativePath(row.id_maquina, extension);
      const destinationPath = buildMachineImageAbsolutePath(relativePath);

      fs.copyFileSync(sourcePath, destinationPath);

      await client.query(
        `
        UPDATE maquina
        SET image_path = $2
        WHERE id_maquina = $1
        `,
        [row.id_maquina, relativePath]
      );

      imported += 1;
    }

    console.log(
      `Importación de imágenes completada. Importadas: ${imported}, omitidas por imagen existente: ${skippedExisting}, sin coincidencia por modelo: ${missingMatch}, asset ausente: ${missingAsset}.`
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Error importando imágenes de maquinaria:", error.message);
  process.exitCode = 1;
});
