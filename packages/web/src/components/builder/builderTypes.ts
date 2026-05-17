import type { RoutineItem, Task } from '@routine/shared';

export interface TaskFormState { name: string; duration: string; notes: string; }
export const EMPTY_FORM: TaskFormState = { name: '', duration: '60', notes: '' };

export const uf = "bg-transparent border-b border-zinc-700 focus:border-violet-500 px-0 py-0.5 focus:outline-none transition-colors";
export const durField = `${uf} w-14 text-xs text-zinc-500 placeholder-zinc-600 text-right shrink-0`;

export function newId(): string { return crypto.randomUUID(); }

export type DragKind =
  | { kind: 'main-task'; item: RoutineItem }
  | { kind: 'group-item'; item: RoutineItem }
  | { kind: 'group-task'; task: Task; groupId: string };

export type Containers = Record<string, string[]>;
export type DragMetrics = { top: number | null; height: number; centerY: number | null };
