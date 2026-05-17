interface Props {
	remainingMs: number;
	totalMs: number;
	isPlaying?: boolean;
	size?: number;
}

export function TimerRing({ remainingMs, totalMs, isPlaying = false, size = 280 }: Props) {
	const radius = (size - 24) / 2
	const circumference = 2 * Math.PI * radius
	const edgeSnapMs = 120
	const snappedRemaining = totalMs > 0
		? remainingMs >= totalMs - edgeSnapMs
			? totalMs
			: remainingMs
		: 0
	const progress = totalMs > 0 ? snappedRemaining / totalMs : 0
	const offset = circumference * (1 - progress)

	const baseSecs = Math.ceil(remainingMs / 1000)
	const totalSecs = isPlaying && remainingMs > 0
		? Math.max(0, baseSecs - 1)
		: baseSecs
	const mins = Math.floor(totalSecs / 60)
	const secs = totalSecs % 60
	const display = mins > 0
		? `${mins}:${String(secs).padStart(2, '0')}`
		: String(secs)

	const isLow = totalMs > 0 && remainingMs <= 10_000
	const trackStroke = isLow ? '#3f1f1f' : '#27272a'

	return (
		<div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
				{/* Track */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={trackStroke}
					strokeWidth="12"
					style={{ transition: 'stroke 160ms linear' }}
				/>
				{/* Progress */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={isLow ? '#ef4444' : '#7c3aed'}
					strokeWidth="12"
					strokeLinecap="butt"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					style={{ transition: 'stroke-dashoffset 50ms linear' }}
				/>
			</svg>
			<span
				className={`text-7xl font-bold tabular-nums tracking-tight select-none ${isLow ? 'text-red-400' : 'text-zinc-100'}`}
				style={{ fontSize: mins > 0 ? '3.5rem' : '4.5rem' }}
			>
				{display}
			</span>
		</div>
	)
}
