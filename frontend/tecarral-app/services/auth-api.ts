import { apiRequest } from '@/services/api';
import type {
  ChangeTemporaryPasswordResponse,
  LoginResponse,
} from '@/types/auth';

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function changeTemporaryPassword(firstAccessToken: string, newPassword: string) {
  return apiRequest<ChangeTemporaryPasswordResponse>('/auth/change-temporary-password', {
    method: 'POST',
    token: firstAccessToken,
    body: { newPassword },
  });
}
