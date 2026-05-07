import type { FilterCategoryKey, HomeTabKey, MachineDetail, MachineFilters, ProposalFormData } from '@/types/maquina';

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
      { label: 'Elevacion', value: 'elevacion' },
      { label: 'Limpieza', value: 'limpieza' },
    ],
  },
  {
    key: 'subtipo',
    label: 'Subtipo',
    options: [
      { label: 'Carretillas elevadoras', value: 'Carretilla elevad.' },
      { label: 'Retractiles', value: 'Retractil' },
      { label: 'Plataformas de tijera', value: 'Plataforma tijera' },
      { label: 'Barredoras', value: 'Barredora' },
      { label: 'Plataformas articuladas', value: 'Plataforma artic.' },
      { label: 'Fregadoras', value: 'Fregadora' },
      { label: 'Transpaletas electricas', value: 'Transpaleta electrica' },
      { label: 'Preparapedidos', value: 'Preparapedidos' },
      { label: 'Transpaletas manuales', value: 'Transpaleta manual' },
      { label: 'Criogenas', value: 'Criogena' },
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
    label: 'Combustion',
    options: [
      { label: 'Diesel', value: 'diesel' },
      { label: 'Electricas', value: 'electrica' },
      { label: 'Semi electricas', value: 'semi electrica' },
      { label: 'Manuales', value: 'manual' },
    ],
  },
  {
    key: 'ubicacion_type',
    label: 'Ubicacion',
    options: [
      { label: 'Taller', value: 'TALLER' },
      { label: 'Cliente', value: 'CLIENTE' },
      { label: 'Almacen', value: 'ALMACEN' },
      { label: 'Transito', value: 'TRANSITO' },
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
  { label: 'Direccion', key: 'ubicacion' },
  { label: 'Disponibilidad', key: 'availability_status' },
  { label: 'Tipo', key: 'tipo_maquina' },
  { label: 'No de serie', key: 'ns' },
  { label: 'No Poliza', key: 'num_poliza' },
];

export const ELEVATION_DETAIL_FIELDS: { label: string; key: keyof MachineDetail }[] = [
  { label: 'Ruedas', key: 'elev_ruedas' },
  { label: 'Capacidad de carga', key: 'elev_cap_carga' },
  { label: 'Replegado', key: 'elev_replegado_mm' },
  { label: 'Elevacion libre', key: 'elev_elevacion_libre' },
  { label: 'Elevacion', key: 'elev_elevacion' },
  { label: 'Desplazamiento', key: 'elev_desplazamiento' },
  { label: 'Posicion', key: 'elev_posicion' },
  { label: 'Antihuella', key: 'elev_antihuella' },
  { label: 'Matricula', key: 'elev_matricula' },
  { label: 'Largo', key: 'elev_largo' },
  { label: 'Alto', key: 'elev_alto' },
  { label: 'Ancho', key: 'elev_ancho' },
  { label: 'Peso', key: 'elev_peso_kg' },
  { label: 'Horquillas', key: 'elev_horquillas' },
];
