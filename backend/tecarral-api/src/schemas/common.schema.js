export function validateId(idParam) {
  const id = Number(String(idParam ?? "").trim());
  const ok = Number.isInteger(id) && id > 0;
  return ok;
}

export function parseId(idParam) {
  const id = Number(String(idParam ?? "").trim());
  const ok = Number.isInteger(id) && id > 0;
  return ok ? id : null;
}

export function validateIdArray(value) {
  if (!Array.isArray(value)) return false;

  let allValid = true;

  for (let i = 0; i < value.length; i += 1) {
    const id = Number(String(value[i] ?? "").trim());
    const isValid = Number.isInteger(id) && id > 0;

    if (!isValid) {
      allValid = false;
    }
  }

  return allValid;
}
