import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';

import { API_BASE_URL } from '@/config/api';
import { ApiError } from '@/services/api';
import type { MachineDetail } from '@/types/maquina';

function sanitizeFileName(value: string) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return 'maquina.jpg';
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getFileNameFromUri(uri: string, idMaquina: number) {
  const cleanUri = String(uri ?? '').split('?')[0] ?? '';
  const rawName = cleanUri.includes('/') ? cleanUri.split('/').pop() : cleanUri;

  if (!rawName) {
    return `maquina_${idMaquina}.jpg`;
  }

  return sanitizeFileName(rawName);
}

function getMimeTypeFromUri(uri: string) {
  const lowerUri = String(uri ?? '').trim().toLowerCase();

  if (lowerUri.endsWith('.png')) return 'image/png';
  if (lowerUri.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function uploadMachineImage(idMaquina: number, fileUri: string, token: string) {
  const trimmedFileUri = String(fileUri ?? '').trim();

  if (!trimmedFileUri) {
    return null;
  }

  const response = await uploadAsync(`${API_BASE_URL}/maquinas/${idMaquina}/image`, trimmedFileUri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': getMimeTypeFromUri(trimmedFileUri),
      'X-File-Name': getFileNameFromUri(trimmedFileUri, idMaquina),
    },
  });

  const rawBody = String(response.body ?? '').trim();
  const data = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;

  if (response.status < 200 || response.status >= 300) {
    const message =
      typeof data?.error === 'string' ? data.error : 'No se pudo completar la subida de imagen';
    throw new ApiError(message, response.status);
  }

  return data as MachineDetail;
}
