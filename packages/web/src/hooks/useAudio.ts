import { useCallback, useRef } from 'react';

// Web Audio API beep — no audio file required, works offline.
export function useAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  // Must be called from a user gesture to unlock AudioContext on iOS/Safari.
  const unlock = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
  }, []);

  const beep = useCallback(
    (frequency = 880, durationMs = 120, volume = 0.4) => {
      if (!enabled) return;
      const ctx = ctxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);
    },
    [enabled]
  );

  const countdown = useCallback(() => beep(660, 80, 0.3), [beep]);
  const advance = useCallback(() => beep(880, 150, 0.5), [beep]);
  const done = useCallback(() => {
    beep(880, 150, 0.5);
    setTimeout(() => beep(1100, 200, 0.5), 200);
  }, [beep]);

  return { unlock, beep, countdown, advance, done };
}
