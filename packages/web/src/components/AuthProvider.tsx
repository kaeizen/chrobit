import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSync } from '../hooks/useSync';

export function AuthProvider() {
  const bootstrap = useAuthStore((s) => s._bootstrap);
  useEffect(() => { bootstrap(); }, [bootstrap]);
  useSync();
  return null;
}
