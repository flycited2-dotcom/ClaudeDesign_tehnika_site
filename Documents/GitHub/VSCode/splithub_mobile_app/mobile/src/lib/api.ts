import { tokenStorage } from './token-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://splithub.ru/api/mobile.php';

export function buildHeaders(token?: string | null) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function api<T>(
  action: string,
  init: RequestInit = {},
  query: Record<string, string> = {},
): Promise<T> {
  const token = await tokenStorage.get();
  const params = new URLSearchParams({ action, ...query });
  const response = await fetch(`${API_URL}?${params}`, {
    ...init,
    headers: { ...buildHeaders(token), ...init.headers },
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw Object.assign(new Error(data.code ?? 'REQUEST_FAILED'), { data });
  }
  return data as T;
}
