export interface AuthUser {
  id_user: number;
  email: string;
  role: string;
  nombre: string;
  telefono: string | null;
  must_change_password?: boolean;
  is_active?: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface FirstAccessState {
  token: string;
  user: AuthUser;
}

export type LoginResponse =
  | {
      must_change_password: false;
      token: string;
      user: AuthUser;
    }
  | {
      must_change_password: true;
      first_access_token: string;
      user: AuthUser;
    };

export interface ChangeTemporaryPasswordResponse {
  message: string;
  token: string;
  user: AuthUser;
}
