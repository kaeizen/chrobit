import { type ReactNode, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 text-2xl leading-none">&times;</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
