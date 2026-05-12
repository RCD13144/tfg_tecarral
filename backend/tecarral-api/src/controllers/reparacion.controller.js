import * as reparacionService from "../services/reparacion.service.js";
import { parseId, validateId } from "../schemas/common.schema.js";
import {validateMarcarReparacionTerminadaBody} from "../schemas/reparacion.schema.js"

export async function getReparaciones(req, res) {
  try {
    const idUser = Number(req.user?.id_user);
    const role = req.user?.role;

    if (!validateId(idUser)) {
      res.status(401).json({ error: "Usuario no autenticado" });
      return;
    }

    const reparaciones = await reparacionService.getReparacionesActivas(idUser, role);
    res.status(200).json(reparaciones);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error", meta: e.meta });
  }
}

export async function asignarAveria(req, res) {
  try {
    const idReparacion = parseId(req.params.id);

    const okReparacion = validateId(idReparacion);

    if (!okReparacion) {
      res.status(400).json({ error: "Id de reparación inválido" });
      return;
    }

    const idUserAsignado = parseId(req.body?.id_user);

    const okUser = validateId(idUserAsignado);

    if (!okUser) {
      res.status(400).json({ error: "Id de usuario asignable inválido" });
      return;
    }

    const result = await reparacionService.asignarAveriaIntoDB(idReparacion, idUserAsignado);

    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode ?? 500).json({ error: e.message ?? "Error", meta: e.meta });
  }
}

export async function marcarReparacionTerminada(req, res) {
  try {
    const idReparacion = parseId(req.params.id);

    if (!validateId(idReparacion)) {
      res.status(400).json({
        error: "Id de reparación inválido",
      });
      return;
    }

    const bodyValidation =
      validateMarcarReparacionTerminadaBody(req.body);

    if (!bodyValidation.ok) {
      res.status(400).json({
        error: "Body inválido",
        details: bodyValidation.errors,
      });
      return;
    }

    const result =
      await reparacionService.marcarReparacionTerminadaIntoDB(
        idReparacion,
        bodyValidation.value.solucion_aplicada
      );

    res.status(200).json(result);

  } catch (e) {
    res.status(e.statusCode ?? 500).json({
      error: e.message ?? "Error",
      meta: e.meta,
    });
  }
}
