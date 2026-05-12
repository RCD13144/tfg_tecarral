import { apiRequest } from '@/services/api';

export function createRepairBudget(
  payload: {
    reparacion_id: number;
    propuesta_alquiler_id: number;
    importe_total: number;
    condiciones: string | null;
    expira_at: string;
  },
  token: string
) {
  return apiRequest<{
    id: number;
    reparacion_id: number;
    propuesta_alquiler_id: number;
    estado: string;
    importe_total: number;
    condiciones: string | null;
    expira_at: string;
    public_url?: string;
    email_sent?: boolean;
    email_error?: string | null;
  }>('/presupuestos-reparacion', {
    method: 'POST',
    token,
    body: payload,
  });
}
