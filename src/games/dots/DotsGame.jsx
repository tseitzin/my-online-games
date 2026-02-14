import { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import EndScreen from './components/EndScreen';
import { useGameState } from './hooks/useGameState';
import HomeButton from '../../components/HomeButton.jsx';
import DarkModeToggle from '../../components/DarkModeToggle.jsx';
import { useDarkMode } from '../../hooks/useDarkMode.js';

export default function DotsGame() {
	const [gameState, setGameState] = useState('setup');
	const { darkMode, toggleDarkMode } = useDarkMode('dots:darkMode');

	const {
		players,
		boardSize,
		currentPlayerIndex,
		lines,
		boxes,
		gameOver,
		winner,
		lastMove,
		initializeGame,
		makeMove,
		resetGame,
		undoLastMove,
	} = useGameState();

	const theme = {
		light: {
			background: '#f8f6f1',
			text: '#222',
			secondaryText: '#666',
		},
		dark: {
			background: '#1a202c',
			text: '#e5e5e5',
			secondaryText: '#a3a3a3',
		},
	};

	const currentTheme = darkMode ? theme.dark : theme.light;

	useEffect(() => {
		document.body.style.backgroundColor = currentTheme.background;
		document.documentElement.style.backgroundColor = currentTheme.background;
	}, [currentTheme.background]);

	const handleStartGame = (config) => {
		initializeGame(config);
		setGameState('playing');
	};

	const handlePlayAgain = () => {
		setGameState('playing');
		resetGame();
	};

	const handleNewGame = () => {
		setGameState('setup');
		resetGame();
	};

	if (gameState === 'setup') {
		return (
			<div style={{ backgroundColor: currentTheme.background, minHeight: '100vh' }}>
				<HomeButton darkMode={darkMode} />
				<DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
				<SetupScreen onStartGame={handleStartGame} darkMode={darkMode} />
			</div>
		);
	}

	return (
		<div style={{ backgroundColor: currentTheme.background, minHeight: '100vh' }}>
			<HomeButton darkMode={darkMode} />
			<DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />

			<GameBoard
				players={players}
				boardSize={boardSize}
				currentPlayerIndex={currentPlayerIndex}
				lines={lines}
				boxes={boxes}
				onLineClick={makeMove}
				onUndo={undoLastMove}
				lastMove={lastMove}
				darkMode={darkMode}
			/>

			{gameOver && (
				<EndScreen
					players={players}
					winner={winner}
					onPlayAgain={handlePlayAgain}
					onNewGame={handleNewGame}
					darkMode={darkMode}
				/>
			)}
		</div>
	);
}
