import { PRESUPUESTO_REPARACION_ESTADOS } from "../constants/presupuestoReparacionEstados.js";
import { REPARACION_ESTADOS } from "../constants/reparacionEstados.js";

function isKnownEstado(estado) {
  return Object.values(PRESUPUESTO_REPARACION_ESTADOS).includes(estado);
}

function buildUnknownStateError(estado) {
  const err = new Error(`Estado de presupuesto_reparacion desconocido: ${String(estado)}`);
  err.code = "UNKNOWN_PRESUPUESTO_REPARACION_STATE";
  err.meta = { estado };
  return err;
}

function buildTransitionError(from, to) {
  const err = new Error(`Transición de presupuesto_reparacion no permitida: ${from} -> ${to}`);
  err.code = "INVALID_PRESUPUESTO_REPARACION_STATE_TRANSITION";
  err.meta = { from, to };
  return err;
}

const allowedTransitions = Object.freeze({
  [PRESUPUESTO_REPARACION_ESTADOS.PENDING]: Object.freeze([
    PRESUPUESTO_REPARACION_ESTADOS.ACEPTADA,
    PRESUPUESTO_REPARACION_ESTADOS.RECHAZADA,
    PRESUPUESTO_REPARACION_ESTADOS.EXPIRADA,
  ]),
  [PRESUPUESTO_REPARACION_ESTADOS.ACEPTADA]: Object.freeze([
    PRESUPUESTO_REPARACION_ESTADOS.FINALIZADA,
  ]),
  [PRESUPUESTO_REPARACION_ESTADOS.RECHAZADA]: Object.freeze([]),
  [PRESUPUESTO_REPARACION_ESTADOS.EXPIRADA]: Object.freeze([]),
  [PRESUPUESTO_REPARACION_ESTADOS.FINALIZADA]: Object.freeze([]),
});

function canTransition(from, to) {
  const targets = allowedTransitions[from] || [];
  return targets.includes(to);
}

function mapToReparacionEstado(presupuestoEstado) {
  if (presupuestoEstado === PRESUPUESTO_REPARACION_ESTADOS.PENDING) {
    return REPARACION_ESTADOS.PENDIENTE_ACEPTACION;
  }
  if (presupuestoEstado === PRESUPUESTO_REPARACION_ESTADOS.ACEPTADA) {
    return REPARACION_ESTADOS.PRESUPUESTO_ACEPTADO;
  }
  if (
    presupuestoEstado === PRESUPUESTO_REPARACION_ESTADOS.RECHAZADA ||
    presupuestoEstado === PRESUPUESTO_REPARACION_ESTADOS.EXPIRADA
  ) {
    return REPARACION_ESTADOS.CANCELADA;
  }
  return null;
}

export const PresupuestoReparacionStateService = Object.freeze({
  assertTransition(from, to) {
    if (!isKnownEstado(from)) throw buildUnknownStateError(from);
    if (!isKnownEstado(to)) throw buildUnknownStateError(to);

    if (!canTransition(from, to)) {
      throw buildTransitionError(from, to);
    }
  },

  canTransition(from, to) {
    if (!isKnownEstado(from)) return false;
    if (!isKnownEstado(to)) return false;
    return canTransition(from, to);
  },

  mapToReparacionEstado(estado) {
    if (!isKnownEstado(estado)) throw buildUnknownStateError(estado);
    return mapToReparacionEstado(estado);
  },

  getAllowedTransitions() {
    return allowedTransitions;
  },
});
