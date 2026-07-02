import * as presupuestoReparacionService from "../services/presupuestoReparacion.service.js";
import {
  validateCreatePresupuestoReparacionBody,
  validatePresupuestoReparacionIdParam,
  validateSignPresupuestoTecarralBody,
} from "../schemas/presupuestoReparacion.schema.js";

function sendError(res, error) {
  const message = error.message ?? "Error interno del servidor";
  res.status(error.statusCode ?? 500).json({
    error: message,
    message,
  });
}

function sendValidationError(res, message, errors) {
  res.status(400).json({
    error: message,
    message,
    errors,
  });
}

export async function crearPresupuestoReparacion(req, res) {
  try {
    const validation = validateCreatePresupuestoReparacionBody(req.body);

    if (!validation.ok) {
      sendValidationError(res, "Body inválido", validation.errors);
      return;
    }

    const result = await presupuestoReparacionService.crearPresupuestoReparacionIntoDB(
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
      sendValidationError(res, "Id inválido", validation.errors);
      return;
    }

    const result = await presupuestoReparacionService.getPresupuestoReparacionById(
      validation.value
    );

    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function listPresupuestosReparacion(req, res) {
  try {
    const pendingClientSignatureOnly =
      String(req.query?.pending_client_signature_only ?? "").trim().toLowerCase() === "true";

    const result = await presupuestoReparacionService.listRepairBudgets({
      pendingClientSignatureOnly,
    });

    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function signPresupuestoTecarral(req, res) {
  try {
    const idValidation = validatePresupuestoReparacionIdParam(req.params.id);
    const bodyValidation = validateSignPresupuestoTecarralBody(req.body);

    if (!idValidation.ok || !bodyValidation.ok) {
      sendValidationError(res, "Datos inválidos", [
        ...idValidation.errors,
        ...bodyValidation.errors,
      ]);
      return;
    }

    const result = await presupuestoReparacionService.signPresupuestoByTecarral(
      idValidation.value,
      bodyValidation.value,
      req.user
    );

    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
}
