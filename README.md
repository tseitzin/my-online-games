# Fun Games!

A collection of kid-friendly online games built with React. Play card games, board games, racing, and action games — all in your browser!

## Games

### Golf Card Game
A digital implementation of the card game "Golf" (also known as "Play Nine"). Players manage a 4x2 grid of cards across 9 holes, trying to achieve the lowest score through strategic swapping and matching.

- **Players:** 2-6 (human and/or computer)
- **Type:** Turn-based card game
- **Features:** AI opponents with configurable speed, matching pair bonuses, 9-hole scoring

### Race Game
Fast-paced multi-player racing on 4 different track types. Race against friends or AI opponents with keyboard or touch controls.

- **Players:** 1-4 human + up to 4 AI racers
- **Type:** Arcade racing
- **Features:** Oval, Figure-8, Road Course, and Speedway tracks; configurable laps; 4 keyboard control schemes + touch support

### Dots and Boxes
Classic pen-and-paper strategy game. Draw lines between dots to complete boxes and outscore your opponent.

- **Players:** 2-4 (human and/or computer)
- **Type:** Turn-based strategy
- **Features:** Configurable grid size (4x4 to 6x6), AI opponent, undo moves

### Checkers
Kid-friendly checkers with educational features. Learn the game with hints, or challenge the AI at three difficulty levels.

- **Players:** 2 (human vs human or human vs AI)
- **Type:** Classic board game
- **Features:** 3 AI difficulty levels, hint system, mandatory captures, undo, piece tracking

### Archer Fish
Action survival game where fish compete to survive while avoiding robots and obstacles. Shoot water jets to freeze enemies!

- **Players:** 1-4 (human and/or AI fish)
- **Type:** Action/survival
- **Features:** Water jet weapons, 5 obstacle types, 3 difficulty levels, configurable game duration, leaderboard

### Battle Planes
Defend the skies by shooting down enemy planes with a lightning weapon. Manage your weapon recharge and take out as many planes as possible!

- **Players:** 1 (single player)
- **Type:** Arcade shooter
- **Features:** 3 difficulty levels affecting speed and size, configurable plane count and duration, weapon recharge system

> See the [docs/](docs/) folder for detailed rules, controls, and scoring for each game.

## Quick Start

### Prerequisites
- Node.js 20.x
- npm

### Installation

```bash
git clone <repository-url>
cd my-online-games
npm install
```

### Development

```bash
npm run dev
```

Open your browser to `http://localhost:5174`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run start` | Run production server (Express) |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check for linting errors |
| `npm run lint:fix` | Automatically fix linting errors |

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animation library
- **React Router 7** - Client-side routing
- **Lucide React** - Icon library
- **Vitest** - Testing framework
- **React Testing Library** - Component testing
- **Express** - Production server
- **TypeScript / JavaScript** - Both used across the codebase

## Project Structure

```
src/
├── games/                  # Game implementations
│   ├── golf/               # Golf card game
│   ├── race/               # Race game
│   ├── dots/               # Dots and Boxes
│   ├── checkers/           # Checkers
│   ├── archerfish/         # Archer Fish
│   └── battleplanes/       # Battle Planes
├── pages/                  # Home page
├── components/             # Shared components (ErrorBoundary)
├── types/                  # Shared TypeScript types
├── constants/              # Shared constants
├── utils/                  # Shared utilities
└── assets/                 # Images and static assets
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory. The application is a static site that can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.) or served via the included Express server with `npm start`.

## License

MIT

## Contributing

Contributions are welcome! Please see [ARCHITECTURE.md](ARCHITECTURE.md) for coding standards and patterns to follow.
