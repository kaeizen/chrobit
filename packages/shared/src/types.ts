export interface TransitionTask {
  name: string;
  durationSeconds: number;
  description?: string;
}

export type RoutineTransitionPlacement = 'before' | 'between' | 'after';
export type GroupTransitionPlacement = 'before-first-round' | 'between-tasks' | 'after-last-round';

export interface Task {
  id: string;
  name: string;
  durationSeconds: number;
  description?: string;
}

export interface Group {
  id: string;
  name: string;
  repeatCount: number;
  tasks: Task[];
  transitionTask?: TransitionTask;
  transitionPlacements?: GroupTransitionPlacement[]; // defaults to ['between-tasks']
}

export type RoutineItemType = 'task' | 'group';

export interface RoutineItem {
  id: string;
  type: RoutineItemType;
  orderIndex: number;
  task?: Task;
  group?: Group;
}

export interface Routine {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  items: RoutineItem[];
  transitionTask?: TransitionTask;
  transitionPlacements?: RoutineTransitionPlacement[]; // defaults to ['between']
  createdAt: string;
  updatedAt: string;
}

// Flattened step used by the player
export interface FlatStep {
  id: string;
  name: string;
  durationSeconds: number;
  description?: string;
  groupName?: string;
  repeatLabel?: string; // e.g. "Round 2 of 3"
  isTransition?: boolean; // auto-generated between items/tasks
}

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'done';
