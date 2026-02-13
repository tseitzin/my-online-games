import { useMemo } from 'react';
import { Car, TrackType } from '../../../types/race';

interface RaceHUDProps {
	cars: Car[];
	targetLaps: number;
	trackType: TrackType;
}

const POSITION_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function RaceHUD({ cars, targetLaps, trackType }: RaceHUDProps) {
	const sortedCars = useMemo(() =>
		[...cars].sort((a, b) => {
			if (a.finished && b.finished) {
				return (a.finishPosition || 0) - (b.finishPosition || 0);
			}
			if (a.finished) return -1;
			if (b.finished) return 1;

			if (b.lapsCompleted !== a.lapsCompleted) {
				return b.lapsCompleted - a.lapsCompleted;
			}
			return b.trackProgress - a.trackProgress;
		}),
		[cars]
	);

	// Position scoreboard based on track type
	const getPositionClasses = () => {
		switch (trackType) {
			case TrackType.Figure8:
				// For Figure-8, place at top to avoid crossing point
				return 'absolute top-4 left-1/2 -translate-x-1/2';
			case TrackType.RoadCourse:
				// For complex tracks, place at top right
				return 'absolute top-4 right-4';
			default:
				// For Oval and Speedway, center is fine (infield area)
				return 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
		}
	};

	return (
		<div className={`${getPositionClasses()} bg-black/60 rounded-lg px-4 py-2 backdrop-blur-sm`}>
			<div className="flex gap-2.5 flex-wrap justify-center max-w-5xl">
				{sortedCars.map((car, index) => (
					<div
						key={car.id}
						className="flex items-center gap-2 px-2.5 py-1 rounded"
						style={{ backgroundColor: `${car.color}40` }}
					>
						<span
							className="text-xs font-bold px-2 py-0.5 rounded"
							style={{
								backgroundColor: POSITION_COLORS[index] || '#666',
								color: index < 3 ? '#000' : '#fff',
							}}
						>
							{index + 1}
						</span>
						<div
							className="w-3.5 h-3.5 rounded-full border border-white"
							style={{ backgroundColor: car.color }}
						/>
						<span className="text-white font-bold text-sm">
							#{car.number}
						</span>
						<span className="text-white/80 text-xs">
							{car.finished ? 'Done' : `${Math.min(car.lapsCompleted + 1, targetLaps)}/${targetLaps}`}
						</span>
						{!car.isAI && (
							<span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
								P{(car.playerIndex ?? 0) + 1}
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
