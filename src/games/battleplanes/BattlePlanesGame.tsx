import { useState } from 'react';
import HomeButton from '../../components/HomeButton';
import GameSetup from './components/GameSetup';
import GameScreen from './components/GameScreen';
import type { GameConfig } from './types';

export default function BattlePlanesGame() {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
  };

  const handleExitGame = () => {
    setGameConfig(null);
  };

  return (
    <>
      <HomeButton />

      {gameConfig ? (
        <GameScreen config={gameConfig} onExit={handleExitGame} />
      ) : (
        <GameSetup onStartGame={handleStartGame} />
      )}
    </>
  );
}
