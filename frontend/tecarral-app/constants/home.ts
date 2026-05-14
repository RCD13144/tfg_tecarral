import type {
  FilterCategoryKey,
  HomeTabKey,
  MachineCreateFormData,
  MachineDetail,
  MachineEditFormData,
  MachineFilters,
  ProposalFormData,
} from '@/types/maquina';
import type { RepairBudgetFormData } from '@/types/reparacion';

export const LOGIN_ROUTE = '/login' as never;
export const TAB_BAR_HORIZONTAL_PADDING = 22;
export const TAB_BAR_INNER_PADDING = 8;
export const TAB_ICON_SIZE = 30;
export const TAB_KEYS: HomeTabKey[] = ['home', 'albaran', 'reparacion', 'user'];

export const FILTER_DEFINITIONS: {
  key: FilterCategoryKey;
  label: string;
  options: { label: string; value: string }[];
}[] = [
  {
    key: 'availability',
    label: 'Disponibilidad',
    options: [
      { label: 'Alquilada', value: 'ALQUILADA' },
      { label: 'Disponible', value: 'DISPONIBLE' },
      { label: 'Solicitada', value: 'SOLICITADA' },
    ],
  },
  {
    key: 'tipo',
    label: 'Tipo',
    options: [
      { label: 'Elevación', value: 'elevacion' },
      { label: 'Limpieza', value: 'limpieza' },
    ],
  },
  {
    key: 'subtipo',
    label: 'Subtipo',
    options: [
      { label: 'Carretillas elevadoras', value: 'Carretilla elevad.' },
      { label: 'Retráctiles', value: 'Retractil' },
      { label: 'Plataformas de tijera', value: 'Plataforma tijera' },
      { label: 'Barredoras', value: 'Barredora' },
      { label: 'Plataformas articuladas', value: 'Plataforma artic.' },
      { label: 'Fregadoras', value: 'Fregadora' },
      { label: 'Transpaletas eléctricas', value: 'Transpaleta electrica' },
      { label: 'Preparapedidos', value: 'Preparapedidos' },
      { label: 'Transpaletas manuales', value: 'Transpaleta manual' },
      { label: 'Criógenas', value: 'Criogena' },
      { label: 'Limpia-moquetas', value: 'Limpiamoquetas' },
      { label: 'Hidrolimpiadoras', value: 'Hidrolimpiadora' },
      { label: 'Apiladores', value: 'Apilador' },
      { label: 'Vaporetas', value: 'Vaporeta' },
      { label: 'Pulidoras', value: 'Pulidora' },
      { label: 'Aspiradores', value: 'Aspirador' },
    ],
  },
  {
    key: 'motor',
    label: 'Combustión',
    options: [
      { label: 'Diesel', value: 'diesel' },
      { label: 'Eléctricas', value: 'electrica' },
      { label: 'Semieléctricas', value: 'semi electrica' },
      { label: 'Manuales', value: 'manual' },
    ],
  },
  {
    key: 'ubicacion_type',
    label: 'Ubicación',
    options: [
      { label: 'Taller', value: 'TALLER' },
      { label: 'Cliente', value: 'CLIENTE' },
      { label: 'Almacén', value: 'ALMACEN' },
      { label: 'Tránsito', value: 'TRANSITO' },
    ],
  },
];

export const EMPTY_FILTERS: MachineFilters = {
  availability: [],
  tipo: [],
  subtipo: [],
  motor: [],
  ubicacion_type: [],
};

export const EMPTY_PROPOSAL_FORM: ProposalFormData = {
  cliente: '',
  email_cliente: '',
  telefono: '',
  direccion: '',
  cp: '',
  poblacion: '',
  precio: '',
  fecha_inicio: '',
  fecha_fin: '',
};

export const EMPTY_REPAIR_BUDGET_FORM: RepairBudgetFormData = {
  importe_total: '',
  condiciones: '',
  expira_at: '',
  payer_type: 'EMPRESA',
};

export const EMPTY_MACHINE_EDIT_FORM: MachineEditFormData = {
  marca: '',
  modelo: '',
  ubicacion: '',
  image_uri: '',
  tipo: 'elevacion',
  motor: 'electrica',
  ns: '',
  num_poliza: '',
  observaciones: '',
  seguro: 'false',
  elev_ruedas: '',
  elev_cap_carga: '',
  elev_replegado_mm: '',
  elev_elevacion_libre: '',
  elev_elevacion: '',
  elev_desplazamiento: '',
  elev_posicion: '',
  elev_antihuella: '',
  elev_matricula: '',
  elev_largo: '',
  elev_alto: '',
  elev_ancho: '',
  elev_peso_kg: '',
  elev_horquillas: '',
};

export const EMPTY_MACHINE_CREATE_FORM: MachineCreateFormData = {
  marca: '',
  modelo: '',
  ns: '',
  image_uri: '',
  tipo: 'elevacion',
  motor: '',
  seguro: '',
  num_poliza: '',
  observaciones: '',
  elev_ruedas: '',
  elev_cap_carga: '',
  elev_replegado_mm: '',
  elev_elevacion_libre: '',
  elev_elevacion: '',
  elev_desplazamiento: '',
  elev_posicion: '',
  elev_antihuella: '',
  elev_matricula: '',
  elev_largo: '',
  elev_alto: '',
  elev_ancho: '',
  elev_peso_kg: '',
  elev_horquillas: '',
};

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const WEEKDAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const COMMON_DETAIL_FIELDS: { label: string; key: keyof MachineDetail }[] = [
  { label: 'Marca', key: 'marca' },
  { label: 'Modelo', key: 'modelo' },
  { label: 'Dirección', key: 'ubicacion' },
  { label: 'Disponibilidad', key: 'availability_status' },
  { label: 'Tipo', key: 'tipo_maquina' },
  { label: 'N.º de serie', key: 'ns' },
  { label: 'N.º póliza', key: 'num_poliza' },
];

export const ELEVATION_DETAIL_FIELDS: { label: string; key: keyof MachineDetail }[] = [
  { label: 'Ruedas', key: 'elev_ruedas' },
  { label: 'Capacidad de carga (Kg)', key: 'elev_cap_carga' },
  { label: 'Replegado (cm)', key: 'elev_replegado_mm' },
  { label: 'Elevación libre', key: 'elev_elevacion_libre' },
  { label: 'Elevación (cm)', key: 'elev_elevacion' },
  { label: 'Desplazamiento', key: 'elev_desplazamiento' },
  { label: 'Posición', key: 'elev_posicion' },
  { label: 'Antihuella', key: 'elev_antihuella' },
  { label: 'Matrícula', key: 'elev_matricula' },
  { label: 'Largo (cm)', key: 'elev_largo' },
  { label: 'Alto (cm)', key: 'elev_alto' },
  { label: 'Ancho (cm)', key: 'elev_ancho' },
  { label: 'Peso (Kg)', key: 'elev_peso_kg' },
  { label: 'Horquillas (cm)', key: 'elev_horquillas' },
];
