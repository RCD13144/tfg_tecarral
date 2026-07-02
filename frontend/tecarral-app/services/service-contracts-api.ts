import { apiRequest } from '@/services/api';
import type { ServiceContractCreateFormData } from '@/types/maquina';
import type { ServiceContractItem, ServiceVisitItem } from '@/types/user';

export function getPendingTecarralContracts(token: string) {
  return apiRequest<ServiceContractItem[]>(
    '/contratos-mantenimiento?pending_tecarral_only=true',
    {
      token,
    }
  );
}

export function getAllContracts(token: string) {
  return apiRequest<ServiceContractItem[]>('/contratos-mantenimiento', {
    token,
  });
}

export function getContractDetail(idContract: number, token: string) {
  return apiRequest<ServiceContractItem>(`/contratos-mantenimiento/${idContract}`, {
    token,
  });
}

export function signContractByTecarral(
  idContract: number,
  payload: {
    signer_name: string;
    signer_email?: string;
    signature_base64: string;
  },
  token: string
) {
  return apiRequest<ServiceContractItem>(`/contratos-mantenimiento/${idContract}/sign-tecarral`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function completeContractVisit(
  idVisit: number,
  payload: { notes?: string },
  token: string
) {
  return apiRequest<ServiceVisitItem>(`/contratos-mantenimiento/visits/${idVisit}/complete`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function createServiceContract(
  payload: ServiceContractCreateFormData & { id_maquina: number },
  token: string
) {
  return apiRequest<ServiceContractItem & { public_url?: string | null }>('/contratos-mantenimiento', {
    method: 'POST',
    token,
    body: {
      ...payload,
      tarifa_fija: Number(payload.tarifa_fija),
      recurrencia_valor: 1,
      start_date: payload.start_date ? payload.start_date.slice(0, 10) : payload.start_date,
      maintenance_day_of_month: payload.maintenance_day_of_month
        ? Number(payload.maintenance_day_of_month)
        : undefined,
      maintenance_weekday: payload.maintenance_weekday
        ? Number(payload.maintenance_weekday)
        : undefined,
      end_date: payload.end_date ? payload.end_date.slice(0, 10) : undefined,
      condiciones: payload.condiciones || undefined,
    },
  });
}
