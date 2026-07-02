import sharp from "sharp";

const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;
const MAX_SIGNATURE_DIMENSION = 2500;
const MIN_SIGNATURE_DIMENSION = 20;

function invalidSignature(label, detail) {
  const error = new Error(`${label} inválida${detail ? `: ${detail}` : ""}`);
  error.statusCode = 400;
  return error;
}

function decodeBase64Image(input, label) {
  const raw = String(input ?? "").trim();
  const match = raw.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/i);

  if (!match) {
    throw invalidSignature(label, "debe ser una imagen PNG o JPEG en base64");
  }

  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");

  if (buffer.length === 0 || buffer.length > MAX_SIGNATURE_BYTES) {
    throw invalidSignature(label, "el tamaño permitido es de 1 byte a 2 MB");
  }

  return buffer;
}

export async function normalizeSignatureImage(input, label) {
  const source = decodeBase64Image(input, label);

  try {
    const image = sharp(source, { failOn: "error" });
    const metadata = await image.metadata();
    const width = Number(metadata.width ?? 0);
    const height = Number(metadata.height ?? 0);

    if (
      width < MIN_SIGNATURE_DIMENSION ||
      height < MIN_SIGNATURE_DIMENSION ||
      width > MAX_SIGNATURE_DIMENSION ||
      height > MAX_SIGNATURE_DIMENSION
    ) {
      throw invalidSignature(label, "sus dimensiones no son válidas");
    }

    return await image
      .rotate()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
  } catch (error) {
    if (error?.statusCode) throw error;
    throw invalidSignature(label, "el contenido de imagen está dañado");
  }
}
