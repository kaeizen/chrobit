import { type ReactNode } from 'react';
import { type TaskFormState, uf, durField } from './builderTypes';
import { CheckIcon, XSmIcon } from './BuilderIcons';

export function InlineEditRows({
  form,
  setForm,
  onSave,
  onCancel,
  handleSlot,
  namePlaceholder = 'Task name',
}: {
  form: TaskFormState;
  setForm: (f: TaskFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  handleSlot: ReactNode;
  namePlaceholder?: string;
}) {
  return (
    <>
      <div className="flex items-end gap-2">
        {handleSlot}
        <input
          className={`${uf} flex-1 min-w-0 text-sm font-medium text-zinc-100 placeholder-zinc-600`}
          placeholder={namePlaceholder}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          autoFocus
        />
        <input
          className={durField}
          placeholder="60"
          type="text"
          inputMode="numeric"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value.replace(/\D/g, '') })}
        />
        <button
          type="button"
          onClick={onSave}
          disabled={!form.name.trim() || !form.duration || parseInt(form.duration, 10) <= 0}
          className="p-1.5 text-violet-400 hover:text-violet-200 transition-colors disabled:text-zinc-700 disabled:cursor-not-allowed"
          aria-label="Save"
        ><CheckIcon /></button>
        <button type="button" onClick={onCancel} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors" aria-label="Cancel"><XSmIcon /></button>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="w-8 shrink-0" />
        <input
          className={`${uf} flex-1 min-w-0 text-xs text-zinc-400 placeholder-zinc-600`}
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </>
  );
}
