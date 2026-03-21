import * as presupuestoReparacionService from "../services/presupuestoReparacion.service.js";
import {
  validateCreatePresupuestoReparacionBody,
  validatePresupuestoReparacionIdParam
} from "../schemas/presupuestoReparacion.schema.js";

function sendError(res, error) {
  res.status(error.statusCode ?? 500).json({
    message: error.message ?? "Error interno del servidor",
  });
}

export async function crearPresupuestoReparacion(req, res) {
  try {
    const validation = validateCreatePresupuestoReparacionBody(req.body);

    if (!validation.ok) {
      res.status(400).json({
        message: "Body inválido",
        errors: validation.errors,
      });
      return;
    }

    const result =
      await presupuestoReparacionService.crearPresupuestoReparacionIntoDB(
        validation.value
      );

    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function getPresupuestoReparacionById(req, res) {
  try {
    const validation = validatePresupuestoReparacionIdParam(req.params.id);

    if (!validation.ok) {
      res.status(400).json({
        message: "Id inválido",
        errors: validation.errors,
      });
      return;
    }

    const result =
      await presupuestoReparacionService.getPresupuestoReparacionById(
        validation.value
      );

    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
}
