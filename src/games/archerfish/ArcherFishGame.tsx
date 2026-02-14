import { useState } from 'react';
import type { GameConfig, Fish } from './types';
import HomeButton from '../../components/HomeButton';
import GameSetup from './components/GameSetup';
import GameScreen from './components/GameScreen';
import GameResults from './components/GameResults';

type GamePhase = 'setup' | 'playing' | 'results';

export default function ArcherFishGame() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [finalResults, setFinalResults] = useState<Fish[]>([]);

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
    setGamePhase('playing');
  };

  const handleGameEnd = (fish: Fish[]) => {
    setFinalResults(fish);
    setGamePhase('results');
  };

  const handlePlayAgain = () => {
    setGamePhase('setup');
    setGameConfig(null);
    setFinalResults([]);
  };

  return (
    <>
      <HomeButton />

      {gamePhase === 'setup' && <GameSetup onStartGame={handleStartGame} />}
      {gamePhase === 'playing' && gameConfig && (
        <GameScreen config={gameConfig} onGameEnd={handleGameEnd} />
      )}
      {gamePhase === 'results' && gameConfig && (
        <GameResults
          fish={finalResults}
          config={gameConfig}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
}
