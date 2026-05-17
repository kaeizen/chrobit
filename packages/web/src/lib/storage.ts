import type { Routine } from '@routine/shared';

const KEY = 'routine:routines';

export function loadLocalRoutines(): Routine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Routine[];
  } catch {
    return [];
  }
}

export function saveLocalRoutines(routines: Routine[]): void {
  localStorage.setItem(KEY, JSON.stringify(routines));
}
