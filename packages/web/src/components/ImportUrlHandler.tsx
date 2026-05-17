import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { decodeSharePayload, withFreshIds } from '../lib/share';
import { useRoutineStore } from '../store/routineStore';
import type { Routine } from '@routine/shared';

// Parse the import param at module load time, before any React code runs.
// This guarantees we capture it even if effects or Strict Mode clear the URL.
const _rawImportParam = new URLSearchParams(window.location.search).get('import');
const _parsedImportRoutines: Routine[] | null = (() => {
  if (!_rawImportParam) return null;
  try {
    const routines = decodeSharePayload(_rawImportParam);
    return routines && routines.length > 0 ? routines : null;
  } catch {
    return null;
  }
})();
// true if the URL had ?import= but we couldn't decode it
const _importDecodeError = !!_rawImportParam && !_parsedImportRoutines;

export function ImportUrlHandler() {
  const [, setSearchParams] = useSearchParams();
  const [pending, setPending] = useState<Routine[] | null>(_parsedImportRoutines);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(_parsedImportRoutines?.map((r) => r.id) ?? [])
  );
  const [done, setDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Clean the URL once so refreshing doesn't re-trigger (the data is in module-level vars).
  useEffect(() => {
    if (_rawImportParam) setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleImport() {
    if (!pending) return;
    try {
      const toImport = pending.filter((r) => selected.has(r.id)).map(withFreshIds);
      const store = useRoutineStore.getState();
      store.hydrate([...store.routines, ...toImport]);
      setPending(null);
      setDone(true);
    } catch (err) {
      console.error('Import failed', err);
      alert('Import failed: ' + String(err));
    }
  }

  if (_importDecodeError && !dismissed) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
        <div className="bg-zinc-900 border border-red-900/60 rounded-2xl p-6 w-full max-w-sm">
          <p className="text-red-400 font-semibold mb-2">Could not read shared routines</p>
          <p className="text-zinc-400 text-sm mb-1">
            The QR code could not be decoded. This can happen if the code is outdated.
          </p>
          <p className="text-zinc-600 text-xs mb-4 font-mono break-all">
            param: {_rawImportParam?.slice(0, 60)}…
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 text-sm font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setDone(false)}>
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
          <div className="text-3xl mb-3">✓</div>
          <p className="text-zinc-100 font-semibold mb-1">Routines imported</p>
          <p className="text-zinc-400 text-sm mb-4">Your new routines are ready to use.</p>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="w-full py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-base font-semibold text-zinc-100 mb-1">Import routines</p>
          <p className="text-sm text-zinc-400 mb-4">
            {pending.length} routine{pending.length !== 1 ? 's' : ''} shared with you. Choose which to add.
          </p>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {pending.map((r) => {
              const taskCount = r.items.reduce(
                (n, item) => n + (item.type === 'task' ? 1 : (item.group?.tasks.length ?? 0)),
                0
              );
              return (
                <label key={r.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="w-4 h-4 rounded accent-violet-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 font-medium truncate">{r.title}</div>
                    <div className="text-xs text-zinc-600">{taskCount} task{taskCount !== 1 ? 's' : ''}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={() => setPending(null)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={selected.size === 0}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
          >
            Import ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
