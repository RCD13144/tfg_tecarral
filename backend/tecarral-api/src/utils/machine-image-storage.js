import fs from "fs";
import path from "path";
import sharp from "sharp";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export function getUploadsDirectory() {
  return path.resolve(process.cwd(), "uploads");
}

export function getMachineImagesDirectory() {
  return path.join(getUploadsDirectory(), "maquinaria");
}

export function ensureMachineImagesDirectory() {
  fs.mkdirSync(getMachineImagesDirectory(), { recursive: true });
}

export function normalizeMachineImageKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeFileNameExtension(fileName) {
  const rawExtension = path.extname(String(fileName ?? "")).replace(/^\./, "").toLowerCase();
  if (!rawExtension) {
    return null;
  }

  return rawExtension === "jpeg" ? "jpg" : rawExtension;
}

function normalizeMimeTypeExtension(mimeType) {
  const cleanMime = String(mimeType ?? "").trim().toLowerCase();

  if (cleanMime === "image/jpeg" || cleanMime === "image/jpg") return "jpg";
  if (cleanMime === "image/png") return "png";
  if (cleanMime === "image/webp") return "webp";

  return null;
}

export function resolveImageExtension({ fileName, mimeType }) {
  const fileNameExtension = normalizeFileNameExtension(fileName);
  if (fileNameExtension && ALLOWED_EXTENSIONS.has(fileNameExtension)) {
    return fileNameExtension;
  }

  const mimeExtension = normalizeMimeTypeExtension(mimeType);
  if (mimeExtension && ALLOWED_EXTENSIONS.has(mimeExtension)) {
    return mimeExtension;
  }

  return null;
}

export function buildMachineImageRelativePath(idMaquina, extension) {
  const normalizedExtension = extension === "jpeg" ? "jpg" : extension;
  return `maquinaria/maquina_${idMaquina}.${normalizedExtension}`;
}

export function buildMachineImageAbsolutePath(relativePath) {
  const normalizedRelativePath = String(relativePath ?? "").replace(/[\\/]+/g, path.sep);
  return path.join(getUploadsDirectory(), normalizedRelativePath);
}

export function deleteStoredMachineImage(relativePath) {
  const cleanRelativePath = String(relativePath ?? "").trim();

  if (!cleanRelativePath) {
    return;
  }

  const absolutePath = buildMachineImageAbsolutePath(cleanRelativePath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

export async function storeMachineImage({
  idMaquina,
  buffer,
  fileName,
  mimeType,
  previousImagePath,
}) {
  const extension = resolveImageExtension({ fileName, mimeType });

  if (!extension) {
    const error = new Error("Formato de imagen no permitido");
    error.statusCode = 400;
    throw error;
  }

  ensureMachineImagesDirectory();

  let optimizedBuffer;

  try {
    optimizedBuffer = await sharp(buffer)
      .rotate()
      .webp({
        quality: 82,
        effort: 4,
        alphaQuality: 90,
      })
      .toBuffer();
  } catch {
    const error = new Error("No se pudo procesar la imagen subida");
    error.statusCode = 400;
    throw error;
  }

  const nextRelativePath = buildMachineImageRelativePath(idMaquina, "webp");
  const nextAbsolutePath = buildMachineImageAbsolutePath(nextRelativePath);

  fs.writeFileSync(nextAbsolutePath, optimizedBuffer);

  if (previousImagePath && previousImagePath !== nextRelativePath) {
    deleteStoredMachineImage(previousImagePath);
  }

  return nextRelativePath;
}

export function buildPublicImageUrl(imagePath) {
  const cleanImagePath = String(imagePath ?? "").trim().replace(/^\/+/, "");

  if (!cleanImagePath) {
    return null;
  }

  const publicBaseUrl = String(process.env.PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");

  if (!publicBaseUrl) {
    return `/uploads/${cleanImagePath}`;
  }

  return `${publicBaseUrl}/uploads/${cleanImagePath}`;
}
