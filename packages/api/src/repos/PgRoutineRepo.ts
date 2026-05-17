import type { Pool } from 'pg';
import type { Routine } from '@routine/shared';
import type { IRoutineRepo } from './IRoutineRepo.js';

type DbRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  items: Routine['items'];
  created_at: string;
  updated_at: string;
};

function toRoutine(row: DbRow): Routine {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    items: row.items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgRoutineRepo implements IRoutineRepo {
  constructor(private readonly pool: Pool) {}

  async list(userId: string): Promise<Routine[]> {
    const { rows } = await this.pool.query<DbRow>(
      'SELECT * FROM routines WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    return rows.map(toRoutine);
  }

  async create(routine: Routine, userId: string): Promise<Routine> {
    const { rows } = await this.pool.query<DbRow>(
      `INSERT INTO routines (id, user_id, title, description, items, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [routine.id, userId, routine.title, routine.description ?? null, JSON.stringify(routine.items), routine.createdAt, routine.updatedAt]
    );
    return toRoutine(rows[0]);
  }

  async update(id: string, userId: string, patch: Partial<Pick<Routine, 'title' | 'description' | 'items'>>): Promise<Routine | null> {
    const sets: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let i = 1;

    if (patch.title !== undefined) { sets.push(`title = $${i++}`); values.push(patch.title); }
    if ('description' in patch) { sets.push(`description = $${i++}`); values.push(patch.description ?? null); }
    if (patch.items !== undefined) { sets.push(`items = $${i++}`); values.push(JSON.stringify(patch.items)); }

    values.push(id, userId);
    const { rows } = await this.pool.query<DbRow>(
      `UPDATE routines SET ${sets.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
      values
    );
    return rows[0] ? toRoutine(rows[0]) : null;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.pool.query('DELETE FROM routines WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}
