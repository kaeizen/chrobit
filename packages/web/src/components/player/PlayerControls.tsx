import { usePlayerStore } from '../../store/playerStore';

interface Props {
  onUnlockAudio: () => void;
}

export function PlayerControls({ onUnlockAudio }: Props) {
  const status = usePlayerStore((s) => s.status);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);

  function handlePlayPause() {
    onUnlockAudio();
    if (status === 'idle' || status === 'done') {
      play();
    } else if (status === 'playing') {
      pause();
    } else {
      resume();
    }
  }

  const isPlaying = status === 'playing';

  return (
    <div className="flex items-center gap-6">
      <button
        onClick={prev}
        className="p-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-2xl transition-colors"
        aria-label="Previous step"
      >
        <PrevIcon />
      </button>

      <button
        onClick={handlePlayPause}
        className="w-20 h-20 rounded-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white flex items-center justify-center transition-colors shadow-lg shadow-violet-900/40"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        onClick={next}
        className="p-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-2xl transition-colors"
        aria-label="Next step"
      >
        <NextIcon />
      </button>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
