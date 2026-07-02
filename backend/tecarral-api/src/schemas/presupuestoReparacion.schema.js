function isPositiveInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function normalizeNullableText(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function normalizeNullableNumber(value) {
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizePayerType(value) {
  const text = String(value ?? "").trim().toUpperCase();
  return text === "CLIENTE" || text === "TECARRAL" || text === "EMPRESA" ? (text === "EMPRESA" ? "TECARRAL" : text) : null;
}

function normalizeChargeReason(value) {
  const text = String(value ?? "").trim().toUpperCase();
  return text === "GOLPE_ACCIDENTE" ? text : null;
}

function normalizeCoverageDecision(value) {
  const text = String(value ?? "").trim().toUpperCase();
  return text === "CLIENTE" || text === "TECARRAL" ? text : null;
}

function normalizeCoverageReason(value) {
  const text = String(value ?? "").trim().toUpperCase();
  return [
    "PREVENTIVO_NO_CUBRE",
    "TODO_INCLUIDO",
    "GOLPE_ACCIDENTE",
    "REPARACION_PUNTUAL",
    "OTRO",
  ].includes(text)
    ? text
    : null;
}

function normalizeItems(body, fallbackImporteTotal) {
  const rawItems = Array.isArray(body?.items) ? body.items : [];

  if (rawItems.length === 0 && fallbackImporteTotal !== null) {
    return [
      {
        referencia: null,
        descripcion: normalizeNullableText(body?.condiciones) ?? "Reparación según presupuesto",
        unidades: 1,
        precio_unitario: fallbackImporteTotal,
      },
    ];
  }

  return rawItems.map((item) => ({
    referencia: normalizeNullableText(item?.referencia),
    descripcion: normalizeNullableText(item?.descripcion),
    unidades: normalizeNullableNumber(item?.unidades),
    precio_unitario: normalizeNullableNumber(item?.precio_unitario),
  }));
}

export function validateCreatePresupuestoReparacionBody(body) {
  const errors = [];

  const reparacionId = Number(body?.reparacion_id);
  const propuestaAlquilerId =
    body?.propuesta_alquiler_id === undefined || body?.propuesta_alquiler_id === null
      ? null
      : Number(body?.propuesta_alquiler_id);
  const fallbackImporteTotal = normalizeNullableNumber(body?.importe_total);
  const ivaRate = normalizeNullableNumber(body?.iva_rate) ?? 21;
  const condiciones = normalizeNullableText(body?.condiciones);
  const expiraAtRaw = String(body?.expira_at ?? "").trim();
  const payerType = normalizePayerType(body?.payer_type);
  const chargeReason = normalizeChargeReason(body?.charge_reason);
  const coverageDecision = normalizeCoverageDecision(body?.coverage_decision);
  const coverageReason = normalizeCoverageReason(body?.coverage_reason);
  const items = normalizeItems(body, fallbackImporteTotal);

  if (!isPositiveInteger(reparacionId)) {
    errors.push("reparacion_id debe ser un entero positivo");
  }

  if (propuestaAlquilerId !== null && !isPositiveInteger(propuestaAlquilerId)) {
    errors.push("propuesta_alquiler_id debe ser un entero positivo cuando se informa");
  }

  if (ivaRate < 0 || ivaRate > 100) {
    errors.push("iva_rate debe estar entre 0 y 100");
  }

  if (items.length === 0) {
    errors.push("items debe contener al menos una línea");
  }

  for (const [index, item] of items.entries()) {
    const label = `items[${index}]`;
    if (!item.descripcion) {
      errors.push(`${label}.descripcion es obligatoria`);
    }
    if (item.unidades === null || item.unidades <= 0) {
      errors.push(`${label}.unidades debe ser mayor que 0`);
    }
    if (item.precio_unitario === null || item.precio_unitario < 0) {
      errors.push(`${label}.precio_unitario debe ser mayor o igual que 0`);
    }
  }

  if (String(body?.payer_type ?? "").trim().length > 0 && payerType === null) {
    errors.push("payer_type debe ser CLIENTE o TECARRAL");
  }

  if (String(body?.charge_reason ?? "").trim().length > 0 && chargeReason === null) {
    errors.push("charge_reason debe ser GOLPE_ACCIDENTE");
  }

  if (
    String(body?.coverage_decision ?? "").trim().length > 0 &&
    coverageDecision === null
  ) {
    errors.push("coverage_decision debe ser CLIENTE o TECARRAL");
  }

  if (String(body?.coverage_reason ?? "").trim().length > 0 && coverageReason === null) {
    errors.push("coverage_reason inválido");
  }

  const defaultExpiraAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiraAtDate = expiraAtRaw.length > 0 ? new Date(expiraAtRaw) : defaultExpiraAt;
  const isExpiraAtValid = Number.isFinite(expiraAtDate.getTime());

  if (!isExpiraAtValid) {
    errors.push("expira_at debe ser una fecha válida");
  } else if (expiraAtDate <= new Date()) {
    errors.push("expira_at debe ser una fecha futura");
  }

  const normalizedItems = items.map((item) => ({
    ...item,
    line_total: Number((Number(item.unidades) * Number(item.precio_unitario)).toFixed(2)),
  }));

  return {
    ok: errors.length === 0,
    errors,
    value:
      errors.length === 0
        ? {
            reparacion_id: reparacionId,
            propuesta_alquiler_id: propuestaAlquilerId,
            items: normalizedItems,
            iva_rate: ivaRate,
            condiciones,
            expira_at: expiraAtDate.toISOString(),
            payer_type: payerType,
            charge_reason: chargeReason,
            coverage_decision: coverageDecision,
            coverage_reason: coverageReason,
            contract_type: String(body?.contract_type ?? "").trim().toUpperCase() || null,
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

export function validateSignPresupuestoTecarralBody(body) {
  const signerName = normalizeNullableText(body?.signer_name);
  const signatureBase64 = normalizeNullableText(body?.signature_base64);
  const errors = [];

  if (!signerName) {
    errors.push("signer_name es obligatorio");
  }

  if (!signatureBase64) {
    errors.push("signature_base64 es obligatoria");
  }

  return {
    ok: errors.length === 0,
    errors,
    value: errors.length === 0 ? { signer_name: signerName, signature_base64: signatureBase64 } : null,
  };
}
