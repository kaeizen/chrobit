import { create } from 'zustand';
import type { Routine, RoutineItem } from '@routine/shared';
import { loadLocalRoutines, saveLocalRoutines } from '../lib/storage';

function newId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

interface RoutineStore {
  routines: Routine[];
  add: (title: string, description?: string) => Routine;
  update: (id: string, patch: Partial<Pick<Routine, 'title' | 'description' | 'items' | 'transitionTask' | 'transitionPlacements'>>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  reorder: (id: string, items: RoutineItem[]) => void;
  hydrate: (routines: Routine[]) => void;
}

function persist(routines: Routine[]): Routine[] {
  saveLocalRoutines(routines);
  return routines;
}

export const useRoutineStore = create<RoutineStore>((set, get) => ({
  routines: loadLocalRoutines(),

  add(title, description) {
    const routine: Routine = {
      id: newId(),
      title,
      description,
      items: [],
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ routines: persist([...s.routines, routine]) }));
    return routine;
  },

  update(id, patch) {
    set((s) => ({
      routines: persist(
        s.routines.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: now() } : r
        )
      ),
    }));
  },

  remove(id) {
    set((s) => ({ routines: persist(s.routines.filter((r) => r.id !== id)) }));
  },

  duplicate(id) {
    const src = get().routines.find((r) => r.id === id);
    if (!src) return;
    const copy: Routine = {
      ...src,
      id: newId(),
      title: `${src.title} (copy)`,
      createdAt: now(),
      updatedAt: now(),
      items: src.items.map((item) => ({
        ...item,
        id: newId(),
        task: item.task ? { ...item.task, id: newId() } : undefined,
        group: item.group
          ? {
              ...item.group,
              id: newId(),
              tasks: item.group.tasks.map((t) => ({ ...t, id: newId() })),
            }
          : undefined,
      })),
    };
    set((s) => ({ routines: persist([...s.routines, copy]) }));
  },

  reorder(id, items) {
    set((s) => ({
      routines: persist(
        s.routines.map((r) => (r.id === id ? { ...r, items, updatedAt: now() } : r))
      ),
    }));
  },

  hydrate(routines) {
    set({ routines: persist(routines) });
  },
}));
