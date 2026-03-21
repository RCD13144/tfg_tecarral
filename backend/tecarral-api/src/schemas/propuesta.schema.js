// schemas/propuesta.schema.js

function toTrimmedText(v) {
  return String(v ?? "").trim();
}

function isValidEmail(email) {
  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return patron.test(email);
}

function isValidSpanishPhone(phone) {
  const patron = /^(?:\+34|0034|34)?[ -]?[6789]\d{2}[ -]?\d{2}[ -]?\d{2}[ -]?\d{2}$/;
  return patron.test(phone);
}

function isValidISODateTime(value) {
  const s = toTrimmedText(value);
  
  const patron =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+\-]\d{2}:\d{2})?$/;

  if (!patron.test(s)) {
    return false;
  }

  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function toEpochMs(iso) {
  return new Date(toTrimmedText(iso)).getTime();
}

export function validatePropuestaCreate(body) {
  const errors = [];

  const idMaquina = Number(toTrimmedText(body?.id_maquina));
  if (!Number.isInteger(idMaquina) || idMaquina <= 0) errors.push("id_maquina inválido");

  const cliente = toTrimmedText(body?.cliente);
  if (cliente.length === 0) errors.push("cliente requerido");

  const emailCliente = toTrimmedText(body?.email_cliente);
  if (!isValidEmail(emailCliente)) errors.push("email_cliente inválido");

  const telefono = toTrimmedText(body?.telefono);
  if (!isValidSpanishPhone(telefono)) errors.push("telefono inválido");

  const direccion = toTrimmedText(body?.direccion);
  const cp = toTrimmedText(body?.cp);
  const poblacion = toTrimmedText(body?.poblacion);

  if (direccion.length === 0) errors.push("direccion requerida");
  if (cp.length === 0) errors.push("cp requerido");
  if (poblacion.length === 0) errors.push("poblacion requerida");

  const precio = Number(toTrimmedText(body?.precio));
  if (!Number.isFinite(precio) || precio <= 0) errors.push("precio inválido");

  const fechaInicio = toTrimmedText(body?.fecha_inicio);
  const fechaFin = toTrimmedText(body?.fecha_fin);

  const fechaInicioOk = isValidISODateTime(fechaInicio);
  const fechaFinOk = isValidISODateTime(fechaFin);

  if (!fechaInicioOk) errors.push("fecha_inicio inválida (ISO: YYYY-MM-DDTHH:mm[:ss][Z|+hh:mm])");
  if (!fechaFinOk) errors.push("fecha_fin inválida (ISO: YYYY-MM-DDTHH:mm[:ss][Z|+hh:mm])");

  if (fechaInicioOk && fechaFinOk) {
    const ini = toEpochMs(fechaInicio);
    const fin = toEpochMs(fechaFin);

    if (fin <= ini) {
      errors.push("fecha_fin debe ser mayor que fecha_inicio");
    }
  }

  const ok = errors.length === 0;

  const data = ok
    ? {
        id_maquina: idMaquina,
        cliente,
        email_cliente: emailCliente,
        telefono,
        direccion,
        cp,
        poblacion,
        precio,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      }
    : null;

  return { ok, data, errors };
}

export function validatePropuestaUpdate(body) {
  const errors = [];
  const data = {};

  const allowedKeys = [
    "cliente",
    "email_cliente",
    "telefono",
    "direccion",
    "cp",
    "poblacion",
    "precio",
    "fecha_inicio",
    "fecha_fin",
  ];

  const incomingKeys = Object.keys(body ?? {});
  for (let i = 0; i < incomingKeys.length; i += 1) {
    const k = incomingKeys[i];
    if (!allowedKeys.includes(k)) {
      errors.push(`Campo no editable: ${k}`);
    }
  }

  if (incomingKeys.length === 0) {
    errors.push("Body vacío: no hay campos para editar");
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "cliente")) {
    const cliente = toTrimmedText(body?.cliente);
    if (cliente.length === 0) errors.push("cliente inválido");
    else data.cliente = cliente;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "email_cliente")) {
    const email = toTrimmedText(body?.email_cliente);
    if (!isValidEmail(email)) errors.push("email_cliente inválido");
    else data.email_cliente = email;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "telefono")) {
    const tel = toTrimmedText(body?.telefono);
    if (!isValidSpanishPhone(tel)) errors.push("telefono inválido");
    else data.telefono = tel;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "direccion")) {
    const direccion = toTrimmedText(body?.direccion);
    if (direccion.length === 0) errors.push("direccion inválida");
    else data.direccion = direccion;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "cp")) {
    const cp = toTrimmedText(body?.cp);
    if (cp.length === 0) errors.push("cp inválido");
    else data.cp = cp;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "poblacion")) {
    const poblacion = toTrimmedText(body?.poblacion);
    if (poblacion.length === 0) errors.push("poblacion inválida");
    else data.poblacion = poblacion;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "precio")) {
    const precio = Number(toTrimmedText(body?.precio));
    if (!Number.isFinite(precio) || precio <= 0) errors.push("precio inválido");
    else data.precio = precio;
  }

  let fechaInicio = null;
  let fechaFin = null;

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "fecha_inicio")) {
    const fi = toTrimmedText(body?.fecha_inicio);
    if (!isValidISODateTime(fi)) errors.push("fecha_inicio inválida (ISO datetime)");
    else {
      data.fecha_inicio = fi;
      fechaInicio = fi;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "fecha_fin")) {
    const ff = toTrimmedText(body?.fecha_fin);
    if (!isValidISODateTime(ff)) errors.push("fecha_fin inválida (ISO datetime)");
    else {
      data.fecha_fin = ff;
      fechaFin = ff;
    }
  }

  if (fechaInicio !== null && fechaFin !== null) {
    const ini = toEpochMs(fechaInicio);
    const fin = toEpochMs(fechaFin);

    if (fin <= ini) {
      errors.push("fecha_fin debe ser mayor que fecha_inicio");
    }
  }

  const ok = errors.length === 0;
  return { ok, data: ok ? data : null, errors };
}

export function validateExpireQuery(query) {
  const errors = [];

  let limit = 500;

  if (query?.limit !== undefined) {
    const n = Number(String(query.limit).trim());
    const ok = Number.isInteger(n) && n > 0 && n <= 5000;

    if (!ok) {
      errors.push("limit inválido (1..5000)");
    } else {
      limit = n;
    }
  }

  const ok = errors.length === 0;
  return { ok, data: ok ? { limit } : null, errors };
}
