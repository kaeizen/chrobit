import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Routine } from '@routine/shared';
import { totalRoutineDuration } from '../../lib/flatten';
import { useRoutineStore } from '../../store/routineStore';
import { usePlayerStore } from '../../store/playerStore';
import { Button } from '../ui/Button';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

interface Props {
  routine: Routine;
}

export function RoutineCard({ routine }: Props) {
  const navigate = useNavigate();
  const remove = useRoutineStore((s) => s.remove);
  const duplicate = useRoutineStore((s) => s.duplicate);
  const load = usePlayerStore((s) => s.load);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const duration = totalRoutineDuration(routine);
  const taskCount = routine.items.length;

  function handleStart() {
    load(routine);
    navigate(`/play/${routine.id}`);
  }

  function handleEdit() {
    navigate(`/builder/${routine.id}`);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-zinc-100 truncate text-base">{routine.title}</h2>
          {routine.description && (
            <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{routine.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleEdit}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Edit routine"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => duplicate(routine.id)}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Duplicate routine"
          >
            <CopyIcon />
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Delete routine"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <span>{taskCount} {taskCount === 1 ? 'item' : 'items'}</span>
        {duration > 0 && <span>{formatDuration(duration)}</span>}
      </div>

      <Button onClick={handleStart} size="md" className="w-full">
        Start
      </Button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setConfirmOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-zinc-100 font-semibold mb-1">Delete routine?</p>
            <p className="text-zinc-400 text-sm mb-5">"{routine.title}" will be permanently removed.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button type="button" onClick={() => { remove(routine.id); setConfirmOpen(false); }} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
