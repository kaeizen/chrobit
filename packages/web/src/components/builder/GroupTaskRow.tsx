import { useState, type ReactNode } from 'react';
import type { Task } from '@routine/shared';
import { type TaskFormState, EMPTY_FORM } from './builderTypes';
import { formatSecs, PencilSmIcon, TrashSmIcon } from './BuilderIcons';
import { InlineEditRows } from './InlineEditRows';

export function GroupTaskRow({
  task,
  onSave,
  onDelete,
  dragHandle,
}: {
  task: Task;
  onSave: (data: TaskFormState) => void;
  onDelete: () => void;
  dragHandle: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);

  function startEditing() {
    setForm({ name: task.name, duration: String(task.durationSeconds), notes: task.description ?? '' });
    setEditing(true);
  }

  function handleSave() {
    const name = form.name.trim();
    const dur = parseInt(form.duration, 10);
    if (!name || isNaN(dur) || dur <= 0) return;
    onSave(form);
    setEditing(false);
  }

  return (
    <div className="bg-zinc-800 rounded-xl px-3 py-2.5">
      {editing ? (
        <InlineEditRows
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          handleSlot={<div className="w-8 shrink-0" />}
        />
      ) : (
        <div className="flex items-center gap-2">
          {dragHandle}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-zinc-100 truncate">{task.name}</div>
            {task.description && <div className="text-xs text-zinc-600 truncate mt-0.5">{task.description}</div>}
          </div>
          <span className="text-xs text-zinc-500 shrink-0">{formatSecs(task.durationSeconds)}</span>
          <button type="button" onClick={startEditing} className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"><PencilSmIcon /></button>
          <button type="button" onClick={onDelete} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"><TrashSmIcon /></button>
        </div>
      )}
    </div>
  );
}
