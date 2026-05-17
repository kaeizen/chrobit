import { type DragKind } from './builderTypes';
import { formatSecs, GripIcon } from './BuilderIcons';

export function DragPreview({ activeId, dragLookup }: { activeId: string; dragLookup: Map<string, DragKind> }) {
  const entry = dragLookup.get(activeId);
  if (!entry) return null;

  if (entry.kind === 'group-task') {
    return (
      <div className="bg-zinc-800 rounded-xl px-3 py-2.5 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 text-zinc-500"><GripIcon /></div>
          <div className="flex-1 font-medium text-sm text-zinc-100 truncate">{entry.task.name}</div>
          <span className="text-xs text-zinc-500">{formatSecs(entry.task.durationSeconds)}</span>
        </div>
      </div>
    );
  }
  if (entry.kind === 'main-task' && entry.item.task) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 text-zinc-500"><GripIcon /></div>
          <div className="flex-1 font-medium text-sm text-zinc-100 truncate">{entry.item.task.name}</div>
          <span className="text-xs text-zinc-500">{formatSecs(entry.item.task.durationSeconds)}</span>
        </div>
      </div>
    );
  }
  if (entry.kind === 'group-item' && entry.item.group) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-3 py-2.5 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 text-zinc-500"><GripIcon /></div>
          <span className="font-semibold text-sm text-violet-300">{entry.item.group.name}</span>
          <span className="text-xs text-zinc-500 ml-1">×{entry.item.group.repeatCount}</span>
        </div>
      </div>
    );
  }
  return null;
}
