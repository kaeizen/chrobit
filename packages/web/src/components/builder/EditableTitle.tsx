import { useState } from 'react';

export function EditableTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() {
    const t = draft.trim();
    if (t) onChange(t);
    else setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        className="flex-1 bg-transparent border-b border-violet-500 px-0 py-2 text-xl font-bold text-zinc-100 focus:outline-none"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        autoFocus
      />
    );
  }
  return (
    <button
      type="button"
      className="flex-1 text-left text-xl font-bold text-zinc-100 hover:text-zinc-300 py-2 truncate"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </button>
  );
}
