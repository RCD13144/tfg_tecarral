import { apiRequest } from '@/services/api';
import type {
  MachineDetail,
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

  if (trimmedText.length < 2) {
    return [];
  }

  const results = await Promise.all([
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
