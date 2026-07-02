import { apiRequest } from '@/services/api';
import type { NotificationItem } from '@/types/user';

export function getNotifications(token: string) {
  return apiRequest<NotificationItem[]>('/notificaciones', {
    token,
  });
}

export function markNotificationRead(idNotification: number, token: string) {
  return apiRequest<NotificationItem>(`/notificaciones/${idNotification}/read`, {
    method: 'PATCH',
    token,
  });
}

export function markAllNotificationsRead(token: string) {
  return apiRequest<{ updated_count: number }>('/notificaciones/read-all', {
    method: 'PATCH',
    token,
  });
}
export function registerPushToken(
  payload: { expo_push_token: string; platform?: string | null; device_id?: string | null },
  token: string
) {
  return apiRequest('/notificaciones/push-token', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function unregisterPushToken(expoPushToken: string, token: string) {
  return apiRequest('/notificaciones/push-token', {
    method: 'DELETE',
    token,
    body: { expo_push_token: expoPushToken },
  });
}
