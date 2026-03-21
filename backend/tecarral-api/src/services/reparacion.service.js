import { asignarAveriaTx, marcarReparacionTerminadaTx } from "../repositories/reparacion.repository.js";
import { parseId, validateId } from "../schemas/common.schema.js";

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
  solucionAplicada
) {
  if (!Number.isInteger(idReparacion) || idReparacion <= 0) {
    const err = new Error("ID de reparación inválido");
    err.statusCode = 400;
    throw err;
  }

  const result = await marcarReparacionTerminadaTx(
    idReparacion,
    solucionAplicada
  );

  return result;
}