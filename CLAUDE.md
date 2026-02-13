# Claude Code Development Guide

This file provides instructions for AI agents working on this project.

## Project Overview

**Fun Games!** is a collection of kid-friendly browser games built with React. The app contains 6 games (Golf, Race, Dots and Boxes, Checkers, Archer Fish, Battle Planes) served as a single-page application with client-side routing.

## Development Commands

```bash
npm run dev           # Start dev server (http://localhost:5174)
npm run build         # Production build to dist/
npm run test          # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run preview       # Preview production build
npm run start         # Run Express production server
```

## Code Style & Conventions

### Language

Both TypeScript and JavaScript are used. Either is acceptable for new code. Newer games (Race, ArcherFish, BattlePlanes) use TypeScript; older games (Golf, Checkers, Dots) use JavaScript.

### Naming

- **Components:** PascalCase — `RaceCanvas`, `GameScreen`, `PlayerBoard`
- **Game entry files:** PascalCase ending in "Game" — `RaceGame.tsx`, `GolfGame.jsx`
- **Functions / variables:** camelCase — `createCar`, `handleStartRace`
- **Constants:** UPPER_SNAKE_CASE — `CAR_PHYSICS`, `KEYBOARD_CONTROLS`
- **Types / interfaces:** PascalCase — `Car`, `GameState`, `RaceConfig`
- **Enums:** PascalCase with PascalCase values — `TrackType.Oval`
- **Boolean state:** use `is`/`has` prefix — `isRacing`, `isPaused`
- **localStorage keys:** `{gameName}:{setting}` — `golf:darkMode`, `checkers:darkMode`

### Styling

- Use **inline styles** for dynamic theming, positioning, and game-specific visuals
- Use **Tailwind CSS** utility classes for common layout (flex, grid, padding, etc.)
- Use **Framer Motion** for declarative animations when needed
- Do **not** add CSS-in-JS libraries (styled-components, Emotion, etc.)
- Do **not** use CSS modules for theming

### State Management

- Use **React hooks only** (useState, useRef, useCallback, useEffect, useMemo)
- Do **not** add external state management libraries (Redux, Zustand, MobX, etc.)
- Game state stays local to each game — games do not share state
- Use `useRef` for mutable state that should not trigger re-renders (keyboard inputs, animation frame IDs, timers)

### Testing

- Tests are co-located with source files: `Component.test.jsx` next to `Component.jsx`
- Use Vitest + React Testing Library
- Shared test helpers are in `src/test/gameTestHelpers.js`
- Run `npm run test` to verify before committing

## Adding a New Game

Follow these steps to add a new game to the platform:

### 1. Create the game directory

```
src/games/{gameName}/
├── {GameName}Game.tsx          # Main entry component
├── types.ts                    # Type definitions (if using TypeScript)
├── components/
│   ├── SetupScreen.tsx         # Game configuration UI
│   ├── GameScreen.tsx          # Main gameplay
│   └── EndScreen.tsx           # Results display
├── hooks/
│   └── useGameState.ts        # Game logic (for turn-based games)
├── utils/
│   └── aiLogic.ts              # AI opponent (if applicable)
├── constants/
│   └── index.ts                # Game constants
└── assets/                     # Game-specific images/assets
```

### 2. Implement the three-phase state machine

Every game must follow the Setup → Playing → Results lifecycle:

```tsx
export default function NewGame() {
  const [gamePhase, setGamePhase] = useState('setup');
  const [gameConfig, setGameConfig] = useState(null);

  if (gamePhase === 'setup') {
    return <SetupScreen onStart={(config) => {
      setGameConfig(config);
      setGamePhase('playing');
    }} />;
  }

  if (gamePhase === 'playing') {
    return <GameScreen config={gameConfig} onEnd={(results) => {
      setGamePhase('results');
    }} />;
  }

  return <EndScreen onPlayAgain={() => setGamePhase('setup')} />;
}
```

### 3. Add the Home button

Every game screen must include a Home button (fixed, top-left):

```tsx
import { Link } from 'react-router-dom';

<Link
  to="/"
  style={{
    position: 'fixed',
    top: 16,
    left: 16,
    background: '#fff',
    color: '#1a202c',
    border: '2px solid #1a202c',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 1000,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.3s ease',
  }}
>
  ← Home
</Link>
```

### 4. Add the route

Add a route in `src/main.jsx`:

```jsx
import NewGame from './games/{gameName}/{GameName}Game.tsx'

<Route path="/{gameName}" element={<NewGame />} />
```

### 5. Add to the Home page

Add a game card to the `games` array in `src/pages/Home.jsx`:

```jsx
{
  id: '{gameName}',
  name: 'Game Display Name',
  description: 'Brief description of the game.',
  path: '/{gameName}',
  emoji: '🎮',
  color: '#hexcolor',
},
```

### 6. Add documentation

Create `docs/{gameName}.md` following the template used by existing game docs (Overview, How to Play, Controls, Scoring, Game Options, Features).

## Adding Features to Existing Games

### Where to find game logic

- **Turn-based games** (Golf, Checkers, Dots): Logic is in `hooks/useGameState.js`
- **Real-time games** (Race, ArcherFish, BattlePlanes): Logic is in `game/GameEngine.ts` or `components/GameScreen.tsx`
- **AI logic:** Look for `utils/aiLogic.js` or `utils/ai.ts` in the game directory
- **Constants:** Check `constants/index.ts` or `constants/index.js` in the game directory
- **Types:** Check `types.ts` in the game directory, or `src/types/{gameName}/` for shared types

### Dark mode

If adding dark mode to a game that doesn't have it, follow this pattern:

```jsx
const [darkMode, setDarkMode] = useState(() => {
  try {
    const saved = localStorage.getItem('{gameName}:darkMode');
    return saved ? JSON.parse(saved) : false;
  } catch { return false; }
});

useEffect(() => {
  try { localStorage.setItem('{gameName}:darkMode', JSON.stringify(darkMode)); }
  catch { /* ignore */ }
}, [darkMode]);
```

Add a toggle button fixed to the top-right corner.

### Game loop (real-time games)

For real-time games using Canvas or physics:

```tsx
const animationRef = useRef<number>();
const lastTimeRef = useRef<number>(0);

const gameLoop = useCallback((timestamp: number) => {
  const deltaTime = timestamp - lastTimeRef.current;
  lastTimeRef.current = timestamp;

  // Update game state using deltaTime for frame-rate independence
  // Render to canvas or update React state

  animationRef.current = requestAnimationFrame(gameLoop);
}, [dependencies]);

useEffect(() => {
  animationRef.current = requestAnimationFrame(gameLoop);
  return () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };
}, [gameLoop]);
```

## Common Patterns Reference

| Pattern | Where to find example |
|---------|----------------------|
| Three-phase state machine | `src/games/race/RaceGame.tsx` |
| Hook-based game state | `src/games/golf/hooks/useGameState.js` |
| Canvas game loop | `src/games/race/components/RaceCanvas.tsx` |
| AI opponent (minimax) | `src/games/checkers/utils/aiLogic.js` |
| AI opponent (heuristic) | `src/games/dots/utils/aiLogic.js` |
| Multi-player keyboard input | `src/games/race/RaceGame.tsx` |
| Touch controls | `src/games/race/components/TouchControls.tsx` |
| Dark mode implementation | `src/games/golf/GolfGame.jsx` |
| localStorage persistence | `src/games/golf/GolfGame.jsx` |
| Error boundary | `src/components/ErrorBoundary.jsx` |
| Score calculation | `src/utils/score.js` |

## What NOT to Do

- Do not add external state management (Redux, Zustand, MobX, Jotai, etc.)
- Do not add CSS-in-JS libraries (styled-components, Emotion, etc.)
- Do not add server-side state or backend APIs (this is a static frontend app)
- Do not share game state between games (each game is isolated)
- Do not remove the Home button or ErrorBoundary from any game
- Do not change the port (5174) without updating related configuration
- Do not modify existing game behavior without explicit instructions to do so
