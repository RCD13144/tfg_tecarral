import {
  asignarAveriaTx,
  marcarReparacionTerminadaTx,
  findActiveReparaciones,
  findActiveRepairByMachineId,
} from "../repositories/reparacion.repository.js";
import { parseId, validateId } from "../schemas/common.schema.js";

export async function getReparacionesActivas(idUser, role) {
  const isAdmin = String(role ?? "").trim().toLowerCase() === "admin";

  return findActiveReparaciones({
    userId: idUser,
    isAdmin,
  });
}

export async function getActiveRepairByMachineId(idMaquina) {
  return findActiveRepairByMachineId(idMaquina);
}

export async function asignarAveriaIntoDB(idReparacion, idUser) {
  const repId = parseId(idReparacion);
  const userId = parseId(idUser);

  const okRep = validateId(repId);
  const okUser = validateId(userId);

  if (!okRep) {
    const err = new Error("Id de reparación inválido");
    err.statusCode = 400;
    throw err;
  }

  if (!okUser) {
    const err = new Error("Id de usuario asignable inválido");
    err.statusCode = 400;
    throw err;
  }

  const result = await asignarAveriaTx({
    idReparacion: repId,
    idUserAsignado: userId,
  });

  return result;
}

export async function marcarReparacionTerminadaIntoDB(
  idReparacion,
  solucionAplicada,
  actorUserId,
  actorRole
) {
  if (!Number.isInteger(idReparacion) || idReparacion <= 0) {
    const err = new Error("ID de reparación inválido");
    err.statusCode = 400;
    throw err;
  }

  if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
    const err = new Error("Usuario no autenticado");
    err.statusCode = 401;
    throw err;
  }

  const result = await marcarReparacionTerminadaTx(
    idReparacion,
    solucionAplicada,
    {
      actorUserId,
      actorRole,
    }
  );

  return result;
}
