import { apiRequest } from '@/services/api';

export function createRepairBudget(
  payload: {
    reparacion_id: number;
    propuesta_alquiler_id: number;
    importe_total: number;
    condiciones: string | null;
    expira_at: string;
    payer_type: 'CLIENTE' | 'EMPRESA';
    charge_reason?: 'GOLPE_ACCIDENTE' | null;
  },
  token: string
) {
  return apiRequest<{
    id: number;
    reparacion_id: number;
    propuesta_alquiler_id: number;
    estado: string;
    payer_type: 'CLIENTE' | 'EMPRESA';
    charge_reason: 'GOLPE_ACCIDENTE' | null;
    importe_total: number;
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
