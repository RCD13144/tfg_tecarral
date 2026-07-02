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
    const errorMessage = typeof data?.error === 'string' ? data.error : null;
    const messageText = typeof data?.message === 'string' ? data.message : null;
    const errorsText = Array.isArray(data?.errors)
      ? data.errors.filter((item) => typeof item === 'string').join('\n')
      : null;
    const message = errorMessage ?? messageText ?? errorsText ?? 'No se pudo completar la solicitud';
    throw new ApiError(errorsText && message !== errorsText ? `${message}: ${errorsText}` : message, response.status);
  }

  return data as T;
}

