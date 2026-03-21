import { REPARACION_ESTADOS } from "../constants/reparacionEstados.js";
import { MAINTENANCE_STATUS } from "../constants/maintenanceStatus.js";

function normalizeContext(context) {
  const maintenanceStatus = context?.maintenanceStatus;
  const hasPresupuesto = Boolean(context?.hasPresupuesto);

  const isValidMs =
    maintenanceStatus === MAINTENANCE_STATUS.AVERIADA ||
    maintenanceStatus === MAINTENANCE_STATUS.AVERIADA_GRAVE;

  if (!isValidMs) {
    const err = new Error(
      `maintenance_status inválido para workflow de reparación: ${String(maintenanceStatus)}`
    );
    err.code = "INVALID_MAINTENANCE_STATUS_FOR_REPARACION";
    err.meta = { maintenanceStatus };
    throw err;
  }

  return { maintenanceStatus, hasPresupuesto };
}

function isKnownEstado(estado) {
  return Object.values(REPARACION_ESTADOS).includes(estado);
}

function buildUnknownStateError(estado) {
  const err = new Error(`Estado de reparación desconocido: ${String(estado)}`);
  err.code = "UNKNOWN_REPARACION_STATE";
  err.meta = { estado };
  return err;
}

function buildTransitionError(from, to, ctx) {
  const err = new Error(`Transición de reparación no permitida: ${from} -> ${to}`);
  err.code = "INVALID_REPARACION_STATE_TRANSITION";
  err.meta = { from, to, ...ctx };
  return err;
}

function isGrave(ctx) {
  return ctx.maintenanceStatus === MAINTENANCE_STATUS.AVERIADA_GRAVE || ctx.hasPresupuesto;
}

function allowedTargets(from, ctx) {
  const grave = isGrave(ctx);

  if (from === REPARACION_ESTADOS.TERMINADA) return [];
  if (from === REPARACION_ESTADOS.CANCELADA) return [];

  if (!grave) {
    if (from === REPARACION_ESTADOS.CREADA) {
      return [REPARACION_ESTADOS.TERMINADA, REPARACION_ESTADOS.CANCELADA];
    }
    return [];
  }

  if (from === REPARACION_ESTADOS.CREADA) {
    return [REPARACION_ESTADOS.PENDIENTE_PRESUPUESTO, REPARACION_ESTADOS.CANCELADA];
  }
  if (from === REPARACION_ESTADOS.PENDIENTE_PRESUPUESTO) {
    return [REPARACION_ESTADOS.PENDIENTE_ACEPTACION, REPARACION_ESTADOS.CANCELADA];
  }
  if (from === REPARACION_ESTADOS.PENDIENTE_ACEPTACION) {
    return [REPARACION_ESTADOS.PRESUPUESTO_ACEPTADO, REPARACION_ESTADOS.CANCELADA];
  }
  if (from === REPARACION_ESTADOS.PRESUPUESTO_ACEPTADO) {
    return [REPARACION_ESTADOS.TERMINADA];
  }

  return [];
}

export const ReparacionStateService = Object.freeze({

  assertTransition(from, to, context) {
    if (!isKnownEstado(from)) throw buildUnknownStateError(from);
    if (!isKnownEstado(to)) throw buildUnknownStateError(to);

    const ctx = normalizeContext(context);
    const targets = allowedTargets(from, ctx);

    const ok = targets.includes(to);
    if (!ok) {
      throw buildTransitionError(from, to, ctx);
    }
  },

  canTransition(from, to, context) {
    if (!isKnownEstado(from)) return false;
    if (!isKnownEstado(to)) return false;

    try {
      const ctx = normalizeContext(context);
      const targets = allowedTargets(from, ctx);
      return targets.includes(to);
    } catch {
      return false;
    }
  },

  canAssignTechnician(estado) {
    if (!isKnownEstado(estado)) return false;
    return estado !== REPARACION_ESTADOS.TERMINADA && estado !== REPARACION_ESTADOS.CANCELADA;
  },

  getAllowedTargets(from, context) {
    if (!isKnownEstado(from)) throw buildUnknownStateError(from);
    const ctx = normalizeContext(context);
    return allowedTargets(from, ctx);
  },
});