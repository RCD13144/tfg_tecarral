import { normalize } from "../utils/normalize.js";
import { UBICACION_TIPO } from "../constants/ubicacionesTipo.js";
import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";

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
    "averiada grave"
].map(normalize));

const MAINTENANCE_CANON = {
    ok: "OK",
    averiada: "AVERIADA",
    "averiada grave": "AVERIADA_GRAVE"
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
  const v = String(value ?? "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  const v = String(value ?? "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return v === UBICACION_TIPO_DESTINO.TALLER || v === UBICACION_TIPO_DESTINO.ALMACEN;
}

export function isUbicacionTextUsable(value) {
  const t = String(value ?? "").trim();
  return t.length > 0 && t.toLowerCase() !== "desconocida";
}

function httpError(status, message, meta) {
  const err = new Error(message);
  err.status = status;
  err.meta = meta;
  return err;
}

function parsePositiveInt(value, fieldName) {
  const num = Number(value);

  if (!Number.isInteger(num) || num <= 0) {
    throw httpError(400, `${fieldName} inválido`, { [fieldName]: value });
  }

  return num;
}

export function parseCambiarMaintenanceStatus(req) {
  const id_maquina = parsePositiveInt(req.params.id, "id_maquina");
  const maintenance_status = req.body?.maintenance_status;

  const isAllowed =
    maintenance_status === MAINTENANCE_STATUS.AVERIADA ||
    maintenance_status === MAINTENANCE_STATUS.AVERIADA_GRAVE;

  if (!isAllowed) {
    throw httpError(400, "maintenance_status inválido", { maintenance_status });
  }

  return { id_maquina, maintenance_status };
}

export function validateMaintenanceStatusPatch(body) {
  const status = body?.maintenance_status;

  const ok =
    status === MAINTENANCE_STATUS.AVERIADA ||
    status === MAINTENANCE_STATUS.AVERIADA_GRAVE;

  return ok;
}

export function validateAbrirIncidenciaBody(body) {
  const status = body?.maintenance_status;
  const propuestaId = Number(body?.propuesta_alquiler_id);

  const okStatus =
    status === MAINTENANCE_STATUS.AVERIADA ||
    status === MAINTENANCE_STATUS.AVERIADA_GRAVE;

  const okPropuesta = Number.isInteger(propuestaId) && propuestaId > 0;

  const comentario = body?.comentario;
  const okComentario =
    comentario === undefined ||
    comentario === null ||
    (typeof comentario === "string" && comentario.length <= 2000);

  return okStatus && okPropuesta && okComentario;
}