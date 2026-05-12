import { apiRequest } from '@/services/api';
import type { AuthUser } from '@/types/auth';
import type { AssignableUser } from '@/types/reparacion';
import type { CreateUserForm, UserListItem } from '@/types/user';

export function getUsers(token: string) {
  return apiRequest<AssignableUser[]>('/users', {
    token,
  });
}

export function getUsersForAdmin(token: string) {
  return apiRequest<UserListItem[]>('/users', {
    token,
  });
}

export function updateMeProfile(payload: { telefono: string }, token: string) {
  return apiRequest<AuthUser>('/users/me', {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function changeMyPassword(
  payload: { currentPassword: string; newPassword: string },
  token: string
) {
  return apiRequest('/users/me/password', {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function registerUserByAdmin(payload: CreateUserForm, token: string) {
  return apiRequest<{
    user: UserListItem;
    temporaryPassword: string;
  }>('/users', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function deactivateUserByAdmin(idUser: number, token: string) {
  return apiRequest<UserListItem>(`/users/${idUser}/deactivate`, {
    method: 'PATCH',
    token,
  });
}
