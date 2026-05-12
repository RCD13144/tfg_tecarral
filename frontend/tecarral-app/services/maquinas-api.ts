import { apiRequest } from '@/services/api';
import type {
  MachineDetail,
  MachineCreateFormData,
  MachineEditFormData,
  MachineQueryParams,
  Maquina,
  SearchSuggestion,
} from '@/types/maquina';

function buildMachineQuery(params: MachineQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.q?.trim()) {
    searchParams.set('q', params.q.trim());
  }

  if (params.filters) {
    for (const value of params.filters.availability) {
      searchParams.append('availability', value);
    }

    for (const value of params.filters.tipo) {
      searchParams.append('tipo', value);
    }

    for (const value of params.filters.subtipo) {
      searchParams.append('subtipo', value);
    }

    for (const value of params.filters.motor) {
      searchParams.append('motor', value);
    }

    for (const value of params.filters.ubicacion_type) {
      searchParams.append('ubicacion_type', value);
    }
  }

  const query = searchParams.toString();
  return query.length > 0 ? `/maquinas?${query}` : '/maquinas';
}

export function getMaquinas(params: MachineQueryParams = {}) {
  return apiRequest<Maquina[]>(buildMachineQuery(params));
}

export function getMachineDetail(idMaquina: number, token: string) {
  return apiRequest<MachineDetail>(`/maquinas/${idMaquina}`, {
    token,
  });
}

export function updateMachineDetail(
  idMaquina: number,
  data: MachineEditFormData,
  token: string
) {
  return apiRequest<MachineDetail>(`/maquinas/${idMaquina}`, {
    method: 'PATCH',
    token,
    body: {
      marca: data.marca.trim(),
      modelo: data.modelo.trim(),
      ubicacion: data.ubicacion.trim(),
      tipo: data.tipo,
      motor: data.motor,
      ns: data.ns.trim(),
      num_poliza: data.num_poliza.trim(),
      observaciones: data.observaciones.trim(),
      seguro: data.seguro === 'true',
    },
  });
}

export function createMachine(data: MachineCreateFormData, token: string) {
  const isElevation = data.tipo === 'elevacion';

  return apiRequest<MachineDetail>('/maquinas', {
    method: 'POST',
    token,
    body: {
      marca: data.marca.trim(),
      modelo: data.modelo.trim(),
      ns: data.ns.trim(),
      tipo: data.tipo,
      motor: data.motor || undefined,
      seguro: data.seguro === '' ? undefined : data.seguro === 'true',
      num_poliza: data.num_poliza.trim() || undefined,
      observaciones: data.observaciones.trim() || undefined,
      elev_ruedas: isElevation ? data.elev_ruedas.trim() || undefined : undefined,
      elev_cap_carga: isElevation ? data.elev_cap_carga.trim() || undefined : undefined,
      elev_replegado_mm: isElevation ? data.elev_replegado_mm.trim() || undefined : undefined,
      elev_elevacion_libre:
        !isElevation || data.elev_elevacion_libre === ''
          ? undefined
          : data.elev_elevacion_libre === 'true',
      elev_elevacion: isElevation ? data.elev_elevacion.trim() || undefined : undefined,
      elev_desplazamiento: isElevation ? data.elev_desplazamiento.trim() || undefined : undefined,
      elev_posicion: isElevation ? data.elev_posicion.trim() || undefined : undefined,
      elev_antihuella: isElevation ? data.elev_antihuella.trim() || undefined : undefined,
      elev_matricula: isElevation ? data.elev_matricula.trim() || undefined : undefined,
      elev_largo: isElevation ? data.elev_largo.trim() || undefined : undefined,
      elev_alto: isElevation ? data.elev_alto.trim() || undefined : undefined,
      elev_ancho: isElevation ? data.elev_ancho.trim() || undefined : undefined,
      elev_peso_kg: isElevation ? data.elev_peso_kg.trim() || undefined : undefined,
      elev_horquillas: isElevation ? data.elev_horquillas.trim() || undefined : undefined,
    },
  });
}

export function updateMachineMaintenanceStatus(
  idMaquina: number,
  maintenanceStatus: string,
  token: string
) {
  return apiRequest<{ id_maquina: number; maintenance_status: string }>(
    `/maquinas/${idMaquina}/maintenance-status`,
    {
      method: 'PATCH',
      token,
      body: {
        maintenance_status: maintenanceStatus,
      },
    }
  );
}

export function openMachineIncidence(
  idMaquina: number,
  payload: {
    maintenance_status: 'AVERIADA' | 'AVERIADA_GRAVE';
    propuesta_alquiler_id: number;
    comentario: string;
  },
  token: string
) {
  return apiRequest<{ id_maquina: number; maintenance_status: string; id_albaran?: number }>(
    `/maquinas/${idMaquina}/abrir-incidencia`,
    {
      method: 'POST',
      token,
      body: payload,
    }
  );
}

export function escalateMachineIncidence(
  idMaquina: number,
  payload: {
    comentario: string;
  },
  token: string
) {
  return apiRequest<{ id_maquina: number; maintenance_status: string }>(
    `/maquinas/${idMaquina}/escalar-grave`,
    {
      method: 'PATCH',
      token,
      body: payload,
    }
  );
}

export function moveMachineBetweenBases(
  idMaquina: number,
  destination: 'taller' | 'almacen',
  token: string
) {
  return apiRequest<Maquina>(`/maquinas/${idMaquina}/move/${destination}`, {
    method: 'POST',
    token,
  });
}

export function markMachineArrivedAtBase(
  idMaquina: number,
  destination: 'taller' | 'almacen',
  token: string
) {
  return apiRequest<Maquina>(`/maquinas/${idMaquina}/location/${destination}`, {
    method: 'POST',
    token,
  });
}

export function markMachineDelivered(idMaquina: number, token: string) {
  return apiRequest<{ ok: boolean }>(`/maquinas/${idMaquina}/mark-delivered`, {
    method: 'POST',
    token,
  });
}

async function getSuggestionsBySource(
  source: SearchSuggestion['source'],
  text: string,
  token: string
) {
  const query = new URLSearchParams({ text: text.trim() }).toString();
  const result = await apiRequest<string[]>(`/maquinas/suggest/${source}?${query}`, {
    token,
  });

  return result.map((label) => ({
    id: `${source}:${label}`,
    label,
    source,
  }));
}

export async function getMachineSuggestions(text: string, token: string) {
  const trimmedText = text.trim();

  if (trimmedText.length < 2 && !/^\d+$/.test(trimmedText)) {
    return [];
  }

  const results = await Promise.all([
    getSuggestionsBySource('id', trimmedText, token),
    getSuggestionsBySource('modelo', trimmedText, token),
    getSuggestionsBySource('marca', trimmedText, token),
    getSuggestionsBySource('subtipo', trimmedText, token),
    getSuggestionsBySource('tipo', trimmedText, token),
    getSuggestionsBySource('ns', trimmedText, token),
    getSuggestionsBySource('motor', trimmedText, token),
  ]);

  const deduped = new Map<string, SearchSuggestion>();

  for (const items of results) {
    for (const item of items) {
      const key = item.label.trim().toLowerCase();

      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    }
  }

  return Array.from(deduped.values()).slice(0, 10);
}
