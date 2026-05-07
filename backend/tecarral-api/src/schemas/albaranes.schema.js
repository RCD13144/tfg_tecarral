function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

const ALBARAN_ESTADOS = ["BORRADOR", "FIRMADO"];

function isBase64Payload(v) {
  if (!isNonEmptyString(v)) return false;

  const raw = v.trim();

  const parts = raw.split("base64,");
  const b64 = parts.length === 2 ? parts[1] : raw;

  if (b64.length < 20) return false;

  return true;
}

export function validateFirmarAlbaranBody(body) {
  if (!body || typeof body !== "object") return false;

  const okFirmaCliente = isBase64Payload(body.firma_cliente_base64);
  const okFirmaTecnico = isBase64Payload(body.firma_tecnico_base64);

  if (!okFirmaCliente) return false;
  if (!okFirmaTecnico) return false;

  if (body.observaciones !== undefined && body.observaciones !== null) {
    if (typeof body.observaciones !== "string") return false;
  }

  return true;
}

export function validateAlbaranEstadoQuery(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ALBARAN_ESTADOS.includes(value.trim().toUpperCase());
}
