import { API_BASE_URL } from '@/config/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawBody = await response.text();
  const data = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;

  if (!response.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : 'No se pudo completar la solicitud';
    throw new ApiError(message, response.status);
  }

  return data as T;
}
