import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { Plane, GameConfig, GameState, Difficulty } from '../types'

// ─── Factory functions ────────────────────────────────────────────────────

export function makePlane(overrides?: Partial<Plane>): Plane {
  return {
    id: 'plane-0',
    number: 1,
    x: 200,
    y: 100,
    direction: 'right',
    speed: 2,
    variety: 1,
    width: 120,
    height: 48,
    ...overrides,
  }
}

export function makePlanes(count: number, overrides?: Partial<Plane>): Plane[] {
  return Array.from({ length: count }, (_, i) => makePlane({
    id: `plane-${i}`,
    number: i + 1,
    y: 50 + (i * 30) % 400,
    variety: (i % 2) + 1,
    ...overrides,
  }))
}

export function makeGameConfig(overrides?: Partial<GameConfig>): GameConfig {
  return {
    planeCount: 10,
    duration: 1,
    difficulty: 'medium' as Difficulty,
    ...overrides,
  }
}

export function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    planes: [],
    score: 0,
    timeRemaining: 60,
    isPlaying: true,
    weaponRecharging: false,
    lightningActive: false,
    ...overrides,
  }
}

// ─── Router wrapper for components using <Link> ──────────────────────────

export function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

// ─── Mock getBoundingClientRect for collision testing ─────────────────────

export function mockContainerRect(overrides?: Partial<DOMRect>): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 1024,
    height: 768,
    top: 0,
    right: 1024,
    bottom: 768,
    left: 0,
    toJSON: () => {},
    ...overrides,
  } as DOMRect
}

// ─── window.innerWidth/innerHeight setup ──────────────────────────────────

export function setupWindowDimensions(width = 1024, height = 768) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true, configurable: true })
}

// ─── Deterministic Math.random mock ───────────────────────────────────────

export function mockMathRandom(values: number[]) {
  let index = 0
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    const value = values[index % values.length]
    index++
    return value
  })
}
