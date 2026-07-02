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

  if (params.ownership_type) {
    searchParams.set('ownership_type', params.ownership_type);
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
      elev_ruedas: data.elev_ruedas.trim() || undefined,
      elev_cap_carga: data.elev_cap_carga.trim() || undefined,
      elev_replegado_mm: data.elev_replegado_mm.trim() || undefined,
      elev_elevacion_libre:
        data.elev_elevacion_libre === '' ? undefined : data.elev_elevacion_libre === 'true',
      elev_elevacion: data.elev_elevacion.trim() || undefined,
      elev_desplazamiento: data.elev_desplazamiento.trim() || undefined,
      elev_posicion: data.elev_posicion.trim() || undefined,
      elev_antihuella:
        data.elev_antihuella === '' ? undefined : data.elev_antihuella === 'true',
      elev_matricula: data.elev_matricula.trim() || undefined,
      elev_largo: data.elev_largo.trim() || undefined,
      elev_alto: data.elev_alto.trim() || undefined,
      elev_ancho: data.elev_ancho.trim() || undefined,
      elev_peso_kg: data.elev_peso_kg.trim() || undefined,
      elev_horquillas: data.elev_horquillas.trim() || undefined,
    },
  });
}

export function createMachine(
  data: MachineCreateFormData,
  token: string,
  ownershipType: 'TECARRAL' | 'CLIENTE' = 'TECARRAL'
) {
  const isElevation = data.tipo === 'elevacion';
  const customerOperationalAddress = [
    data.ubicacion_operativa_direccion,
    data.ubicacion_operativa_cp,
    data.ubicacion_operativa_poblacion,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(', ');

  return apiRequest<MachineDetail>('/maquinas', {
    method: 'POST',
    token,
    body: {
      subtipo: data.subtipo.trim(),
      marca: data.marca.trim(),
      modelo: data.modelo.trim(),
      ns: data.ns.trim(),
      tipo: data.tipo,
      motor: data.motor || undefined,
      seguro: data.seguro === '' ? undefined : data.seguro === 'true',
      num_poliza: data.num_poliza.trim() || undefined,
      observaciones: data.observaciones.trim() || undefined,
      ownership_type: ownershipType,
      ubicacion: ownershipType === 'CLIENTE' ? customerOperationalAddress : undefined,
      ubicacion_operativa_direccion:
        ownershipType === 'CLIENTE' ? data.ubicacion_operativa_direccion.trim() : undefined,
      ubicacion_operativa_poblacion:
        ownershipType === 'CLIENTE' ? data.ubicacion_operativa_poblacion.trim() : undefined,
      ubicacion_operativa_cp:
        ownershipType === 'CLIENTE' ? data.ubicacion_operativa_cp.trim() : undefined,
      owner_cliente_nombre:
        ownershipType === 'CLIENTE' ? data.owner_cliente_nombre.trim() : undefined,
      owner_cliente_email:
        ownershipType === 'CLIENTE' ? data.owner_cliente_email.trim() : undefined,
      owner_cliente_telefono:
        ownershipType === 'CLIENTE' ? data.owner_cliente_telefono.trim() : undefined,
      owner_cliente_direccion:
        ownershipType === 'CLIENTE' ? data.owner_cliente_direccion.trim() : undefined,
      owner_cliente_poblacion:
        ownershipType === 'CLIENTE' ? data.owner_cliente_poblacion.trim() : undefined,
      owner_cliente_cp:
        ownershipType === 'CLIENTE' ? data.owner_cliente_cp.trim() : undefined,
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
    propuesta_alquiler_id?: number | null;
    service_context_type?: 'ALQUILER' | 'CONTRATO_MANTENIMIENTO' | 'REPARACION_PUNTUAL_CLIENTE' | null;
    service_context_id?: number | null;
    service_case_type?: 'CLIENTE_HABITUAL' | 'CLIENTE_NUEVO' | null;
    fault_cause?: 'DESGASTE_USO' | 'GOLPE_ACCIDENTE' | null;
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
  return apiRequest<{ ok: boolean; data?: Maquina | null }>(`/maquinas/${idMaquina}/mark-delivered`, {
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

