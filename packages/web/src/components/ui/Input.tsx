import { type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-zinc-400">{label}</label>}
      <input
        {...props}
        className={`bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors ${error ? 'border-red-500' : ''} ${className}`}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
