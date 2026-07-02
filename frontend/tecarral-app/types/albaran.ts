export type AlbaranStatus = 'BORRADOR' | 'FIRMADO';
export type AlbaranScreenView =
  | 'list'
  | 'unsignedDetail'
  | 'signatureTecnico'
  | 'signatureCliente'
  | 'signedDetail'
  | 'contractDetail'
  | 'contractSignature'
  | 'repairBudgetDetail'
  | 'repairBudgetSignature';
export type SignatureStep = 'tecnico' | 'cliente';

export interface AlbaranListItem {
  id_albaran: number;
  document_number?: string | null;
  document_kind?: string | null;
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
  document_number?: string | null;
  document_kind?: string | null;
  estado: AlbaranStatus;
  firmado: boolean;
  maintenance_status?: string | null;
  reparacion_paso_a_pendiente_presupuesto?: boolean;
  email_sent?: boolean;
  email_error?: string | null;
  pdf_generated?: boolean;
  pdf_sha256?: string | null;
  customer_delivery_status?: 'PENDING' | 'SENT' | 'ERROR';
  internal_delivery_status?: 'PENDING' | 'SENT' | 'ERROR';
}
