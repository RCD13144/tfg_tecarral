import {
  getAllMaquinaria,
  getMaquinariaByIdFromDB,
  findMaquinaria,
  enforceTransitLogisticsConsistency,
  reconcileEndedRentalsTransit,
  suggestModelo,
  suggestMarca,
  suggestSubtipo,
  suggestNS,
  suggestMotor,
  suggestTipo,
  suggestIdMaquina,
  crearMaquina,
  editarMaquina,
  deleteMaquina,
  getMaquinaByIdForImageUpdate,
  marcarEntregadaAtomic,
  marcarRecibidaEnBaseTx,
  marcarTransitoPorAlquilerTerminadoTx,
  moverEntreBasesTx,
  getMaintenanceStatusById,
  updateMachineImagePath,
  updateMaintenanceStatus,
  abrirIncidenciaTx,
  escalarAveriaGraveTx
} from "../repositories/maquina.repository.js";
import { getActiveRepairByMachineId } from "./reparacion.service.js";
import { buildPublicImageUrl, storeMachineImage } from "../utils/machine-image-storage.js";

import {
  validateUbicacionTipoDestino,
  validateDestinoBase,
  isUbicacionTextUsable,
} from "../schemas/maquina.schema.js";

import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";

function buildMapsLinks(ubicacionText) {
  const raw = String(ubicacionText ?? "").trim();
  const q = encodeURIComponent(raw);

  const geo = `geo:0,0?q=${q}`;

  const google = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const apple = `http://maps.apple.com/?q=${q}`;
  const waze = `https://waze.com/ul?q=${q}&navigate=yes`;

  return { query: raw, geo, google, apple, waze };
}

function isMaintenanceTransitionAllowed(current, next) {
  const okToAveriada = current === MAINTENANCE_STATUS.OK && next === MAINTENANCE_STATUS.AVERIADA;
  const okToGrave =
    current === MAINTENANCE_STATUS.OK && next === MAINTENANCE_STATUS.AVERIADA_GRAVE;
  const averiadaToGrave =
    current === MAINTENANCE_STATUS.AVERIADA && next === MAINTENANCE_STATUS.AVERIADA_GRAVE;

  return okToAveriada || okToGrave || averiadaToGrave;
}

function withMachineImageUrl(machine) {
  if (!machine) {
    return machine;
  }

  return {
    ...machine,
    image_url: buildPublicImageUrl(machine.image_path),
  };
}

export async function getMaquinaria(filters = {}) {
  await reconcileEndedRentalsTransit();
  await enforceTransitLogisticsConsistency();

  const hasFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined;
  });

  if (hasFilters) {
    const maquinas = await findMaquinaria(filters);
    return maquinas.map(withMachineImageUrl);
  }

  const maquinas = await getAllMaquinaria();
  return maquinas.map(withMachineImageUrl);
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

export async function suggestIdMaquinaFromDB(text) {
  const maquina = await suggestIdMaquina(text);
  return maquina;
}

export async function crearMaquinaIntoDB(data) {
  const maquina = await crearMaquina(data);
  return withMachineImageUrl(maquina);
}

export async function editarMaquinariaByIdFromDB(id, patch) {
  const maquina = await editarMaquina(id, patch);
  return withMachineImageUrl(maquina);
}

export async function deleteMaquinariaByIdFromDB(id) {
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

export async function getMaquinaById(idMaquina) {
  await reconcileEndedRentalsTransit(idMaquina);
  await enforceTransitLogisticsConsistency(idMaquina);

  const maquina = await getMaquinariaByIdFromDB(idMaquina);

  if (maquina === null) {
    return null;
  }

  const hasUbicacion = isUbicacionTextUsable(maquina.ubicacion);
  const maps = hasUbicacion ? buildMapsLinks(maquina.ubicacion) : null;
  const activeRepair = await getActiveRepairByMachineId(idMaquina);

  return {
    ...maquina,
    image_url: buildPublicImageUrl(maquina.image_path),
    maps,
    active_repair: activeRepair,
  };
}

export async function uploadMachineImage(idMaquina, { buffer, fileName, mimeType }) {
  const maquina = await getMaquinaByIdForImageUpdate(idMaquina);

  if (maquina === null) {
    const err = new Error("Máquina no encontrada");
    err.statusCode = 404;
    throw err;
  }

  const imagePath = await storeMachineImage({
    idMaquina,
    buffer,
    fileName,
    mimeType,
    previousImagePath: maquina.image_path,
  });

  await updateMachineImagePath(idMaquina, imagePath, true);

  return getMaquinaById(idMaquina);
}

export async function cambiarMaintenanceStatus(idMaquina, maintenanceStatus) {
  const current = await getMaintenanceStatusById(idMaquina);

  if (current === null) {
    const err = new Error("Máquina no encontrada");
    err.statusCode = 404;
    throw err;
  }

  const allowed = isMaintenanceTransitionAllowed(current, maintenanceStatus);

  if (!allowed) {
    const err = new Error("Transición de maintenance_status no permitida");
    err.statusCode = 409;
    err.meta = { from: current, to: maintenanceStatus };
    throw err;
  }

  await updateMaintenanceStatus(idMaquina, maintenanceStatus);

  return {
    id_maquina: idMaquina,
    maintenance_status: maintenanceStatus,
  };
}

export async function abrirIncidenciaIntoDB(
  idMaquina,
  maintenanceStatus,
  propuestaAlquilerId,
  comentario,
  idUser
) {
  const okStatus =
    maintenanceStatus === MAINTENANCE_STATUS.AVERIADA ||
    maintenanceStatus === MAINTENANCE_STATUS.AVERIADA_GRAVE;

  if (!okStatus) {
    const err = new Error("maintenance_status inválido");
    err.statusCode = 400;
    throw err;
  }

  if (!Number.isInteger(idUser) || idUser <= 0) {
    const err = new Error("No autenticado");
    err.statusCode = 401;
    throw err;
  }

  if (!Number.isInteger(propuestaAlquilerId) || propuestaAlquilerId <= 0) {
    const err = new Error("propuesta_alquiler_id inválido");
    err.statusCode = 400;
    throw err;
  }

  const result = await abrirIncidenciaTx({
    idMaquina,
    maintenanceStatus,
    propuestaAlquilerId,
    comentario: comentario ?? null,
    idUser, 
  });

  return result;
}

export async function escalarAveriaGraveIntoDB(idMaquina, comentario) {
  return escalarAveriaGraveTx({ idMaquina, comentario: comentario ?? null });
}
