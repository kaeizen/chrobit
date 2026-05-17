export function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative group/tip inline-flex items-center shrink-0">
      <span className="text-zinc-600 hover:text-zinc-400 cursor-default text-[11px] leading-none select-none transition-colors">ⓘ</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 leading-relaxed shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 whitespace-normal">
        {text}
      </span>
    </span>
  );
}
