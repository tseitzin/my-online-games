// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Lightbulb, HelpCircle } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { GAME_STATES } from './constants';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import EndScreen from './components/EndScreen';
import HomeButton from '../../components/HomeButton.jsx';
import DarkModeToggle from '../../components/DarkModeToggle.jsx';
import { useDarkMode } from '../../hooks/useDarkMode.js';


const CheckersGame = () => {
  const {
    gameState,
    board,
    currentTurn,
    selectedPiece,
    validMoves,
    winner,
    lastMove,
    showHints,
    currentHint,
    selectPiece,
    movePiece,
    startGame,
    resetGame,
    toggleHints,
    getHintMove,
    removedPieces
  } = useGameState();

  const { darkMode, toggleDarkMode } = useDarkMode('checkers:darkMode');

  const handleSquareClick = (row, col) => {
    const piece = board[row][col];

    if (selectedPiece && validMoves.some(m => m.row === row && m.col === col)) {
      movePiece(row, col);
    } else if (piece && piece.color === currentTurn) {
      selectPiece(row, col);
    }
  };



  if (gameState === GAME_STATES.SETUP) {
    // Use a light/dark background for setup, matching DotsGame
    const setupBg = darkMode ? '#1a202c' : '#f8f6f1';
    return (
      <div style={{ backgroundColor: setupBg, minHeight: '100vh' }}>
        <HomeButton darkMode={darkMode} />
        <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
        <SetupScreen onStartGame={startGame} darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: darkMode ? '#1a202c' : '#f8f6f1', overflow: 'hidden' }}>
      <HomeButton darkMode={darkMode} />
      <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Scoreboard (left) and GameBoard (center) */}
          <div className="flex flex-row gap-8 items-start justify-center">
            {/* Scoreboard (left) */}
            <div className="flex flex-col gap-6 items-end pr-2">
              <div className="bg-white rounded-xl shadow p-4 w-32 text-center">
                <div className="font-bold text-red-500">Red</div>
                <div className="text-sm mt-2">On board: {board.flat().filter(p => p && p.color === "red").length}</div>
                <div className="text-sm">Removed: {removedPieces["red"].length}</div>
                <div className="text-sm">Kings: {board.flat().filter(p => p && p.color === "red" && p.type === "king").length}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 w-32 text-center">
                <div className="font-bold text-gray-700">Black</div>
                <div className="text-sm mt-2">On board: {board.flat().filter(p => p && p.color === "black").length}</div>
                <div className="text-sm">Removed: {removedPieces["black"].length}</div>
                <div className="text-sm">Kings: {board.flat().filter(p => p && p.color === "black" && p.type === "king").length}</div>
              </div>
            </div>
            {/* Game board (center) */}
            <GameBoard
              board={board}
              selectedPiece={selectedPiece}
              validMoves={validMoves}
              onSquareClick={handleSquareClick}
              lastMove={lastMove}
              currentHint={currentHint}
              darkMode={darkMode}
            />
          </div>
          <div className="w-full lg:w-80">
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Parent/Teacher Mode</h3>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleHints}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                  showHints
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Lightbulb size={20} />
                {showHints ? 'Hints Enabled' : 'Enable Hints'}
              </motion.button>

              {showHints && (
                <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={getHintMove}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  <HelpCircle size={20} />
                  Show Hint
                </motion.button>
              )}

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Game Rules:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Pieces move diagonally forward on dark squares</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>You must capture when possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span>Multiple jumps in one turn are allowed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Reach the opposite end to become a King</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Kings can move forward and backward</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Legend:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 opacity-60"></div>
                    <span className="text-gray-600">Valid move</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 opacity-60"></div>
                    <span className="text-gray-600">Must capture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-yellow-400"></div>
                    <span className="text-gray-600">Selected/Last move</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-400"></div>
                    <span className="text-gray-600">Hint</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {gameState === GAME_STATES.ENDED && (
        <EndScreen
          winner={winner}
          onPlayAgain={resetGame}
          onBackToMenu={resetGame}
        />
      )}
    </div>
  );
};

export default CheckersGame;
