import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useRoutineStore } from '../store/routineStore';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import { useWakeLock } from '../hooks/useWakeLock';
import { TimerRing } from '../components/player/TimerRing';
import { PlayerControls } from '../components/player/PlayerControls';
import { CloseIcon, RestartIcon } from '../components/player/PlayerIcons';

function getAudioPref(): boolean {
  return localStorage.getItem('routine:audio') !== 'false';
}

export function RoutinePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const routines = useRoutineStore((s) => s.routines);
  const { routine, steps, currentIndex, status, load } = usePlayerStore();
  const reset = usePlayerStore((s) => s.reset);

  const remainingMs = useTimer();
  const audio = useAudio(getAudioPref());

  const isPlaying = status === 'playing';
  useWakeLock(isPlaying);

  // Load routine if not already loaded (e.g. direct URL access)
  useEffect(() => {
    if (!id) return;
    if (routine?.id === id) return;
    const found = routines.find((r) => r.id === id);
    if (found) load(found);
  }, [id, routine, routines, load]);

  // Beep when step changes
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      prevIndexRef.current = currentIndex;
      if (status === 'playing') audio.advance();
    }
  }, [currentIndex, status, audio]);

  // Final done sound
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current === 'playing' && status === 'done') {
      audio.done();
    }
    prevStatus.current = status;
  }, [status, audio]);

  const step = steps[currentIndex];
  const nextStep = steps[currentIndex + 1];
  const totalMs = step ? step.durationSeconds * 1000 : 0;
  const ringRemainingMs = remainingMs === 0 && status === 'playing' && nextStep
    ? nextStep.durationSeconds * 1000
    : remainingMs;
  const ringTotalMs = remainingMs === 0 && status === 'playing' && nextStep
    ? nextStep.durationSeconds * 1000
    : totalMs;
  const progress = totalMs > 0 && steps.length > 0
    ? (currentIndex + (1 - remainingMs / totalMs)) / steps.length
    : 0;
  const showDescription = Boolean(step?.description)
  const showNextPreview = Boolean(nextStep && status !== 'done')

  if (!routine || !step) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="text-zinc-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-zinc-950 flex flex-col safe-top safe-bottom">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <CloseIcon />
        </button>
        <div className="text-sm text-zinc-500 font-medium">{routine.title}</div>
        <button
          onClick={() => { reset(); }}
          className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
          aria-label="Restart"
        >
          <RestartIcon />
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="mx-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="text-center text-xs text-zinc-600 mt-2">
        {currentIndex + 1} / {steps.length}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        {/* Group + repeat context */}
        <div className="flex flex-col items-center gap-1 min-h-10">
          <div className="h-5 flex items-center">
            {step.groupName && (
              <span className="text-sm font-semibold text-violet-400 uppercase tracking-wider">
                {step.groupName}
              </span>
            )}
          </div>
          <div className="h-4 flex items-center">
            {step.repeatLabel && (
              <span className="text-xs text-zinc-500">
                {step.repeatLabel}
              </span>
            )}
          </div>
        </div>

        {/* Timer ring */}
        <TimerRing remainingMs={ringRemainingMs} totalMs={ringTotalMs} isPlaying={status === 'playing'} />

        {/* Task name */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-100">{step.name}</h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-xs mx-auto min-h-5">
            {showDescription ? step.description : ''}
          </p>
        </div>

        {/* Done overlay */}
        {status === 'done' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-bold">Done!</h2>
            <p className="text-zinc-400">Great work on "{routine.title}"</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors"
            >
              Back to routines
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6 pb-10">
        <PlayerControls onUnlockAudio={audio.unlock} />

        {/* Next task preview */}
        <div className={`text-center min-h-11 ${showNextPreview ? '' : 'invisible'}`}>
          <span className="text-xs text-zinc-600 uppercase tracking-wider">Next</span>
          <p className="text-sm text-zinc-500 mt-0.5">
            {nextStep?.name || ''}
            {nextStep?.groupName && nextStep.groupName !== step.groupName && (
              <span className="text-zinc-600"> · {nextStep.groupName}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
