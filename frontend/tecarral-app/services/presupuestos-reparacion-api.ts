import { apiRequest } from '@/services/api';
import type { RepairBudgetItem } from '@/types/user';

export function createRepairBudget(
  payload: {
    reparacion_id: number;
    propuesta_alquiler_id?: number;
    importe_total?: number;
    iva_rate?: number;
    items?: Array<{
      referencia?: string | null;
      descripcion: string;
      unidades: number;
      precio_unitario: number;
    }>;
    condiciones: string | null;
    expira_at: string;
    payer_type?: 'CLIENTE' | 'EMPRESA';
    charge_reason?: 'GOLPE_ACCIDENTE' | null;
    contract_type?: 'PREVENTIVO' | 'TODO_INCLUIDO';
  },
  token: string
) {
  return apiRequest<{
    id: number;
    reparacion_id: number;
    propuesta_alquiler_id: number | null;
    estado: string;
    payer_type: 'CLIENTE' | 'EMPRESA';
    charge_reason: 'GOLPE_ACCIDENTE' | null;
    importe_total?: number;
    condiciones: string | null;
    expira_at: string;
    public_url?: string | null;
    email_recipient?: string | null;
    email_sent?: boolean;
    email_error?: string | null;
  }>('/presupuestos-reparacion', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function signRepairBudgetByTecarral(
  id: number,
  payload: {
    signer_name: string;
    signature_base64: string;
  },
  token: string
) {
  return apiRequest<RepairBudgetItem>(`/presupuestos-reparacion/${id}/sign-tecarral`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getPendingRepairBudgets(token: string) {
  return apiRequest<RepairBudgetItem[]>('/presupuestos-reparacion?pending_client_signature_only=true', {
    token,
  });
}

export function getAllRepairBudgets(token: string) {
  return apiRequest<RepairBudgetItem[]>('/presupuestos-reparacion', {
    token,
  });
}

