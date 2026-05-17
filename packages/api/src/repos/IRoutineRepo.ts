import type { Routine } from '@routine/shared';

export interface IRoutineRepo {
  list(userId: string): Promise<Routine[]>;
  create(routine: Routine, userId: string): Promise<Routine>;
  update(id: string, userId: string, patch: Partial<Pick<Routine, 'title' | 'description' | 'items'>>): Promise<Routine | null>;
  remove(id: string, userId: string): Promise<void>;
}
