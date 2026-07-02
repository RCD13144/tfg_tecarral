import type { AuthUser } from '@/types/auth';

export interface UserListItem extends AuthUser {
  is_active: boolean;
}

export interface UserProfileForm {
  telefono: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
}

export interface CreateUserForm {
  email: string;
  nombre: string;
  telefono: string;
  role: 'admin' | 'tecnico';
}

export interface NotificationItem {
  id: number;
  tipo: string;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface ServiceVisitItem {
  id: number;
  service_contract_id: number;
  id_maquina: number;
  scheduled_for: string;
  estado: string;
  completed_at?: string | null;
}

export interface ServiceContractItem {
  id: number;
  contract_type: 'PREVENTIVO' | 'TODO_INCLUIDO';
  estado: string;
  document_number?: string | null;
  id_maquina: number;
  machines?: Array<{ id_maquina: number; marca?: string | null; modelo?: string | null; ns?: string | null }>;
  cliente_nombre: string;
  cliente_email?: string | null;
  tarifa_fija: number;
  start_date: string;
  end_date?: string | null;
  condiciones?: string | null;
  client_signed?: boolean;
  tecarral_signed?: boolean;
  visits?: ServiceVisitItem[];
}

export interface RepairBudgetItem {
  id: number;
  reparacion_id: number;
  id_maquina: number;
  estado: string;
  document_number?: string | null;
  payer_type: 'CLIENTE' | 'EMPRESA';
  base_imponible?: number | null;
  iva_rate?: number | null;
  iva_amount?: number | null;
  importe_total: number;
  expira_at: string;
  cliente?: string | null;
  email_cliente?: string | null;
  maquina_marca?: string | null;
  maquina_modelo?: string | null;
  maquina_ns?: string | null;
  reparacion_estado?: string | null;
  firmado_cliente_at?: string | null;
  firmado_cliente_nombre?: string | null;
  firmado_tecnico_at?: string | null;
  firmado_tecnico_nombre?: string | null;
  issued_at?: string | null;
  items?: Array<{
    id: number;
    referencia?: string | null;
    descripcion: string;
    unidades: number;
    precio_unitario: number;
    line_total: number;
  }>;
}
