import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';

// Drift-free countdown: tracks remaining via Date.now() delta, not setInterval accumulation.
export function useTimer() {
	const TICK_MS = 33

	const status = usePlayerStore((s) => s.status);
	const startEpoch = usePlayerStore((s) => s.startEpoch);
	const pausedRemaining = usePlayerStore((s) => s.pausedRemaining);
	const stepDone = usePlayerStore((s) => s._stepDone);

	const [remainingMs, setRemainingMs] = useState(pausedRemaining);
	const intervalRef = useRef<number | null>(null);
	const doneCalledRef = useRef(false);

	useEffect(() => {
		setRemainingMs(pausedRemaining);
		doneCalledRef.current = false;
	}, [pausedRemaining, startEpoch]);

	useEffect(() => {
		if (status !== 'playing') {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		doneCalledRef.current = false;

		const tick = () => {
			const elapsed = Date.now() - startEpoch;
			const remaining = Math.max(0, pausedRemaining - elapsed);
			setRemainingMs(remaining);

			if (remaining === 0 && !doneCalledRef.current) {
				doneCalledRef.current = true;
				stepDone();
			}
		};

		// Update immediately, then keep a steady heartbeat independent of frame rendering.
		tick();
		intervalRef.current = window.setInterval(tick, TICK_MS);

		return () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [status, startEpoch, pausedRemaining, stepDone]);

	return remainingMs;
}
