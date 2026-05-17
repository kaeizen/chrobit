export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-4 border-b border-zinc-800 last:border-0"
    >
      <span className="text-zinc-200">{label}</span>
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-zinc-700'} relative`}>
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </button>
  );
}
