import { apiRequest } from '@/services/api';
import type {
  AlbaranDetail,
  AlbaranListItem,
  FirmarAlbaranPayload,
  FirmarAlbaranResponse,
} from '@/types/albaran';

export function getAlbaranes(token: string, estado?: 'BORRADOR' | 'FIRMADO') {
  const params = new URLSearchParams();

  if (estado) {
    params.set('estado', estado);
  }

  const query = params.toString();

  return apiRequest<AlbaranListItem[]>(`/albaranes${query ? `?${query}` : ''}`, {
    token,
  });
}

export function getAlbaranDetail(idAlbaran: number, token: string) {
  return apiRequest<AlbaranDetail>(`/albaranes/${idAlbaran}`, {
    token,
  });
}

export function firmarAlbaran(
  idAlbaran: number,
  payload: FirmarAlbaranPayload,
  token: string
) {
  return apiRequest<FirmarAlbaranResponse>(`/albaranes/${idAlbaran}/firmar`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}
