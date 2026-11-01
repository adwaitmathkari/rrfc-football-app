import { BACKEND } from './backends';
import type { Session } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// Kept in memory only; the long-lived refresh token is an httpOnly cookie the browser manages.
let accessToken: string | null = null;
let refreshInFlight: Promise<Session | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const { label, url } = BACKEND;
  try {
    return await fetch(`${url}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, `Cannot reach the ${label} backend at ${url}`);
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? (res.statusText || 'Request failed'));
  return data as T;
}

/** Exchanges the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<Session | null> {
  refreshInFlight ??= send('POST', '/api/auth/refresh')
    .then((res) => (res.ok ? parse<Session>(res) : null))
    .catch(() => null)
    .then((session) => {
      accessToken = session?.accessToken ?? null;
      return session;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res = await send(method, path, body);
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    const session = await refreshSession();
    if (!session) {
      onSessionExpired?.();
      throw new ApiError(401, 'Your session has expired. Please log in again.');
    }
    res = await send(method, path, body);
  }
  return parse<T>(res);
}
