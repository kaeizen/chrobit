import type { SupabaseClient } from '@supabase/supabase-js';
import type { Routine } from '@routine/shared';
import type { IRoutineRepo } from './IRoutineRepo.js';

type DbRow = Record<string, unknown>;

function toRoutine(row: DbRow): Routine {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    items: row.items as Routine['items'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class SupabaseRoutineRepo implements IRoutineRepo {
  constructor(private readonly client: SupabaseClient) {}

  async list(userId: string): Promise<Routine[]> {
    const { data, error } = await this.client
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as DbRow[]).map(toRoutine);
  }

  async create(routine: Routine, userId: string): Promise<Routine> {
    const { data, error } = await this.client
      .from('routines')
      .insert({ id: routine.id, user_id: userId, title: routine.title, description: routine.description ?? null, items: routine.items, created_at: routine.createdAt, updated_at: routine.updatedAt })
      .select()
      .single();
    if (error) throw error;
    return toRoutine(data as DbRow);
  }

  async update(id: string, userId: string, patch: Partial<Pick<Routine, 'title' | 'description' | 'items'>>): Promise<Routine | null> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) payload.title = patch.title;
    if ('description' in patch) payload.description = patch.description ?? null;
    if (patch.items !== undefined) payload.items = patch.items;

    const { data, error } = await this.client
      .from('routines')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data ? toRoutine(data as DbRow) : null;
  }

  async remove(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('routines')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
