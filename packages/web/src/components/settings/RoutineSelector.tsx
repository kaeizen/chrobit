import type { Routine } from '@routine/shared';

export function selectAllIds(routines: Routine[]): Set<string> {
  return new Set(routines.map((r) => r.id));
}

export function RoutineSelector({
  routines,
  selected,
  onChange,
  emptyText = 'No routines.',
}: {
  routines: Routine[];
  selected: Set<string>;
  onChange: (id: string, checked: boolean) => void;
  emptyText?: string;
}) {
  if (routines.length === 0) {
    return <p className="text-sm text-zinc-600 py-2">{emptyText}</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {routines.map((r) => {
        const taskCount = r.items.reduce(
          (n, item) => n + (item.type === 'task' ? 1 : (item.group?.tasks.length ?? 0)),
          0
        );
        return (
          <label
            key={r.id}
            className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(r.id)}
              onChange={(e) => onChange(r.id, e.target.checked)}
              className="w-4 h-4 rounded accent-violet-500 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-zinc-200 font-medium truncate">{r.title}</div>
              <div className="text-xs text-zinc-600">
                {taskCount} task{taskCount !== 1 ? 's' : ''}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
