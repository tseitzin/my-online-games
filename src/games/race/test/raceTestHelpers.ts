import { vi } from 'vitest'
import { Car, CarConfig, RaceConfig, TrackType, PlayerInputs } from '../../../types/race'
import { CAR_PHYSICS } from '../../../constants/race'

// ─── Path2D mock ──────────────────────────────────────────────────────────
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    moveTo() {}
    lineTo() {}
    arc() {}
    closePath() {}
  } as unknown as typeof Path2D
}

// ─── Factory functions ────────────────────────────────────────────────────

export function makeCar(overrides: Partial<Car> = {}): Car {
  return {
    id: 'player-0',
    color: '#E53935',
    number: 1,
    isAI: false,
    playerIndex: 0,
    trackProgress: 0,
    lane: 0,
    laneOffset: 0,
    speed: 0,
    maxSpeed: CAR_PHYSICS.baseMaxSpeed,
    acceleration: CAR_PHYSICS.acceleration,
    deceleration: CAR_PHYSICS.deceleration,
    lapsCompleted: 0,
    lastCheckpoint: 0,
    finished: false,
    steeringAngle: 0,
    heading: 0,
    ...overrides,
  }
}

export function makeCarConfig(overrides: Partial<CarConfig> = {}): CarConfig {
  return {
    id: 'player-0',
    color: '#E53935',
    number: 1,
    isAI: false,
    playerIndex: 0,
    ...overrides,
  }
}

export function makeRaceConfig(overrides: Partial<RaceConfig> = {}): RaceConfig {
  return {
    humanPlayers: 1,
    aiRacers: 3,
    laps: 3,
    playerConfigs: [{ color: '#E53935', number: 1, style: 0 }],
    trackType: TrackType.Oval,
    ...overrides,
  }
}

export function makeInput(overrides: Partial<{ accelerate: boolean; brake: boolean; turnLeft: boolean; turnRight: boolean }> = {}) {
  return {
    accelerate: false,
    brake: false,
    turnLeft: false,
    turnRight: false,
    ...overrides,
  }
}

// ─── Canvas mock ──────────────────────────────────────────────────────────

export function createMockCanvasContext(): CanvasRenderingContext2D {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    setLineDash: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    canvas: { width: 1200, height: 800 },
  }
  return ctx as unknown as CanvasRenderingContext2D
}

// ─── HTMLCanvasElement.getContext mock ─────────────────────────────────────

export function mockCanvasGetContext() {
  const mockCtx = createMockCanvasContext()
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (contextId: string) {
    if (contextId === '2d') return mockCtx as unknown as CanvasRenderingContext2D
    return originalGetContext.call(this, contextId as '2d')
  } as typeof HTMLCanvasElement.prototype.getContext
  return { mockCtx, restore: () => { HTMLCanvasElement.prototype.getContext = originalGetContext } }
}
