import { useState } from 'react';
import type { TransitionTask } from '@routine/shared';
import { type TaskFormState, EMPTY_FORM, uf, durField } from './builderTypes';
import { formatSecs, CheckIcon, XSmIcon, PencilSmIcon, TrashSmIcon } from './BuilderIcons';
import { InfoTip } from './InfoTip';

function placementIconSvg(value: string) {
  const props = { width: 10, height: 10, viewBox: '0 0 10 10', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (value === 'before' || value === 'before-first-round') return (
    <svg {...props}>
      <line x1="1" y1="1.5" x2="9" y2="1.5" />
      <line x1="5" y1="2.5" x2="5" y2="8.5" />
      <polyline points="3,5 5,2.5 7,5" />
    </svg>
  );
  if (value === 'after' || value === 'after-last-round') return (
    <svg {...props}>
      <line x1="5" y1="1.5" x2="5" y2="7.5" />
      <polyline points="3,5 5,7.5 7,5" />
      <line x1="1" y1="8.5" x2="9" y2="8.5" />
    </svg>
  );
  return (
    <svg {...props}>
      <line x1="5" y1="1" x2="5" y2="9" />
      <polyline points="3,3 5,1 7,3" />
      <polyline points="3,7 5,9 7,7" />
    </svg>
  );
}

export function TransitionTaskRow({
  task,
  onChange,
  onClear,
  hint,
  placementOptions,
  placements,
  onPlacementsChange,
}: {
  task: TransitionTask | undefined;
  onChange: (t: TransitionTask) => void;
  onClear: () => void;
  hint: string;
  placementOptions?: { value: string; label: string }[];
  placements?: string[];
  onPlacementsChange?: (placements: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);

  function startEditing() {
    setForm({ name: task?.name ?? '', duration: String(task?.durationSeconds ?? 30), notes: task?.description ?? '' });
    setEditing(true);
  }

  function handleSave() {
    const name = form.name.trim();
    const dur = parseInt(form.duration, 10);
    if (!name || isNaN(dur) || dur <= 0) return;
    onChange({ name, durationSeconds: dur, description: form.notes.trim() || undefined });
    setEditing(false);
  }

  function togglePlacement(value: string, checked: boolean) {
    const current = placements ?? [];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    if (next.length > 0) onPlacementsChange?.(next);
  }

  if (!task && !editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className="flex items-center gap-2 w-full text-sm text-zinc-600 hover:text-violet-400 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 border border-dashed border-zinc-800 hover:border-violet-800/50 transition-colors"
      >
        <span className="text-base leading-none">+</span>
        <span>Add transition task</span>
        <InfoTip text={hint} />
      </button>
    );
  }

  const activePlacements = task && !editing && placementOptions && placements
    ? placementOptions.map((o) => o.value).filter((v) => placements.includes(v))
    : [];

  return (
    <div className="rounded-xl px-3 py-2.5 border border-dashed border-violet-800/40 bg-violet-950/10">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-violet-500/70">Transition</div>
        {activePlacements.map((p) => {
          const label = placementOptions!.find((o) => o.value === p)!.label;
          return (
            <span key={p} className="relative group/pip inline-flex items-center cursor-default text-violet-400/60 hover:text-violet-300/80 transition-colors">
              {placementIconSvg(p)}
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-300 shadow-lg opacity-0 group-hover/pip:opacity-100 transition-opacity z-50">
                {label}
              </span>
            </span>
          );
        })}
      </div>
      <div className={`flex ${editing ? 'items-end' : 'items-center'} gap-2`}>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className={`${uf} w-full text-sm font-medium text-zinc-100 placeholder-zinc-600`}
              placeholder="Task name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          ) : (
            <div className="font-medium text-sm text-zinc-300 truncate">{task!.name}</div>
          )}
        </div>
        {editing ? (
          <input
            className={durField}
            placeholder="30"
            type="text"
            inputMode="numeric"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
        ) : (
          <span className="text-xs text-zinc-500 shrink-0">{formatSecs(task!.durationSeconds)}</span>
        )}
        {editing ? (
          <>
            <button type="button" onClick={handleSave} className="p-1.5 text-violet-400 hover:text-violet-200 transition-colors" aria-label="Save"><CheckIcon /></button>
            <button type="button" onClick={() => setEditing(false)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors" aria-label="Cancel"><XSmIcon /></button>
          </>
        ) : (
          <>
            <button type="button" onClick={startEditing} className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors" aria-label="Edit"><PencilSmIcon /></button>
            <button type="button" onClick={onClear} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors" aria-label="Remove"><TrashSmIcon /></button>
          </>
        )}
      </div>
      {editing ? (
        <>
          <input
            className={`${uf} w-full text-xs text-zinc-400 placeholder-zinc-600 mt-1`}
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {task && placementOptions && placementOptions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-violet-800/20">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-violet-500/50 mb-1.5">Placement</div>
              <div className="flex flex-col gap-1">
                {placementOptions.map((opt) => {
                  const isChecked = placements?.includes(opt.value) ?? false;
                  const isLast = (placements?.length ?? 0) === 1 && isChecked;
                  return (
                    <label key={opt.value} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isLast}
                        onChange={(e) => togglePlacement(opt.value, e.target.checked)}
                        className="rounded border-zinc-600 bg-zinc-800 accent-violet-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        task!.description && <div className="text-xs text-zinc-600 truncate mt-0.5">{task!.description}</div>
      )}
    </div>
  );
}
