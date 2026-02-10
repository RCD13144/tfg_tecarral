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