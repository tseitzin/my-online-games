import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Fish, Robot, Obstacle, WaterJet, GameConfig } from '../types'

export function makeFish(overrides?: Partial<Fish>): Fish {
  return {
    id: 0,
    position: { x: 100, y: 100 },
    velocity: { x: 0, y: 0 },
    isHuman: false,
    name: 'Fish 1',
    color: '#10b981',
    isFrozen: false,
    frozenUntil: 0,
    survivalTime: 0,
    frozenTime: 0,
    lastWaterJetTime: 0,
    waterJetCooldown: 3000,
    ...overrides,
  }
}

export function makeRobot(overrides?: Partial<Robot>): Robot {
  return {
    id: 0,
    position: { x: 600, y: 350 },
    velocity: { x: 0, y: 0 },
    targetFishId: null,
    speed: 2.5,
    isStuck: false,
    stuckUntil: 0,
    stuckToObstacleId: null,
    ...overrides,
  }
}

export function makeObstacle(overrides?: Partial<Obstacle>): Obstacle {
  return {
    id: 0,
    position: { x: 400, y: 300 },
    width: 60,
    height: 50,
    type: 'coral',
    ...overrides,
  }
}

export function makeWaterJet(overrides?: Partial<WaterJet>): WaterJet {
  return {
    id: 'jet-0',
    position: { x: 200, y: 200 },
    velocity: { x: 8, y: 0 },
    fishId: 0,
    createdAt: Date.now(),
    ...overrides,
  }
}

export function makeGameConfig(overrides?: Partial<GameConfig>): GameConfig {
  return {
    numPlayers: 2,
    numRobots: 1,
    humanPlayers: [true, false],
    playerNames: ['Player 1', 'AI Fish'],
    duration: 120,
    difficulty: 'medium',
    ...overrides,
  }
}

export function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}
