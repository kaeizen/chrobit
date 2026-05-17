import { useState, useRef } from 'react';
import type { Routine } from '@routine/shared';
import { type SharePayload, withFreshIds } from '../../lib/share';
import { useRoutineStore } from '../../store/routineStore';
import { RoutineSelector, selectAllIds } from './RoutineSelector';

export function ImportSection() {
  const existingRoutines = useRoutineStore((s) => s.routines);
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<Routine[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function toggle(id: string, checked: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setDone(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as SharePayload;
        if (data.version !== 1 || !Array.isArray(data.routines)) throw new Error();
        setParsed(data.routines);
        setSelected(selectAllIds(data.routines));
      } catch {
        setError('Invalid file — expected a Routine export JSON.');
        setParsed(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleImport() {
    if (!parsed) return;
    const toImport = parsed.filter((r) => selected.has(r.id)).map(withFreshIds);
    if (!toImport.length) return;
    const store = useRoutineStore.getState();
    store.hydrate([...store.routines, ...toImport]);
    setParsed(null);
    setSelected(new Set());
    setDone(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full py-2.5 text-sm font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
      >
        Choose JSON file…
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && !parsed && <p className="text-sm text-green-400">Routines imported successfully.</p>}

      {parsed && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Select routines to import</p>
            <div className="flex gap-3">
              <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={() => setSelected(selectAllIds(parsed))}>All</button>
              <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={() => setSelected(new Set())}>None</button>
            </div>
          </div>
          <RoutineSelector routines={parsed} selected={selected} onChange={toggle} />
          <button
            type="button"
            onClick={handleImport}
            disabled={selected.size === 0}
            className="w-full py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
          >
            Import selected ({selected.size})
          </button>
          <p className="text-xs text-zinc-600">
            Imported routines are added alongside your existing {existingRoutines.length} routine{existingRoutines.length !== 1 ? 's' : ''}.
          </p>
        </>
      )}
    </div>
  );
}
