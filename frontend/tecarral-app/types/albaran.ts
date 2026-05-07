export type AlbaranStatus = 'BORRADOR' | 'FIRMADO';
export type AlbaranScreenView =
  | 'list'
  | 'unsignedDetail'
  | 'signatureTecnico'
  | 'signatureCliente'
  | 'signedDetail';
export type SignatureStep = 'tecnico' | 'cliente';

export interface AlbaranListItem {
  id_albaran: number;
  estado: AlbaranStatus;
  firmado_at?: string | null;
  id_maquina: number;
  propuesta_alquiler_id?: number | null;
  cliente?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  poblacion?: string | null;
  cp?: string | null;
  email_cliente?: string | null;
  marca?: string | null;
  modelo?: string | null;
  ns?: string | null;
  observaciones?: string | null;
}

export interface AlbaranDetail extends AlbaranListItem {}

export interface FirmarAlbaranPayload {
  firma_tecnico_base64: string;
  firma_cliente_base64: string;
  observaciones?: string;
}

export interface FirmarAlbaranResponse {
  id_albaran: number;
  estado: AlbaranStatus;
  firmado: boolean;
  maintenance_status?: string | null;
  reparacion_paso_a_pendiente_presupuesto?: boolean;
  email_sent?: boolean;
  email_error?: string | null;
}
