import { normalize } from "../utils/normalize.js";
import { UBICACION_TIPO } from "../constants/ubicacionesTipo.js";

export function validateId(idParam) {
    const id = Number(idParam);
    const ok = Number.isInteger(id) && id > 0;
    return ok;
}

const TIPOS = new Set(["elevacion", "limpieza"].map(normalize));

const SUBTIPOS = {
    elevacion: new Set([
        "Carretilla elevad.",
        "Plataforma tijera",
        "Plataforma artic.",
        "Retráctil",
        "Transpaleta eléctr.",
        "Apilador",
        "Transpaleta manual",
        "Preparapedidos"
    ].map(normalize)),

    limpieza: new Set([
        "Fregadora",
        "Barredora",
        "Criógena",
        "Hidrolimpiadora",
        "Aspirador",
        "Vaporeta",
        "Limpiamoquetas",
        "Pulidora"
    ].map(normalize)),
};

const ALL_SUBTIPOS = new Set([
    ...SUBTIPOS.elevacion,
    ...SUBTIPOS.limpieza
]);

export function validateTipoMaquina(tipo) {
    const t = normalize(tipo);
    const ok = t !== undefined && TIPOS.has(t);
    return ok;
}

export function validateSubtipoMaquina(subtipo) {
    const s = normalize(subtipo);
    const ok = s !== undefined && ALL_SUBTIPOS.has(s);
    return ok;
}

const AVAILABILITIES = new Set(["DISPONIBLE", "SOLICITADA", "ALQUILADA"]);

export function validateAvailability(value) {
    const v = String(value).toUpperCase().trim();
    const ok = AVAILABILITIES.has(v);
    return ok;
}

const ubicaciones = new Set(["taller", "almacen", "almacén", "cliente", "desconocida", "transito", "tránsito"]);

export function validateUbicacionType(ubicacion_type) {
    const u = normalize(ubicacion_type);
    const ok = u !== undefined && ubicaciones.has(u);
    return ok;
}

const motores = new Set(["diesel", "electrica", "semi electrica", "manual"]);

export function validateMotorType(motor) {
    const m = normalize(motor);
    const ok = m !== undefined && motores.has(m);
    return ok;
}

const UBICACION_TIPO_CANON = {
    taller: "TALLER",
    almacen: "ALMACEN",
    cliente: "CLIENTE",
    desconocida: "DESCONOCIDA",
    transito: "TRANSITO",
};

export function canonicalUbicacionType(value) {
    const key = normalize(value);
    return key === undefined ? undefined : UBICACION_TIPO_CANON[key];
}

const MOTOR_CANON = {
    diesel: "Diésel",
    electrica: "Eléctrica",
    manual: "Manual",
    "semi electrica": "Semi eléctrica",
};

export function canonicalMotor(value) {
    const key = normalize(value);
    return key === undefined ? undefined : MOTOR_CANON[key];
}

const LOGISTICS_STATUS = new Set(["EN_CAMINO", "ENTREGADA"]);

export function validateLogisticsStatus(value) {
    const v = String(value ?? "").trim().toUpperCase();
    const ok = LOGISTICS_STATUS.has(v);
    return ok;
}

export function canonicalLogisticsStatus(value) {
    const v = String(value ?? "").trim().toUpperCase();
    return LOGISTICS_STATUS.has(v) ? v : undefined;
}

const MAINTENANCE_KEYS = new Set([
    "ok",
    "averiada",
    "en taller"
].map(normalize));

const MAINTENANCE_CANON = {
    ok: "OK",
    averiada: "AVERIADA",
    "en taller": "EN_TALLER"
};

export function validateMaintenanceStatus(value) {
    const key = normalize(value);
    const ok = key !== undefined && MAINTENANCE_KEYS.has(key);
    return ok;
}

export function canonicalMaintenanceStatus(value) {
    const key = normalize(value);
    return key === undefined ? undefined : MAINTENANCE_CANON[key];
}

export function validateTallerLocationBody(body) {
    const errors = [];
    const data = {};

    const hasBody = body !== undefined && body !== null && typeof body === "object";

    if (!hasBody) {
        return { ok: true, data: { ubicacion_ref_id: null, ubicacion: null }, errors: [] };
    }

    let refId = null;

    if (Object.prototype.hasOwnProperty.call(body, "ubicacion_ref_id")) {
        const n = Number(String(body.ubicacion_ref_id ?? "").trim());
        const ok = Number.isInteger(n) && n > 0;

        if (!ok) errors.push("ubicacion_ref_id inválido");
        else refId = n;
    }

    let ubicacionText = null;

    if (Object.prototype.hasOwnProperty.call(body, "ubicacion")) {
        const t = String(body.ubicacion ?? "").trim();
        if (t.length === 0) errors.push("ubicacion no puede ser vacío");
        else ubicacionText = t;
    }

    const ok = errors.length === 0;

    data.ubicacion_ref_id = refId;
    data.ubicacion = ubicacionText;

    return { ok, data: ok ? data : null, errors };
}


export function validateUbicacionTipoDestino(value) {
  const v = String(value ?? "").trim().toUpperCase();
  return v === UBICACION_TIPO.TALLER || v === UBICACION_TIPO.ALMACEN;
}

export function validateRecomputeQuery(query) {
  const errors = [];
  let limit = 500;

  if (query?.limit !== undefined) {
    const n = Number(String(query.limit).trim());
    const ok = Number.isInteger(n) && n > 0 && n <= 5000;

    if (!ok) errors.push("limit inválido (1..5000)");
    else limit = n;
  }

  const ok = errors.length === 0;
  return { ok, data: ok ? { limit } : null, errors };
}

export const UBICACION_TIPO_DESTINO = Object.freeze({
  TALLER: "TALLER",
  ALMACEN: "ALMACEN",
});

export function validateDestinoBase(value) {
  const v = String(value ?? "").trim().toUpperCase();
  return v === UBICACION_TIPO_DESTINO.TALLER || v === UBICACION_TIPO_DESTINO.ALMACEN;
}

export function normalizeDestinoBase(value) {
  return String(value ?? "").trim().toUpperCase();
}

export function isUbicacionTextUsable(value) {
  const t = String(value ?? "").trim();
  return t.length > 0 && t.toLowerCase() !== "desconocida";
}

