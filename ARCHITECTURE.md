# Architecture

Technical documentation for the Fun Games platform.

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| Vite | 7 | Build tool and dev server |
| Tailwind CSS | 4 | Utility-first styling |
| TypeScript / JavaScript | - | Both used (newer games use TS) |
| React Router DOM | 7 | Client-side routing |
| Framer Motion | 12 | Animations |
| Lucide React | 0.562 | Icons |
| Express | 5 | Production server |
| Vitest | 3 | Test runner |
| React Testing Library | 16 | Component testing |
| ESLint | 9 | Linting |
| PropTypes | 15 | Runtime type checking (JS games) |

## Application Architecture

```mermaid
graph TB
    subgraph Browser
        EP[main.jsx<br/>Entry Point]
        EP --> EB[ErrorBoundary]
        EB --> Router[BrowserRouter]
        Router --> Home["/ Home"]
        Router --> G1["/golf"]
        Router --> G2["/race"]
        Router --> G3["/dots"]
        Router --> G4["/checkers"]
        Router --> G5["/archerfish"]
        Router --> G6["/battleplanes"]
    end

    subgraph Shared
        EB
        LS[(localStorage)]
        G1 <-.-> LS
        G2 <-.-> LS
        G3 <-.-> LS
        G4 <-.-> LS
        G5 <-.-> LS
        G6 <-.-> LS
    end

    style Home fill:#f0fdf4,stroke:#14532d
    style EB fill:#fef2f2,stroke:#dc2626
    style LS fill:#fffbeb,stroke:#d97706
```

Each game is a fully isolated route. Games share no state with each other — only the `ErrorBoundary` and `localStorage` are shared infrastructure.

## Project Structure

```
src/
├── main.jsx                    # App entry point (router setup)
├── index.css                   # Global styles (Tailwind imports)
├── App.css                     # App-level styles
├── setupTests.js               # Vitest configuration
├── pages/
│   └── Home.jsx                # Home page with game selector grid
├── components/
│   └── ErrorBoundary.jsx       # Shared error boundary (wraps all routes)
├── games/
│   ├── golf/                   # Golf card game (JavaScript)
│   ├── race/                   # Race game (TypeScript)
│   ├── dots/                   # Dots and Boxes (JavaScript)
│   ├── checkers/               # Checkers (JavaScript)
│   ├── archerfish/             # Archer Fish (TypeScript)
│   └── battleplanes/           # Battle Planes (TypeScript)
├── types/
│   └── race/index.ts           # Shared type definitions
├── constants/
│   └── race/index.ts           # Shared constants
├── utils/
│   └── score.js                # Golf scoring utilities
├── assets/                     # Images, SVGs, game assets
└── test/
    └── gameTestHelpers.js      # Shared test utilities
```

## Routing

Defined in `src/main.jsx`. Each game is a top-level route with its own isolated state:

```mermaid
graph LR
    Home["🏠 Home<br/>(/)"] --> Golf["⛳ Golf<br/>(/golf)"]
    Home --> Race["🏎️ Race<br/>(/race)"]
    Home --> Dots["🔲 Dots<br/>(/dots)"]
    Home --> Checkers["👑 Checkers<br/>(/checkers)"]
    Home --> Archer["🐠 Archer Fish<br/>(/archerfish)"]
    Home --> Battle["✈️ Battle Planes<br/>(/battleplanes)"]

    Golf -->|← Home| Home
    Race -->|← Home| Home
    Dots -->|← Home| Home
    Checkers -->|← Home| Home
    Archer -->|← Home| Home
    Battle -->|← Home| Home

    style Home fill:#f0fdf4,stroke:#14532d
```

All routes are wrapped in a shared `ErrorBoundary` component. Each game provides a fixed-position Home button (top-left) to navigate back.

## Game Architecture

### Three-Phase Lifecycle

Every game follows a **Setup → Playing → Results** state machine pattern:

```mermaid
stateDiagram-v2
    [*] --> Setup
    Setup --> Playing : onStart(config)
    Playing --> Results : onEnd(results)
    Results --> Setup : Play Again

    state Setup {
        [*] --> ConfigureOptions
        ConfigureOptions --> Ready : User selects settings
    }

    state Playing {
        [*] --> GameLoop
        GameLoop --> GameLoop : Each frame/turn
        GameLoop --> GameOver : Win/loss/timeout
    }

    state Results {
        [*] --> ShowScores
    }
```

**Implementation pattern:**

```jsx
const [gamePhase, setGamePhase] = useState('setup');

if (gamePhase === 'setup') return <SetupScreen onStart={...} />;
if (gamePhase === 'playing') return <GameScreen onEnd={...} />;
if (gamePhase === 'results') return <ResultsScreen onPlayAgain={...} />;
```

#### Per-Game State Variations

While all games follow the same three-phase pattern, they use slightly different state names:

```mermaid
stateDiagram-v2
    direction LR

    state "Race Game" as Race {
        r1: setup
        r2: countdown
        r3: racing
        r4: finished
        r1 --> r2
        r2 --> r3
        r3 --> r4
        r4 --> r1
    }

    state "ArcherFish" as AF {
        a1: setup
        a2: playing
        a3: results
        a1 --> a2
        a2 --> a3
        a3 --> a1
    }

    state "Golf / Checkers / Dots" as GCD {
        g1: setup
        g2: playing
        g3: end
        g1 --> g2
        g2 --> g3
        g3 --> g1
    }
```

### Per-Game Directory Structure

Each game directory follows this layout:

```
games/{gameName}/
├── {GameName}Game.tsx/.jsx     # Main entry (state machine wrapper)
├── types.ts                    # Type definitions (TS games)
├── components/
│   ├── SetupScreen.tsx         # Configuration phase
│   ├── GameScreen.tsx          # Playing phase
│   ├── EndScreen.tsx           # Results phase
│   └── [EntityComponents]      # Game-specific UI
├── game/                       # Game engine (canvas-based games)
│   ├── GameEngine.ts           # Core simulation logic
│   ├── Car.ts / Track.ts       # Entity logic and rendering
│   └── ...
├── hooks/
│   └── useGameState.js         # State management (hook-based games)
├── utils/
│   ├── aiLogic.js/.ts          # AI opponent logic
│   ├── physics.ts              # Physics/collision (action games)
│   └── ...
├── constants/
│   └── index.js/.ts            # Game-specific constants
└── assets/                     # Game-specific images
```

## State Management

No external state management libraries. All state is managed with React hooks. The project uses two distinct approaches depending on game type:

```mermaid
graph TB
    subgraph "Approach 1: Hook-Based State"
        direction TB
        GC1[GameComponent] -->|destructures| Hook[useGameState Hook]
        Hook -->|returns state + actions| GC1
        Hook --> S1[useState - board]
        Hook --> S2[useState - players]
        Hook --> S3[useState - currentTurn]
        Hook --> S4[useCallback - makeMove]
        GC1 --> UI1[Board Component]
        GC1 --> UI2[Piece Components]
        GC1 --> UI3[Score Display]

        style Hook fill:#dbeafe,stroke:#2563eb
    end

    subgraph "Approach 2: Component + Game Loop"
        direction TB
        GC2[GameComponent] -->|manages phases| GS[GameScreen / Canvas]
        GS --> RAF[requestAnimationFrame Loop]
        RAF --> Physics[Update Physics<br/>deltaTime]
        Physics --> Render[Render Frame]
        Render --> RAF
        GC2 --> Input[Input Refs<br/>useRef]
        Input -.->|polled each frame| RAF

        style RAF fill:#fef3c7,stroke:#d97706
    end
```

### Approach 1: Hook-Based State (Turn-Based Games)

Used by **Golf**, **Checkers**, and **Dots and Boxes**.

A custom `useGameState` hook encapsulates all game logic:

```jsx
// hooks/useGameState.js
export function useGameState() {
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  // ... 20+ state variables
  // ... game logic functions
  return { board, currentPlayer, makeMove, ... };
}
```

The main game component destructures the hook and renders UI:

```jsx
function CheckersGame() {
  const { board, currentPlayer, makeMove, ... } = useGameState();
  return <GameBoard board={board} onMove={makeMove} />;
}
```

### Approach 2: Component + Game Loop (Real-Time Games)

Used by **Race**, **ArcherFish**, and **Battle Planes**.

The main component manages configuration and phase transitions. A separate canvas or game screen component runs a `requestAnimationFrame` loop:

```tsx
// components/RaceCanvas.tsx
const gameLoop = useCallback((timestamp: number) => {
  const deltaTime = timestamp - lastTimeRef.current;
  lastTimeRef.current = timestamp;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update physics
  const { cars: updatedCars, finished } = updateRaceState(
    currentCars, deltaTime, inputs, targetLaps
  );

  // Draw entities
  currentCars.forEach(car => drawCar(ctx, car, position, rotation));

  animationRef.current = requestAnimationFrame(gameLoop);
}, [dependencies]);
```

**Key patterns:**
- Delta time tracking via refs (`lastTimeRef.current`)
- `useRef` for mutable state that shouldn't trigger re-renders (pressed keys, animation frame IDs)
- `useCallback` memoization for the game loop
- Cleanup with `cancelAnimationFrame` in `useEffect` return

## Rendering Approaches

The project uses two rendering strategies based on game requirements:

```mermaid
graph TB
    subgraph "Canvas Rendering (Real-Time Games)"
        direction TB
        C1["Race: Full Canvas"] --> C2["Single &lt;canvas&gt; element"]
        C2 --> C3["ctx.clearRect() every frame"]
        C3 --> C4["Draw track → Draw cars"]

        C5["ArcherFish / BattlePlanes: Hybrid"] --> C6["DOM container + positioned divs"]
        C6 --> C7["Game loop updates React state"]
        C7 --> C8["React re-renders entity components"]
    end

    subgraph "DOM Rendering (Turn-Based Games)"
        direction TB
        D1["Golf / Checkers / Dots"] --> D2["React components for everything"]
        D2 --> D3["CSS Grid / Flexbox layouts"]
        D3 --> D4["Framer Motion / CSS transitions"]
        D4 --> D5["onClick / onDrag handlers"]
    end

    style C1 fill:#fef3c7,stroke:#d97706
    style C5 fill:#fef3c7,stroke:#d97706
    style D1 fill:#dbeafe,stroke:#2563eb
```

### Canvas API (Action/Physics Games)

**Race** uses a single `<canvas>` element with manual drawing:
- Track drawn with paths, fills, and strokes
- Cars drawn with `ctx.save()` / `ctx.translate()` / `ctx.rotate()` / `ctx.restore()`
- Full clear-and-redraw each frame

**ArcherFish** and **Battle Planes** use a hybrid approach:
- Background/arena rendered as React components or divs
- Entities (fish, robots, planes) rendered as positioned React components
- Game loop updates state, React re-renders components

### React DOM Components (Turn-Based Games)

**Golf**, **Checkers**, and **Dots** render everything as React components:
- Board grids as CSS grid or flex layouts
- Pieces/cards as styled divs or SVG elements
- Animations via Framer Motion or CSS transitions
- Click/drag handlers directly on elements

## Game Loop (Real-Time Games)

The real-time games use a `requestAnimationFrame`-based game loop with delta time for frame-rate independent updates:

```mermaid
flowchart TB
    Start([useEffect mounts]) --> Init[Start requestAnimationFrame]
    Init --> Loop

    subgraph Loop["Game Loop (every ~16ms)"]
        direction TB
        TS[Get timestamp] --> DT["Calculate deltaTime<br/>timestamp - lastTimeRef"]
        DT --> Save["Update lastTimeRef"]
        Save --> Poll["Poll input refs<br/>(keyboard + touch)"]
        Poll --> Update["Update game state<br/>(physics, positions, collisions)"]
        Update --> Check{"Game over?"}
        Check -->|No| Draw["Render frame<br/>(clear + draw)"]
        Draw --> Next["requestAnimationFrame(gameLoop)"]
        Check -->|Yes| End["Call onRaceFinished()<br/>Cancel animation frame"]
    end

    Next --> Loop
    Unmount([useEffect cleanup]) --> Cancel["cancelAnimationFrame()"]

    style Loop fill:#f8fafc,stroke:#94a3b8
```

## AI Implementations

Each game implements its own AI logic. No shared AI framework.

```mermaid
graph LR
    subgraph "Search-Based"
        A1["Checkers<br/>Minimax + Alpha-Beta"] --> A1f["aiLogic.js"]
        A2["Dots<br/>Best-Move Heuristic"] --> A2f["aiLogic.js"]
    end

    subgraph "Statistical"
        B1["Golf<br/>Expected Value<br/>Calculation"] --> B1f["useGameState.js"]
    end

    subgraph "Behavior-Based"
        C1["ArcherFish<br/>Evade + Navigate"] --> C1f["ai.ts"]
        C2["Race<br/>Speed Target +<br/>Lane Correction"] --> C2f["GameEngine.ts"]
    end

    subgraph "Scripted"
        D1["BattlePlanes<br/>Flight Paths"] --> D1f["GameScreen.tsx"]
    end

    style A1 fill:#dbeafe,stroke:#2563eb
    style A2 fill:#dbeafe,stroke:#2563eb
    style B1 fill:#fef3c7,stroke:#d97706
    style C1 fill:#dcfce7,stroke:#16a34a
    style C2 fill:#dcfce7,stroke:#16a34a
    style D1 fill:#f3e8ff,stroke:#9333ea
```

| Game | Approach | File |
|------|----------|------|
| Checkers | Minimax with alpha-beta pruning | `games/checkers/utils/aiLogic.js` |
| Golf | Statistical (expected value of unknown cards) | `games/golf/hooks/useGameState.js` |
| Dots | Best-move heuristic (box completion priority) | `games/dots/utils/aiLogic.js` |
| Race | Simple speed targeting with lane correction | `games/race/game/GameEngine.ts` |
| ArcherFish | Behavior-based (evade robots, navigate obstacles) | `games/archerfish/utils/ai.ts` |
| Battle Planes | Enemy planes follow predefined flight paths | `games/battleplanes/components/GameScreen.tsx` |

## Input Handling

The Race game demonstrates the most complex input handling, merging multiple input sources:

```mermaid
flowchart LR
    subgraph Sources
        KB["Keyboard Events<br/>(keydown/keyup)"]
        TC["Touch Controls<br/>(on-screen buttons)"]
    end

    KB -->|"pressedKeysRef<br/>(Set&lt;string&gt;)"| Merge
    TC -->|"touchInputs<br/>(useState)"| Merge

    Merge["getCombinedInputs()"] --> PI["PlayerInputs<br/>{accelerate, brake,<br/>turnLeft, turnRight}"]

    PI -->|"polled via ref<br/>each frame"| GL["Game Loop"]
    GL --> Physics["Update Car Physics"]

    style Merge fill:#dbeafe,stroke:#2563eb
    style GL fill:#fef3c7,stroke:#d97706
```

### Multi-Player Keyboard (Race)

Four control schemes defined in `src/constants/race/index.ts`:

| Player | Accelerate | Brake | Left | Right |
|--------|-----------|-------|------|-------|
| 1 | W / Space / ArrowUp | S / ArrowDown | A / ArrowLeft | D / ArrowRight |
| 2 | ArrowUp | ArrowDown | ArrowLeft | ArrowRight |
| 3 | I | K | J | L |
| 4 | Numpad8 | Numpad5 | Numpad4 | Numpad6 |

Input is tracked via a `Set<string>` ref of pressed key codes, polled each frame.

### Touch Controls (Race)

On-screen buttons rendered as React components. Touch inputs merged with keyboard inputs via `getCombinedInputs()`.

### Mouse (Battle Planes)

Mouse position for aiming, click to fire.

### Click/Tap (Golf, Checkers, Dots)

Direct element interaction via React `onClick` handlers.

## Styling

### Approach

The project uses a hybrid styling strategy:

1. **Inline styles** for dynamic theming, positioning, and game-specific visuals
2. **Tailwind CSS utilities** for common layout patterns (flex, grid, padding, etc.)
3. **CSS files** for animations (card flips in Golf)
4. **Framer Motion** for declarative animations (Checkers piece movement)

No CSS-in-JS libraries (styled-components, Emotion, etc.) are used.

### Dark Mode Pattern

```mermaid
flowchart LR
    Init["Component Mount"] -->|"read"| LS[(localStorage<br/>gameName:darkMode)]
    LS --> State["useState(darkMode)"]
    State --> Theme{"darkMode?"}
    Theme -->|true| Dark["Dark Theme<br/>#1a202c bg<br/>#e5e5e5 text"]
    Theme -->|false| Light["Light Theme<br/>#f8f6f1 bg<br/>#222 text"]
    Dark --> Apply["Apply to<br/>document.body +<br/>components"]
    Light --> Apply
    Toggle["Toggle Button<br/>(fixed top-right)"] -->|"onClick"| State
    State -->|"useEffect"| LS

    style Dark fill:#1e293b,stroke:#475569,color:#e5e5e5
    style Light fill:#fefce8,stroke:#a16207
```

Games that support dark mode use a consistent pattern:

```jsx
const [darkMode, setDarkMode] = useState(() => {
  const saved = localStorage.getItem('{gameName}:darkMode');
  return saved ? JSON.parse(saved) : false;
});

const theme = {
  light: { background: '#f8f6f1', text: '#222', ... },
  dark: { background: '#1a202c', text: '#e5e5e5', ... },
};

const currentTheme = darkMode ? theme.dark : theme.light;
```

### Common UI Elements

**Home Button:** Fixed top-left, present on every game screen. Uses React Router `<Link to="/">`.

**Dark Mode Toggle:** Fixed top-right. Persists to localStorage.

**Setup Screen:** Card-based layout with options for player count, difficulty, game settings.

**End Screen:** Results display with "Play Again" button.

### Screen Layout

```mermaid
graph TB
    subgraph "Every Game Screen"
        direction TB
        HB["← Home<br/>(fixed top-left)"] ~~~ DM["☀/🌙 Toggle<br/>(fixed top-right)"]
        HB ~~~ Content["Game Content<br/>(Setup / Playing / Results)"]
        DM ~~~ Content
    end

    style HB fill:#f0fdf4,stroke:#14532d
    style DM fill:#fffbeb,stroke:#d97706
    style Content fill:#f8fafc,stroke:#94a3b8
```

## Persistence

All persistence uses `localStorage` with a `{gameName}:{setting}` key convention:

```mermaid
flowchart LR
    subgraph "localStorage Keys"
        direction TB
        K1["golf:darkMode"]
        K2["golf:aiSpeed"]
        K3["checkers:darkMode"]
        K4["dots:darkMode"]
        K5["archerfish:leaderboard"]
    end

    subgraph "Pattern"
        direction TB
        Read["useState initializer<br/>reads from localStorage"]
        Write["useEffect<br/>writes on change"]
        Read --> Write
    end

    style K1 fill:#f0fdf4,stroke:#14532d
    style K2 fill:#f0fdf4,stroke:#14532d
    style K3 fill:#f0fdf4,stroke:#14532d
    style K4 fill:#f0fdf4,stroke:#14532d
    style K5 fill:#f0fdf4,stroke:#14532d
```

Only user preferences are persisted. Game state is not saved between sessions (except Golf which saves in-progress games).

## Performance Patterns

```mermaid
flowchart TB
    subgraph "Avoid Re-renders"
        R1["useRef for mutable state<br/>(keyboard inputs, animation IDs, timers)"]
        R2["useCallback for stable references<br/>(game loops, event handlers)"]
    end

    subgraph "Efficient Rendering"
        R3["Canvas: clear → draw background → draw entities<br/>(single batch per frame)"]
        R4["Delta time for frame-rate independence<br/>(physics * deltaTime)"]
    end

    style R1 fill:#dbeafe,stroke:#2563eb
    style R2 fill:#dbeafe,stroke:#2563eb
    style R3 fill:#dcfce7,stroke:#16a34a
    style R4 fill:#dcfce7,stroke:#16a34a
```

1. **Refs for non-rendering state:** Keyboard inputs, animation frame IDs, and mutable game state use `useRef` to avoid unnecessary re-renders
2. **useCallback memoization:** Game loops and event handlers are wrapped in `useCallback`
3. **Canvas batch rendering:** Clear → draw background → draw all entities in a single frame
4. **Delta time:** Physics updates use time-based deltas for frame-rate independent movement

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase | `RaceCanvas`, `GameScreen` |
| Game entry files | PascalCase + "Game" | `RaceGame.tsx`, `GolfGame.jsx` |
| Functions / variables | camelCase | `createCar`, `handleStartRace` |
| Constants | UPPER_SNAKE_CASE | `CAR_PHYSICS`, `KEYBOARD_CONTROLS` |
| Types / interfaces | PascalCase | `Car`, `GameState`, `RaceConfig` |
| Enums | PascalCase | `TrackType.Oval` |
| Boolean state | `is` / `has` prefix | `isRacing`, `isPaused`, `hasError` |
| localStorage keys | `{game}:{setting}` | `golf:darkMode` |

## Testing

- **Runner:** Vitest with jsdom environment
- **Component testing:** React Testing Library
- **Setup:** `src/setupTests.js`
- **Helpers:** `src/test/gameTestHelpers.js`
- **Test co-location:** Tests live next to their source files (`Component.test.jsx`)

Run tests:
```bash
npm run test          # Single run
npm run test:watch    # Watch mode
```
