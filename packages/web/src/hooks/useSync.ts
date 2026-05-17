import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRoutineStore } from '../store/routineStore';
import { api } from '../lib/api';

// On login: pull routines from the API and hydrate the local store.
// Works identically in both dev (postgres) and prod (supabase).
export function useSync() {
  const user = useAuthStore((s) => s.user);
  const hydrate = useRoutineStore((s) => s.hydrate);

  useEffect(() => {
    if (!user) return;

    async function pull() {
      try {
        const routines = await api.listRoutines();
        hydrate(routines);
      } catch (err) {
        console.error('Sync pull failed:', err);
      }
    }

    pull();
  }, [user, hydrate]);
}

export async function pushRoutine(routineId: string): Promise<void> {
  const { routines } = useRoutineStore.getState();
  const routine = routines.find((r) => r.id === routineId);
  if (!routine) return;
  try {
    await api.createRoutine(routine);
  } catch {
    await api.updateRoutine(routine);
  }
}

export async function deleteRoutineRemote(id: string): Promise<void> {
  await api.deleteRoutine(id);
}
