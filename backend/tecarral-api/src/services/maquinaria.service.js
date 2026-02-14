import { getAllMaquinaria, getMaquinariaByIdFromDB, findMaquinaria, suggestModelo, 
    suggestMarca, suggestSubtipo, suggestNS, suggestMotor, suggestTipo, crearMaquina, 
    editarMaquina, deleteMaquina, marcarEntregadaAtomic, marcarRecibidaEnBaseTx, marcarTransitoPorAlquilerTerminadoTx, 
moverEntreBasesTx} from "../repositories/maquina.repository.js";
import {validateUbicacionTipoDestino, validateDestinoBase,  isUbicacionTextUsable} from "../schemas/maquina.schema.js"

export async function getMaquinaria(filters = {}) {
    const hasFilters = Object.values(filters).some(v => v !== undefined);

    if (hasFilters) {
        const maquinas = await findMaquinaria(filters);
        return maquinas;
    }

    const maquinas = await getAllMaquinaria();
    return maquinas;
}

export async function suggestModeloFromDB(text) {
    const maquina = await suggestModelo(text);
    return maquina;
}

export async function suggestMarcaFromDB(text) {
    const maquina = await suggestMarca(text);
    return maquina;
}

export async function suggestSubtipoFromDB(text) {
    const maquina = await suggestSubtipo(text);
    return maquina;
}

export async function suggestNSfromDB(text) {
    const maquina = await suggestNS(text);
    return maquina;
}

export async function suggestMotorfromDB(text) {
    const maquina = await suggestMotor(text);
    return maquina;
}

export async function suggestTipofromDB(text) {
    const maquina = await suggestTipo(text);
    return maquina;
}

export async function crearMaquinaIntoDB(subtipo, marca, motor, modelo, ns, seguro, num_poliza, alquilada, ubicacion, observaciones, tipo, ubicacion_tipo){
    const maquina = await crearMaquina(subtipo, marca, motor, modelo, ns, seguro, num_poliza, alquilada, ubicacion, observaciones, tipo, ubicacion_tipo);
    return maquina;
}

export async function editarMaquinariaByIdFromDB(id, patch) {
    const maquina = await editarMaquina(id, patch);
    return maquina;
}

export async function deleteMaquinariaByIdFromDB(id){
    const maquina = await deleteMaquina(id);
    return maquina;
}

export async function markDelivered(idMaquina) {
  const result = await marcarEntregadaAtomic(idMaquina);
  return result;
}

export async function marcarRecibidaEnBase(idMaquina, ubicacionTipo) {
  const okUbicacion = validateUbicacionTipoDestino(ubicacionTipo);

  if (!okUbicacion) {
    const err = new Error("Ubicación destino inválida");
    err.statusCode = 400;
    throw err;
  }

  const result = await marcarRecibidaEnBaseTx(idMaquina, ubicacionTipo);
  return result;
}

export async function recomputeLogisticsByEndedRentals(options) {
  const limit = options?.limit ?? 500;
  return marcarTransitoPorAlquilerTerminadoTx({ limit });
}

export async function moverEntreBases(idMaquina, ubicacionTipo) {
  const ok = validateDestinoBase(ubicacionTipo);

  if (!ok) {
    const err = new Error("Destino inválido");
    err.statusCode = 400;
    throw err;
  }

  const result = await moverEntreBasesTx(idMaquina, ubicacionTipo);
  return result;
}

function buildMapsLinks(ubicacionText) {
  const raw = String(ubicacionText ?? "").trim();
  const q = encodeURIComponent(raw);

  const geo = `geo:0,0?q=${q}`;

  const google = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const apple = `http://maps.apple.com/?q=${q}`;
  const waze = `https://waze.com/ul?q=${q}&navigate=yes`;

  return { query: raw, geo, google, apple, waze };
}

export async function getMaquinaById(idMaquina) {
  const maquina = await getMaquinariaByIdFromDB(idMaquina);

  if (maquina === null) {
    return null;
  }

  const hasUbicacion = isUbicacionTextUsable(maquina.ubicacion);
  const maps = hasUbicacion ? buildMapsLinks(maquina.ubicacion) : null;

  return {
    ...maquina,
    maps,
  };
}