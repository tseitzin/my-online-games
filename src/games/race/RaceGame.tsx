import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, RaceConfig, Car, PlayerInputs, CarConfig, TrackType } from '../../types/race';
import { CAR_COLORS, KEYBOARD_CONTROLS } from '../../constants/race/index.ts';
import HomeButton from '../../components/HomeButton';
import { createCar } from './game/GameEngine';
import { SetupScreen } from './components/SetupScreen';
import { generateAICars } from './utils/aiCars';
import { RaceCanvas } from './components/RaceCanvas';
import { RaceHUD } from './components/RaceHUD';
import { TouchControls } from './components/TouchControls';
import { Countdown } from './components/Countdown';
import { EndScreen } from './components/EndScreen';

const getInitialConfig = (): RaceConfig => ({
	humanPlayers: 1,
	aiRacers: 3,
	laps: 3,
	playerConfigs: [
		{ color: CAR_COLORS[0].value, number: 1, style: 0 },
	],
	trackType: TrackType.Oval,
});

export default function RaceGame() {
	const [gameState, setGameState] = useState<GameState>('setup');
	const [raceConfig, setRaceConfig] = useState<RaceConfig>(getInitialConfig);
	const [cars, setCars] = useState<Car[]>([]);
	const [touchInputs, setTouchInputs] = useState<PlayerInputs>({});
	const pressedKeysRef = useRef<Set<string>>(new Set());
	const keyboardInputsRef = useRef<PlayerInputs>({});

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			pressedKeysRef.current.add(e.code);
			updateKeyboardInputs();
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			pressedKeysRef.current.delete(e.code);
			updateKeyboardInputs();
		};

	const updateKeyboardInputs = () => {
		const inputs: PlayerInputs = {};
		for (let i = 0; i < raceConfig.humanPlayers; i++) {
			const controls = KEYBOARD_CONTROLS[i];
			if (controls) {
				const hasAccelerate = pressedKeysRef.current.has(controls.accelerate);
				const hasAlternate = 'alternate' in controls && pressedKeysRef.current.has(controls.alternate as string);

				// For player 0, also check arrow keys in addition to WASD
				const arrowControls = i === 0 ? KEYBOARD_CONTROLS[1] : null;
				const hasArrowAccelerate = arrowControls && pressedKeysRef.current.has(arrowControls.accelerate);
				const hasArrowBrake = arrowControls && pressedKeysRef.current.has(arrowControls.brake);
				const hasArrowLeft = arrowControls && pressedKeysRef.current.has(arrowControls.turnLeft);
				const hasArrowRight = arrowControls && pressedKeysRef.current.has(arrowControls.turnRight);

				inputs[i] = {
					accelerate: hasAccelerate || hasAlternate || hasArrowAccelerate,
					brake: pressedKeysRef.current.has(controls.brake) || hasArrowBrake,
					turnLeft: pressedKeysRef.current.has(controls.turnLeft) || hasArrowLeft,
					turnRight: pressedKeysRef.current.has(controls.turnRight) || hasArrowRight,
				};
			}
		}
		keyboardInputsRef.current = inputs;
	};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [raceConfig.humanPlayers]);

	const getCombinedInputs = useCallback((): PlayerInputs => {
		const combined: PlayerInputs = {};
		for (let i = 0; i < raceConfig.humanPlayers; i++) {
			const keyboard = keyboardInputsRef.current[i] || { accelerate: false, brake: false, turnLeft: false, turnRight: false };
			const touch = touchInputs[i] || { accelerate: false, brake: false, turnLeft: false, turnRight: false };
			combined[i] = {
				accelerate: keyboard.accelerate || touch.accelerate,
				brake: keyboard.brake || touch.brake,
				turnLeft: keyboard.turnLeft || touch.turnLeft,
				turnRight: keyboard.turnRight || touch.turnRight,
			};
		}
		return combined;
	}, [raceConfig.humanPlayers, touchInputs]);

	const initializeRace = useCallback(() => {
		const usedColors = raceConfig.playerConfigs.map(p => p.color);
		const usedNumbers = raceConfig.playerConfigs.map(p => p.number);
		const aiCarsConfig = generateAICars(raceConfig.aiRacers, usedColors, usedNumbers);

		const allCars: Car[] = [];
		let lane = 0;

		raceConfig.playerConfigs.forEach((config, index) => {
			const carConfig: CarConfig = {
				id: `player-${index}`,
				color: config.color,
				number: config.number,
				isAI: false,
				playerIndex: index,
			};
			allCars.push(createCar(carConfig, lane++, false));
		});

		aiCarsConfig.forEach((config, index) => {
			const carConfig: CarConfig = {
				id: `ai-${index}`,
				color: config.color,
				number: config.number,
				isAI: true,
			};
			allCars.push(createCar(carConfig, lane++, true));
		});

		setCars(allCars);
	}, [raceConfig]);

	const handleStartRace = useCallback(() => {
		initializeRace();
		setGameState('countdown');
	}, [initializeRace]);

	const handleCountdownComplete = useCallback(() => {
		setGameState('racing');
	}, []);

	const handleRaceFinished = useCallback(() => {
		setGameState('finished');
	}, []);

	const handleRaceAgain = useCallback(() => {
		setCars([]);
		setTouchInputs({});
		setGameState('setup');
	}, []);

	const handleCarsUpdate = useCallback((updatedCars: Car[]) => {
		setCars(updatedCars);
	}, []);

	const playerColors = raceConfig.playerConfigs.map(p => p.color);

	if (gameState === 'setup') {
		return (
			<>
				<HomeButton />
				<SetupScreen
					config={raceConfig}
					onConfigChange={setRaceConfig}
					onStartRace={handleStartRace}
				/>
			</>
		);
	}

	return (
		<div style={{ position: 'fixed', inset: 0, backgroundColor: '#111827', overflow: 'hidden' }}>
			<HomeButton />

			<RaceCanvas
				cars={cars}
				isRacing={gameState === 'racing'}
				targetLaps={raceConfig.laps}
				trackType={raceConfig.trackType}
				playerInputs={getCombinedInputs()}
				onCarsUpdate={handleCarsUpdate}
				onRaceFinished={handleRaceFinished}
			/>

		<RaceHUD cars={cars} targetLaps={raceConfig.laps} trackType={raceConfig.trackType} />

			{gameState !== 'finished' && (
				<TouchControls
					playerCount={raceConfig.humanPlayers}
					playerColors={playerColors}
					currentInputs={touchInputs}
					onInputChange={setTouchInputs}
				/>
			)}

			{gameState === 'countdown' && (
				<Countdown onComplete={handleCountdownComplete} />
			)}

			{gameState === 'finished' && (
				<EndScreen cars={cars} onRaceAgain={handleRaceAgain} />
			)}
		</div>
	);
}
