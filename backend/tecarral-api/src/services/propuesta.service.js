import { generatePublicToken } from "../utils/publicToken.js";
import {crearPropuestaTx , findById, updatePropuestaPendingById, deletePropuestaById} from "../repositories/propuesta.repository.js";

const DEFAULT_EXPIRES_HOURS = 48;

export async function crearPropuesta(data) {
  const { token, tokenHash } = generatePublicToken();

  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRES_HOURS * 60 * 60 * 1000);

  const propuesta = await crearPropuestaTx({
    ...data,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return {
    ...propuesta,
    public_url: `/public/propuestas/${token}`,
  };
}

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export async function editarPropuesta(id, patch) {
  const propuesta = await findById(id);

  if (!propuesta) {
    throw createHttpError(404, "Propuesta no encontrada");
  }

  const expired = new Date(propuesta.expires_at).getTime() <= Date.now();
  if (expired) {
    throw createHttpError(409, "No se puede editar: propuesta expirada");
  }

  if (propuesta.estado !== "PENDING") {
    throw createHttpError(409, "No se puede editar: propuesta no está en PENDING");
  }

  const finalFechaInicio = patch.fecha_inicio ?? propuesta.fecha_inicio;
  const finalFechaFin = patch.fecha_fin ?? propuesta.fecha_fin;

  const ini = new Date(`${finalFechaInicio}T00:00:00Z`).getTime();
  const fin = new Date(`${finalFechaFin}T00:00:00Z`).getTime();
  if (fin <= ini) {
    throw createHttpError(400, "fecha_fin debe ser mayor que fecha_inicio");
  }

  const updated = await updatePropuestaPendingById(id, patch);
  return updated;
}

export async function deletePropuestaFromDB(id){
  const propuesta = deletePropuestaById(id);
  return propuesta;
}

