import type { Routine } from '@routine/shared';

const BASE = import.meta.env.VITE_API_URL as string | undefined;
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE ?? 'supabase';

async function authHeader(): Promise<Record<string, string>> {
  if (AUTH_MODE === 'local') {
    const token = localStorage.getItem('routine:token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  const { supabase } = await import('./supabaseClient.js');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeader();
  const res = await fetch(`${BASE ?? ''}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...headers, ...options.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listRoutines: () => request<Routine[]>('/api/routines'),
  createRoutine: (r: Routine) => request<Routine>('/api/routines', { method: 'POST', body: JSON.stringify(r) }),
  updateRoutine: (r: Routine) => request<Routine>(`/api/routines/${r.id}`, { method: 'PUT', body: JSON.stringify(r) }),
  deleteRoutine: (id: string) => request<void>(`/api/routines/${id}`, { method: 'DELETE' }),
};
