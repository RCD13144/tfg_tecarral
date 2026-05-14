import { machineImageMap, normalizeMachineImageKey } from '@/constants/machine-images';
import { API_BASE_URL } from '@/config/api';
import type { MachineDetail, MachineFilters, MachineProposalSummary, Maquina } from '@/types/maquina';

const MADRID_TIME_ZONE = 'Europe/Madrid';

export function normalizeValue(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function stripAccents(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function formatMachineName(machine: Maquina) {
  const subtipo = stripAccents(machine.tipo).trim();
  const tipo = stripAccents(machine.tipo_maquina).trim();

  if (subtipo.length > 0) return subtipo;
  if (tipo.length > 0) return tipo;

  return `Máquina ${machine.id_maquina}`;
}

export function getMachineImageSource(machine: Pick<Maquina, 'modelo' | 'image_url'>) {
  const imageUrl = String(machine.image_url ?? '').trim();

  if (imageUrl.length > 0) {
    if (/^https?:\/\//i.test(imageUrl)) {
      return { uri: imageUrl };
    }

    const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    return { uri: `${apiOrigin}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}` };
  }

  const key = normalizeMachineImageKey(machine.modelo);
  const imagesByKey = machineImageMap as Record<string, unknown>;

  if (key.length === 0) {
    return null;
  }

  return imagesByKey[key] ?? null;
}

export function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';

  const text = stripAccents(value).trim();
  return text.length > 0 ? text : '-';
}

export function formatLocationLabel(value: unknown) {
  const key = stripAccents(value).trim().toUpperCase();

  if (key === 'TALLER') return 'Taller';
  if (key === 'ALMACEN') return 'Almacen';
  if (key === 'CLIENTE') return 'Cliente';
  if (key === 'TRANSITO') return 'Transito';
  return formatDisplayValue(value);
}

export function formatMaintenanceLabel(value: unknown) {
  const key = stripAccents(value).trim().toUpperCase();

  if (key === 'OK') return 'OK';
  if (key === 'AVERIADA') return 'Averiada';
  if (key === 'AVERIADA_GRAVE') return 'Averiada grave';
  return formatDisplayValue(value);
}

export function machineMatchesFilters(machine: Maquina, filters: MachineFilters) {
  const availabilityValue = String(machine.availability_status ?? '').trim().toUpperCase();
  const tipoValue = normalizeValue(machine.tipo_maquina);
  const subtipoValue = normalizeValue(machine.tipo);
  const motorValue = normalizeValue(machine.motor);
  const ubicacionValue = String(machine.ubicacion_tipo ?? '').trim().toUpperCase();

  const matchesAvailability =
    filters.availability.length === 0 || filters.availability.includes(availabilityValue);
  const matchesTipo =
    filters.tipo.length === 0 ||
    filters.tipo.some((value) => normalizeValue(value) === tipoValue);
  const matchesSubtipo =
    filters.subtipo.length === 0 ||
    filters.subtipo.some((value) => normalizeValue(value) === subtipoValue);
  const matchesMotor =
    filters.motor.length === 0 ||
    filters.motor.some((value) => normalizeValue(value) === motorValue);
  const matchesUbicacion =
    filters.ubicacion_type.length === 0 || filters.ubicacion_type.includes(ubicacionValue);

  return (
    matchesAvailability &&
    matchesTipo &&
    matchesSubtipo &&
    matchesMotor &&
    matchesUbicacion
  );
}

export function getAllowedMaintenanceOptions(currentStatus: unknown) {
  const current = String(currentStatus ?? '').trim().toUpperCase();

  if (current === 'OK') {
    return [
      { label: 'OK', value: 'OK' },
      { label: 'Averiada', value: 'AVERIADA' },
      { label: 'Averiada grave', value: 'AVERIADA_GRAVE' },
    ];
  }

  if (current === 'AVERIADA') {
    return [
      { label: 'Averiada', value: 'AVERIADA' },
      { label: 'Averiada grave', value: 'AVERIADA_GRAVE' },
    ];
  }

  return [{ label: formatMaintenanceLabel(currentStatus), value: current || 'AVERIADA_GRAVE' }];
}

export function getLocationOptions(
  detail: MachineDetail | null,
  proposals: MachineProposalSummary[] = []
) {
  if (!detail) return [];

  const current = stripAccents(detail.ubicacion_tipo).trim().toUpperCase();
  const availability = stripAccents(detail.availability_status).trim().toUpperCase();
  const maintenance = stripAccents(detail.maintenance_status).trim().toUpperCase();
  const transitReason = stripAccents(detail.transit_reason).trim().toUpperCase();
  const hasAcceptedProposal = proposals.some((proposal) => proposal.estado === 'ACEPTADA');
  const options = new Set<string>();

  if (current.length > 0) {
    options.add(current);
  }

  if (current === 'TRANSITO') {
    if (transitReason === 'REPARACION_TERMINADA') {
      options.add('CLIENTE');
    } else if (transitReason === 'ALQUILER_FINALIZADO') {
      options.add('TALLER');
      options.add('ALMACEN');
    } else if (maintenance === 'AVERIADA_GRAVE') {
      options.add('TALLER');
      options.add('ALMACEN');
    } else if (hasAcceptedProposal) {
      options.add('CLIENTE');
    } else {
      options.add('TALLER');
      options.add('ALMACEN');
    }
  } else if (current === 'TALLER' || current === 'ALMACEN') {
    options.add(current === 'TALLER' ? 'ALMACEN' : 'TALLER');

    if (availability !== 'ALQUILADA') {
      options.add('CLIENTE');
    }
  } else if (current === 'CLIENTE') {
    options.add('CLIENTE');
  }

  return Array.from(options).map((value) => ({
    label: formatLocationLabel(value),
    value,
  }));
}

export function formatProposalDate(value: unknown) {
  const raw = String(value ?? '').trim();

  if (!raw) return '-';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: MADRID_TIME_ZONE,
  }).format(date);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildMonthDays(date: Date) {
  const firstDay = startOfMonth(date);
  const jsWeekday = firstDay.getDay();
  const mondayBasedOffset = (jsWeekday + 6) % 7;
  const firstVisibleDay = new Date(firstDay);
  firstVisibleDay.setDate(firstVisibleDay.getDate() - mondayBasedOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(firstVisibleDay);
    next.setDate(firstVisibleDay.getDate() + index);
    return next;
  });
}

export function toIsoLocalString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

export function parseProposalDateValue(value: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

export function getAcceptedProposal(proposals: MachineProposalSummary[]) {
  return proposals.find((proposal) => proposal.estado === 'ACEPTADA') ?? null;
}
