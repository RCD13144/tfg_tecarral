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
