import {
  isSimpleEmailValid,
  isSimplePhoneValid,
  toTrimmedText,
} from "./validation.schema.js";

function isValidISODateTime(value) {
  const text = toTrimmedText(value);

  const pattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+\-]\d{2}:\d{2})?$/;

  if (!pattern.test(text)) {
    return false;
  }

  const date = new Date(text);
  return !Number.isNaN(date.getTime());
}

function toEpochMs(iso) {
  return new Date(toTrimmedText(iso)).getTime();
}

export function validatePropuestaCreate(body) {
  const errors = [];

  const idMaquina = Number(toTrimmedText(body?.id_maquina));
  if (!Number.isInteger(idMaquina) || idMaquina <= 0) errors.push("id_maquina invalido");

  const cliente = toTrimmedText(body?.cliente);
  if (cliente.length === 0) errors.push("cliente requerido");

  const emailCliente = toTrimmedText(body?.email_cliente);
  if (!isSimpleEmailValid(emailCliente)) errors.push("email_cliente invalido");

  const telefono = toTrimmedText(body?.telefono);
  if (!isSimplePhoneValid(telefono)) errors.push("telefono invalido");

  const direccion = toTrimmedText(body?.direccion);
  const cp = toTrimmedText(body?.cp);
  const poblacion = toTrimmedText(body?.poblacion);

  if (direccion.length === 0) errors.push("direccion requerida");
  if (cp.length === 0) errors.push("cp requerido");
  if (poblacion.length === 0) errors.push("poblacion requerida");

  const precio = Number(toTrimmedText(body?.precio));
  if (!Number.isFinite(precio) || precio <= 0) errors.push("precio invalido");

  const fechaInicio = toTrimmedText(body?.fecha_inicio);
  const fechaFin = toTrimmedText(body?.fecha_fin);

  const fechaInicioOk = isValidISODateTime(fechaInicio);
  const fechaFinOk = isValidISODateTime(fechaFin);

  if (!fechaInicioOk) errors.push("fecha_inicio invalida (ISO: YYYY-MM-DDTHH:mm[:ss][Z|+hh:mm])");
  if (!fechaFinOk) errors.push("fecha_fin invalida (ISO: YYYY-MM-DDTHH:mm[:ss][Z|+hh:mm])");

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
    const key = incomingKeys[i];
    if (!allowedKeys.includes(key)) {
      errors.push(`Campo no editable: ${key}`);
    }
  }

  if (incomingKeys.length === 0) {
    errors.push("Body vacio: no hay campos para editar");
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "cliente")) {
    const cliente = toTrimmedText(body?.cliente);
    if (cliente.length === 0) errors.push("cliente invalido");
    else data.cliente = cliente;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "email_cliente")) {
    const email = toTrimmedText(body?.email_cliente);
    if (!isSimpleEmailValid(email)) errors.push("email_cliente invalido");
    else data.email_cliente = email;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "telefono")) {
    const telefono = toTrimmedText(body?.telefono);
    if (!isSimplePhoneValid(telefono)) errors.push("telefono invalido");
    else data.telefono = telefono;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "direccion")) {
    const direccion = toTrimmedText(body?.direccion);
    if (direccion.length === 0) errors.push("direccion invalida");
    else data.direccion = direccion;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "cp")) {
    const cp = toTrimmedText(body?.cp);
    if (cp.length === 0) errors.push("cp invalido");
    else data.cp = cp;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "poblacion")) {
    const poblacion = toTrimmedText(body?.poblacion);
    if (poblacion.length === 0) errors.push("poblacion invalida");
    else data.poblacion = poblacion;
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "precio")) {
    const precio = Number(toTrimmedText(body?.precio));
    if (!Number.isFinite(precio) || precio <= 0) errors.push("precio invalido");
    else data.precio = precio;
  }

  let fechaInicio = null;
  let fechaFin = null;

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "fecha_inicio")) {
    const nextFechaInicio = toTrimmedText(body?.fecha_inicio);
    if (!isValidISODateTime(nextFechaInicio)) {
      errors.push("fecha_inicio invalida (ISO datetime)");
    } else {
      data.fecha_inicio = nextFechaInicio;
      fechaInicio = nextFechaInicio;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, "fecha_fin")) {
    const nextFechaFin = toTrimmedText(body?.fecha_fin);
    if (!isValidISODateTime(nextFechaFin)) {
      errors.push("fecha_fin invalida (ISO datetime)");
    } else {
      data.fecha_fin = nextFechaFin;
      fechaFin = nextFechaFin;
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
    const nextLimit = Number(String(query.limit).trim());
    const ok = Number.isInteger(nextLimit) && nextLimit > 0 && nextLimit <= 5000;

    if (!ok) {
      errors.push("limit invalido (1..5000)");
    } else {
      limit = nextLimit;
    }
  }

  const ok = errors.length === 0;
  return { ok, data: ok ? { limit } : null, errors };
}
