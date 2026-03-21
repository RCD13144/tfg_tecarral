function isPositiveInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function normalizeNullableText(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function normalizeNullableNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function validateCreatePresupuestoReparacionBody(body) {
  const errors = [];

  const reparacionId = Number(body?.reparacion_id);
  const propuestaAlquilerId = Number(body?.propuesta_alquiler_id);
  const importeTotal = normalizeNullableNumber(body?.importe_total);
  const condiciones = normalizeNullableText(body?.condiciones);
  const expiraAtRaw = String(body?.expira_at ?? "").trim();

  if (!isPositiveInteger(reparacionId)) {
    errors.push("reparacion_id debe ser un entero positivo");
  }

  if (!isPositiveInteger(propuestaAlquilerId)) {
    errors.push("propuesta_alquiler_id debe ser un entero positivo");
  }

  if (importeTotal === null || importeTotal < 0) {
    errors.push("importe_total debe ser un número mayor o igual que 0");
  }

  if (expiraAtRaw.length === 0) {
    errors.push("expira_at es obligatorio");
  }

  const expiraAtDate = new Date(expiraAtRaw);
  const isExpiraAtValid = Number.isFinite(expiraAtDate.getTime());

  if (!isExpiraAtValid) {
    errors.push("expira_at debe ser una fecha válida");
  }

  const ok = errors.length === 0;

  return {
    ok,
    errors,
    value: ok
      ? {
          reparacion_id: reparacionId,
          propuesta_alquiler_id: propuestaAlquilerId,
          importe_total: importeTotal,
          condiciones,
          expira_at: expiraAtDate.toISOString(),
        }
      : null,
  };
}

export function validatePresupuestoReparacionIdParam(id) {
  const value = Number(id);
  const ok = isPositiveInteger(value);

  return {
    ok,
    errors: ok ? [] : ["id inválido"],
    value: ok ? value : null,
  };
}
