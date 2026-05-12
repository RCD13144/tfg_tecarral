import { apiRequest } from '@/services/api';
import type { RepairListItem } from '@/types/reparacion';

export function getReparaciones(token: string) {
  return apiRequest<RepairListItem[]>('/reparaciones', {
    token,
  });
}

export function assignRepair(idReparacion: number, idUser: number, token: string) {
  return apiRequest<{ id_reparacion: number; id_user_asignado: number }>(
    `/reparaciones/${idReparacion}/asignar-averia`,
    {
      method: 'PATCH',
      token,
      body: {
        id_user: idUser,
      },
    }
  );
}

export function finishRepair(
  idReparacion: number,
  solucionAplicada: string | null,
  token: string
) {
  return apiRequest<{
    id_reparacion: number;
    estado_anterior: string;
    estado_actual: string;
    solucion_aplicada: string | null;
  }>(`/reparaciones/${idReparacion}/terminar`, {
    method: 'PATCH',
    token,
    body: {
      solucion_aplicada: solucionAplicada,
    },
  });
}
