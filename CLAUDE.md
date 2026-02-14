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
npm run test:coverage # Run tests with V8 coverage report
npm run test:e2e      # Run Playwright end-to-end tests
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
- Test file naming: `{Component}.test.jsx` for components, `{hook}.test.js` for hooks
- Use Vitest + React Testing Library for unit/integration tests
- Use Playwright for end-to-end browser tests (in `e2e/` directory)
- Shared test helpers in `src/test/renderWithRouter.jsx` (router wrapper for components with `<Link>` or `<HomeButton>`)
- Per-game test helpers in `src/games/{gameName}/test/{gameName}TestHelpers.{tsx,jsx}` (entity factories, config builders)
- Run `npm run test` to verify before committing
- Run `npm run test:coverage` to verify ≥80% coverage for any game with tests
- Target ≥80% statement coverage for each game (current app-wide: 90.35%)
- All 6 games have comprehensive test suites (1,161 unit/integration tests + 74 e2e tests)

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

Every game screen must include a Home button (fixed, top-left). Use the shared `HomeButton` component:

```tsx
import HomeButton from '../../components/HomeButton';

<HomeButton />
// or with dark mode support:
<HomeButton darkMode={darkMode} />
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

### 7. Add tests

Create per-game test helpers and tests following the three-layer pattern. See Golf (turn-based), Race (canvas), or BattlePlanes (DOM real-time) for reference.

**Per-game test helpers** (`test/{gameName}TestHelpers.tsx`):
```tsx
// Factory functions for deterministic test data
export function makeGameConfig(overrides?: Partial<GameConfig>): GameConfig {
  return { difficulty: 'medium', ...overrides }
}
export function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}
```

**Hook unit tests** (turn-based games: `hooks/useGameState.test.js`):
```js
import { renderGameHook, makeSimpleDeck } from '../test/golfTestHelpers.jsx'
import { act } from '@testing-library/react'

it('initializes with correct state', () => {
  const { result } = renderGameHook({ initialDeck: makeSimpleDeck() })
  expect(result.current.players).toHaveLength(2)
})
```

**Engine/utility tests** (real-time games: `game/*.test.ts` or `utils/*.test.ts`):
```ts
import { updatePhysics } from '../utils/physics'
it('applies gravity each frame', () => {
  const result = updatePhysics(entity, deltaTime)
  expect(result.vy).toBeGreaterThan(entity.vy)
})
```

**Component tests** (`components/{Component}.test.tsx`):
```tsx
import { render, screen } from '@testing-library/react'
import { renderWithRouter } from '../../../test/renderWithRouter.jsx'
// Use renderWithRouter for components that render <Link> or <HomeButton>
renderWithRouter(<Component {...props} />)
```

**E2e acceptance tests** (`e2e/{gameName}.spec.js`):
```js
import { test, expect } from '@playwright/test'
test('navigates to game', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/{gameName}"]')
  await expect(page.locator('h1')).toBeVisible()
})
```

**Add game to coverage config** in `vite.config.js`:
```js
coverage: { include: ['src/games/{gameName}/**'] }
```

Target ≥80% statement coverage. Run `npm run test:coverage` to verify.

## Adding Features to Existing Games

### Where to find game logic

- **Turn-based games** (Golf, Checkers, Dots): Logic is in `hooks/useGameState.js`
- **Real-time games** (Race, ArcherFish, BattlePlanes): Logic is in `game/GameEngine.ts` or `components/GameScreen.tsx`
- **AI logic:** Look for `utils/aiLogic.js` or `utils/ai.ts` in the game directory
- **Constants:** Check `constants/index.ts` or `constants/index.js` in the game directory
- **Types:** Check `types.ts` in the game directory, or `src/types/{gameName}/` for shared types

### Dark mode

If adding dark mode to a game that doesn't have it, use the shared `useDarkMode` hook and `DarkModeToggle` component:

```jsx
import { useDarkMode } from '../../hooks/useDarkMode';
import DarkModeToggle from '../../components/DarkModeToggle';

const { darkMode, toggleDarkMode } = useDarkMode('{gameName}:darkMode');

// In your JSX:
<DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
```

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

### Game Implementation

| Pattern | Where to find example |
|---------|----------------------|
| Three-phase state machine | `src/games/race/RaceGame.tsx` |
| Hook-based game state | `src/games/golf/hooks/useGameState.js` |
| Canvas game loop | `src/games/race/components/RaceCanvas.tsx` |
| DOM game loop (intervals) | `src/games/battleplanes/components/GameScreen.tsx` |
| AI opponent (minimax) | `src/games/checkers/utils/aiLogic.js` |
| AI opponent (heuristic) | `src/games/dots/utils/aiLogic.js` |
| AI opponent (behavior) | `src/games/archerfish/utils/ai.ts` |
| Multi-player keyboard input | `src/games/race/RaceGame.tsx` |
| Touch controls | `src/games/race/components/TouchControls.tsx` |
| Dark mode implementation | `src/hooks/useDarkMode.js` |
| Dark mode toggle component | `src/components/DarkModeToggle.jsx` |
| Home button component | `src/components/HomeButton.jsx` |
| localStorage persistence | `src/games/golf/GolfGame.jsx` |
| Error boundary | `src/components/ErrorBoundary.jsx` |
| Score calculation | `src/utils/score.js` |

### Testing

| Pattern | Where to find example |
|---------|----------------------|
| Hook unit testing | `src/games/golf/hooks/useGameState.test.js` |
| Game engine unit testing | `src/games/race/game/GameEngine.test.ts` |
| Physics/collision testing | `src/games/archerfish/utils/physics.test.ts` |
| AI logic testing | `src/games/checkers/utils/aiLogic.test.js` |
| Component integration testing | `src/games/golf/GolfGame.test.jsx` |
| Canvas component testing | `src/games/race/components/RaceCanvas.test.ts` |
| Timer/interval mocking | `src/games/battleplanes/components/GameScreen.test.tsx` |
| RAF animation mocking | `src/games/battleplanes/components/Explosion.test.tsx` |
| Child component mocking | `src/games/battleplanes/components/GameScreen.test.tsx` |
| ErrorBoundary testing | `src/components/ErrorBoundary.test.jsx` |
| Route testing | `src/App.test.jsx` |
| E2e acceptance testing | `e2e/golf.spec.js` |
| Shared test helpers | `src/test/renderWithRouter.jsx` |
| Per-game test helpers (Golf) | `src/games/golf/test/golfTestHelpers.jsx` |
| Per-game test helpers (TS) | `src/games/battleplanes/test/battlePlanesTestHelpers.tsx` |
| Per-game test helpers (JS) | `src/games/dots/test/dotsTestHelpers.jsx` |

## What NOT to Do

- Do not add external state management (Redux, Zustand, MobX, Jotai, etc.)
- Do not add CSS-in-JS libraries (styled-components, Emotion, etc.)
- Do not add server-side state or backend APIs (this is a static frontend app)
- Do not share game state between games (each game is isolated)
- Do not remove the Home button or ErrorBoundary from any game
- Do not change the port (5174) without updating related configuration
- Do not modify existing game behavior without explicit instructions to do so
