export function normalize(value) {
  const exists =
    value !== undefined &&
    value !== null &&
    String(value).trim() !== "";

  if (!exists) {
    return undefined;
  }
  
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalized;
}
