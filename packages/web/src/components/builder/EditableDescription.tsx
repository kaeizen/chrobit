import { useState } from 'react';

export function EditableDescription({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      className="w-full bg-transparent resize-none text-sm text-zinc-400 placeholder-zinc-600 focus:outline-none border-b border-zinc-800 focus:border-zinc-700 pb-2 transition-colors"
      placeholder="Add a description…"
      value={value}
      rows={focused || value ? 2 : 1}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}
