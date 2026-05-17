import { create } from 'zustand';
import type { FlatStep, PlayerStatus, Routine } from '@routine/shared';
import { flattenRoutine } from '../lib/flatten';

interface PlayerState {
  routine: Routine | null;
  steps: FlatStep[];
  currentIndex: number;
  status: PlayerStatus;
  startEpoch: number; // ms when current step began
  pausedRemaining: number; // ms remaining when paused

  load: (routine: Routine) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  _stepDone: () => void; // called by timer when countdown reaches zero
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  routine: null,
  steps: [],
  currentIndex: 0,
  status: 'idle',
  startEpoch: 0,
  pausedRemaining: 0,

  load(routine) {
    set({
      routine,
      steps: flattenRoutine(routine),
      currentIndex: 0,
      status: 'idle',
      startEpoch: 0,
      pausedRemaining: 0,
    });
  },

  play() {
    const { steps, currentIndex } = get();
    if (!steps.length) return;
    set({
      status: 'playing',
      startEpoch: Date.now(),
      pausedRemaining: steps[currentIndex].durationSeconds * 1000,
    });
  },

  pause() {
    const { status, startEpoch, pausedRemaining } = get();
    if (status !== 'playing') return;
    const elapsed = Date.now() - startEpoch;
    set({ status: 'paused', pausedRemaining: Math.max(0, pausedRemaining - elapsed) });
  },

  resume() {
    const { status } = get();
    if (status !== 'paused') return;
    set({ status: 'playing', startEpoch: Date.now() });
  },

  next() {
    const { steps, currentIndex } = get();
    const next = currentIndex + 1;
    if (next >= steps.length) {
      set({ status: 'done' });
      return;
    }
    set({
      currentIndex: next,
      startEpoch: Date.now(),
      pausedRemaining: steps[next].durationSeconds * 1000,
      status: 'playing',
    });
  },

  prev() {
    const { steps, currentIndex } = get();
    const prev = Math.max(0, currentIndex - 1);
    set({
      currentIndex: prev,
      startEpoch: Date.now(),
      pausedRemaining: steps[prev].durationSeconds * 1000,
      status: 'playing',
    });
  },

  reset() {
    const { steps } = get();
    if (!steps.length) return;
    set({
      currentIndex: 0,
      status: 'idle',
      startEpoch: 0,
      pausedRemaining: steps[0].durationSeconds * 1000,
    });
  },

  _stepDone() {
    get().next();
  },
}));
