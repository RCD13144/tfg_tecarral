import type { ActiveRepairSummary } from '@/types/reparacion';

export interface Maquina {
  id_maquina: number;
  tipo?: string | null;
  tipo_maquina?: string | null;
  marca?: string | null;
  modelo?: string | null;
  motor?: string | null;
  ubicacion_tipo?: string | null;
  availability_status?: string | null;
  transit_reason?: 'REPARACION_TERMINADA' | 'ALQUILER_FINALIZADO' | null;
  image_path?: string | null;
  image_url?: string | null;
  [key: string]: unknown;
}

export type HomeTabKey = 'home' | 'albaran' | 'reparacion' | 'user';
export type HomeSubview = 'list' | 'detail' | 'proposalForm' | 'repairBudgetForm' | 'createMachineForm';

export type FilterCategoryKey =
  | 'availability'
  | 'tipo'
  | 'subtipo'
  | 'motor'
  | 'ubicacion_type';

export interface MachineFilters {
  availability: string[];
  tipo: string[];
  subtipo: string[];
  motor: string[];
  ubicacion_type: string[];
}

export interface MachineQueryParams {
  q?: string;
  filters?: MachineFilters;
}

export interface MachineMaps {
  query: string;
  geo: string;
  google: string;
  apple: string;
  waze: string;
}

export interface MachineDetail extends Maquina {
  ubicacion?: string | null;
  observaciones?: string | null;
  ns?: string | null;
  seguro?: boolean | null;
  num_poliza?: string | null;
  maintenance_status?: string | null;
  logistics_status?: string | null;
  maps?: MachineMaps | null;
  active_repair?: ActiveRepairSummary | null;
  elev_ruedas?: string | number | null;
  elev_cap_carga?: string | number | null;
  elev_replegado_mm?: string | number | null;
  elev_elevacion_libre?: string | number | null;
  elev_elevacion?: string | number | null;
  elev_desplazamiento?: string | number | null;
  elev_posicion?: string | number | null;
  elev_antihuella?: string | number | null;
  elev_matricula?: string | number | null;
  elev_largo?: string | number | null;
  elev_alto?: string | number | null;
  elev_ancho?: string | number | null;
  elev_peso_kg?: string | number | null;
  elev_horquillas?: string | number | null;
}

export interface MachineProposalSummary {
  id: number;
  id_maquina: number;
  cliente: string;
  estado: string;
  direccion: string;
  poblacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio: number;
}

export interface ProposalFormData {
  cliente: string;
  email_cliente: string;
  telefono: string;
  direccion: string;
  cp: string;
  poblacion: string;
  precio: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface MachineEditFormData {
  marca: string;
  modelo: string;
  ubicacion: string;
  image_uri: string;
  tipo: 'elevacion' | 'limpieza';
  motor: 'diesel' | 'electrica' | 'semi electrica' | 'manual';
  ns: string;
  num_poliza: string;
  observaciones: string;
  seguro: 'true' | 'false';
  elev_ruedas: string;
  elev_cap_carga: string;
  elev_replegado_mm: string;
  elev_elevacion_libre: 'true' | 'false' | '';
  elev_elevacion: string;
  elev_desplazamiento: string;
  elev_posicion: string;
  elev_antihuella: 'true' | 'false' | '';
  elev_matricula: string;
  elev_largo: string;
  elev_alto: string;
  elev_ancho: string;
  elev_peso_kg: string;
  elev_horquillas: string;
}

export interface MachineCreateFormData {
  marca: string;
  modelo: string;
  ns: string;
  image_uri: string;
  tipo: 'elevacion' | 'limpieza';
  motor: 'diesel' | 'electrica' | 'semi electrica' | 'manual' | '';
  seguro: 'true' | 'false' | '';
  num_poliza: string;
  observaciones: string;
  elev_ruedas: string;
  elev_cap_carga: string;
  elev_replegado_mm: string;
  elev_elevacion_libre: 'true' | 'false' | '';
  elev_elevacion: string;
  elev_desplazamiento: string;
  elev_posicion: string;
  elev_antihuella: string;
  elev_matricula: string;
  elev_largo: string;
  elev_alto: string;
  elev_ancho: string;
  elev_peso_kg: string;
  elev_horquillas: string;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  source: 'id' | 'modelo' | 'marca' | 'subtipo' | 'tipo' | 'ns' | 'motor';
}
