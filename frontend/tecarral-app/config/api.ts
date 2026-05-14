import Constants from 'expo-constants';

function readExpoConfigApiBaseUrl() {
  const extra = Constants.expoConfig?.extra;
  const value = typeof extra?.apiBaseUrl === 'string' ? extra.apiBaseUrl.trim() : '';
  return value;
}

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || '';
const expoConfigApiBaseUrl = readExpoConfigApiBaseUrl();

export const API_BASE_URL =
  envApiBaseUrl || expoConfigApiBaseUrl || 'http://92.4.216.179:3000/api';
