import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  async function acquire() {
    if (!('wakeLock' in navigator)) return;
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Not a blocking error — device may just not support it
    }
  }

  function release() {
    lockRef.current?.release();
    lockRef.current = null;
  }

  useEffect(() => {
    if (active) {
      acquire();
    } else {
      release();
    }
    return () => release();
  }, [active]);

  // Re-acquire when tab becomes visible again (lock is released on hide)
  useEffect(() => {
    if (!active) return;
    const handler = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [active]);
}
