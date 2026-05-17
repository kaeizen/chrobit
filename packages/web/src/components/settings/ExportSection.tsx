import { useState } from 'react';
import type { Routine } from '@routine/shared';
import { type SharePayload } from '../../lib/share';
import { RoutineSelector, selectAllIds } from './RoutineSelector';

export function ExportSection({ routines }: { routines: Routine[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => selectAllIds(routines));

  function toggle(id: string, checked: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleExport() {
    const toExport = routines.filter((r) => selected.has(r.id));
    if (!toExport.length) return;
    const payload: SharePayload = { version: 1, routines: toExport };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routines-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Select routines to export</p>
        <div className="flex gap-3">
          <button
            type="button"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            onClick={() => setSelected(selectAllIds(routines))}
          >
            All
          </button>
          <button
            type="button"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            onClick={() => setSelected(new Set())}
          >
            None
          </button>
        </div>
      </div>
      <RoutineSelector
        routines={routines}
        selected={selected}
        onChange={toggle}
        emptyText="No routines to export."
      />
      <button
        type="button"
        onClick={handleExport}
        disabled={selected.size === 0}
        className="w-full py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
      >
        Export JSON ({selected.size})
      </button>
    </div>
  );
}
