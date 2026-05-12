import type { RepairListItem } from '@/types/reparacion';

function normalizeValue(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

function normalizePositiveId(value: unknown) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
}

function isGraveRepair(item: RepairListItem) {
  return normalizeValue(item.maintenance_status) === 'AVERIADA_GRAVE';
}

export function formatRepairDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(date);
}

export function formatRepairMachineLabel(item: RepairListItem) {
  const parts = [item.marca, item.modelo].filter((value) => String(value ?? '').trim().length > 0);
  return parts.length > 0 ? parts.join(' · ') : `Máquina #${item.id_maquina}`;
}

export function canAssignRepair(item: RepairListItem, isAdmin: boolean) {
  return isAdmin && normalizeValue(item.maintenance_status) === 'AVERIADA_GRAVE';
}

export function canFinishRepair(item: RepairListItem) {
  if (!isGraveRepair(item)) {
    return true;
  }

  return (
    normalizeValue(item.estado) === 'PRESUPUESTO_ACEPTADO' &&
    normalizePositiveId(item.id_user_asignado) !== null
  );
}

export function getFinishRepairBlockedReason(item: RepairListItem) {
  if (!isGraveRepair(item)) {
    return null;
  }

  if (normalizePositiveId(item.id_user_asignado) === null) {
    return 'Asigna primero esta averia grave a un usuario antes de terminarla.';
  }

  if (normalizeValue(item.estado) !== 'PRESUPUESTO_ACEPTADO') {
    return 'La averia grave solo puede terminarse cuando el presupuesto esta aceptado.';
  }

  return null;
}
