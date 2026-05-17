import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE ?? 'supabase';
const LOCAL_TOKEN_KEY = 'routine:token';

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  _bootstrap: () => Promise<void>;
}

function decodeJwt(token: string): { sub: string; email: string } | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as { sub: string; email: string };
  } catch {
    return null;
  }
}

function syntheticUser(sub: string, email: string): User {
  return { id: sub, email, app_metadata: {}, user_metadata: {}, aud: 'local', created_at: '' } as User;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: true,

  async signIn(email, password) {
    if (AUTH_MODE === 'local') {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { token?: string; user?: { id: string; email: string }; error?: string };
      if (!res.ok) return data.error ?? 'Login failed';
      localStorage.setItem(LOCAL_TOKEN_KEY, data.token!);
      set({ user: syntheticUser(data.user!.id, data.user!.email), token: data.token!, loading: false });
      return null;
    }

    const { supabase } = await import('../lib/supabaseClient.js');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  async signUp(email, password) {
    if (AUTH_MODE === 'local') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { token?: string; user?: { id: string; email: string }; error?: string };
      if (!res.ok) return data.error ?? 'Registration failed';
      localStorage.setItem(LOCAL_TOKEN_KEY, data.token!);
      set({ user: syntheticUser(data.user!.id, data.user!.email), token: data.token!, loading: false });
      return null;
    }

    const { supabase } = await import('../lib/supabaseClient.js');
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  },

  async signOut() {
    if (AUTH_MODE === 'local') {
      localStorage.removeItem(LOCAL_TOKEN_KEY);
      set({ user: null, token: null });
      return;
    }
    const { supabase } = await import('../lib/supabaseClient.js');
    await supabase.auth.signOut();
    set({ user: null, token: null });
  },

  async _bootstrap() {
    if (AUTH_MODE === 'local') {
      const token = localStorage.getItem(LOCAL_TOKEN_KEY);
      if (token) {
        const payload = decodeJwt(token);
        if (payload) {
          set({ user: syntheticUser(payload.sub, payload.email), token, loading: false });
          return;
        }
        localStorage.removeItem(LOCAL_TOKEN_KEY);
      }
      set({ loading: false });
      return;
    }

    const { supabase } = await import('../lib/supabaseClient.js');
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    set({ user: session?.user ?? null, token: session?.access_token ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, s) => {
      set({ user: s?.user ?? null, token: s?.access_token ?? null, loading: false });
    });
  },
}));
