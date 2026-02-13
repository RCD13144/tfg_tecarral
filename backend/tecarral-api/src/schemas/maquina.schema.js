import { normalize } from "../utils/normalize.js";

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

export function validateUbicacionType(ubicacion_type){
    const u = normalize(ubicacion_type); 
    const ok = u !== undefined && ubicaciones.has(u);
    return ok;
}

const motores = new Set(["diesel", "electrica", "semi electrica", "manual"]);

export function validateMotorType(motor){
    const m = normalize(motor); 
    const ok =  m !== undefined && motores.has(m);
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
