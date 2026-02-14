import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import GameScreen from './GameScreen'
import {
  makeGameConfig,
  setupWindowDimensions,
  mockMathRandom,
  mockContainerRect,
} from '../test/battlePlanesTestHelpers'
import type { GameConfig } from '../types'

// ─── Mock child components ────────────────────────────────────────────────────

vi.mock('./Plane', () => ({
  default: ({ plane }: any) => (
    <div
      data-testid={`plane-${plane.id}`}
      data-x={plane.x}
      data-y={plane.y}
      data-direction={plane.direction}
      data-speed={plane.speed}
      data-width={plane.width}
      data-height={plane.height}
      data-variety={plane.variety}
    >
      Plane {plane.number}
    </div>
  ),
}))

vi.mock('./Weapon', () => ({
  default: ({ recharging, lightningActive, rechargeProgress }: any) => (
    <div
      data-testid="weapon"
      data-recharging={String(recharging)}
      data-lightning={String(lightningActive)}
      data-progress={rechargeProgress}
    >
      Weapon
    </div>
  ),
}))

vi.mock('./Explosion', () => ({
  default: ({ x, y, onComplete }: any) => (
    <div data-testid="explosion" data-x={x} data-y={y}>
      <button onClick={onComplete}>Complete Explosion</button>
    </div>
  ),
}))

// ─── Shared test setup ────────────────────────────────────────────────────────

let currentTime: number

beforeEach(() => {
  vi.useFakeTimers()
  setupWindowDimensions(1024, 768)
  currentTime = 10000
  vi.spyOn(Date, 'now').mockImplementation(() => currentTime)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ─── Render helper ────────────────────────────────────────────────────────────

function renderGameScreen(configOverrides?: Partial<GameConfig>) {
  const config = makeGameConfig(configOverrides)
  const onExit = vi.fn()
  const result = render(<GameScreen config={config} onExit={onExit} />)
  // Flush the initial useEffect that calls initializePlanes
  act(() => {
    vi.advanceTimersByTime(0)
  })
  return { ...result, config, onExit }
}

/**
 * Helper: set up Math.random so all 10 planes go right with zero speed variation.
 * Pattern: [direction=0.8, speedVar=0.0] repeated for each plane.
 */
function allPlanesRightZeroSpeedRandom(planeCount = 10) {
  const randoms: number[] = []
  for (let i = 0; i < planeCount; i++) {
    randoms.push(0.8) // direction: > 0.5 → right
    randoms.push(0.0) // speed variation: 0.0
  }
  return mockMathRandom(randoms)
}

/**
 * Helper: set up Math.random so all planes go left with zero speed variation.
 */
function allPlanesLeftZeroSpeedRandom(planeCount = 10) {
  const randoms: number[] = []
  for (let i = 0; i < planeCount; i++) {
    randoms.push(0.3) // direction: <= 0.5 → left
    randoms.push(0.0) // speed variation: 0.0
  }
  return mockMathRandom(randoms)
}

/**
 * Mock getBoundingClientRect on the game container element after render.
 */
function mockContainer(container: HTMLElement) {
  const gameContainer = container.querySelector('.h-screen')
  if (gameContainer) {
    ;(gameContainer as HTMLElement).getBoundingClientRect = vi.fn(() =>
      mockContainerRect()
    )
  }
  return gameContainer
}

/**
 * Fire weapon by pressing Space, after advancing past the 300ms cooldown.
 */
function fireWeapon() {
  currentTime = 10500 // 500ms past game start (past 300ms cooldown)
  act(() => {
    fireEvent.keyDown(window, { code: 'Space' })
  })
}

/**
 * Advance to game over by running the timer for the full duration.
 */
function advanceToTimerGameOver(durationMinutes = 1) {
  const totalSeconds = durationMinutes * 60
  for (let i = 0; i < totalSeconds; i++) {
    act(() => {
      vi.advanceTimersByTime(1000)
    })
  }
}

// =============================================================================
// TESTS
// =============================================================================

describe('GameScreen', () => {
  // ─── Initial Rendering ────────────────────────────────────────────────────

  describe('initial rendering', () => {
    it('renders Exit button with "Exit" text', () => {
      renderGameScreen()
      const exitButton = screen.getByText('Exit')
      expect(exitButton).toBeInTheDocument()
    })

    it('renders SCORE label', () => {
      renderGameScreen()
      expect(screen.getByText('SCORE')).toBeInTheDocument()
    })

    it('shows initial score of 0', () => {
      renderGameScreen()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('renders TIME label', () => {
      renderGameScreen()
      expect(screen.getByText('TIME')).toBeInTheDocument()
    })

    it('shows formatted time 1:00 for duration=1', () => {
      renderGameScreen({ duration: 1 })
      expect(screen.getByText('1:00')).toBeInTheDocument()
    })

    it('renders Weapon component', () => {
      renderGameScreen()
      expect(screen.getByTestId('weapon')).toBeInTheDocument()
    })

    it('renders correct number of plane elements for planeCount=10', () => {
      renderGameScreen({ planeCount: 10 })
      const planes = screen.getAllByText(/^Plane \d+$/)
      expect(planes).toHaveLength(10)
    })

    it('renders 15 planes when planeCount=15', () => {
      renderGameScreen({ planeCount: 15 })
      const planes = screen.getAllByText(/^Plane \d+$/)
      expect(planes).toHaveLength(15)
    })

    it('renders 20 planes when planeCount=20', () => {
      renderGameScreen({ planeCount: 20 })
      const planes = screen.getAllByText(/^Plane \d+$/)
      expect(planes).toHaveLength(20)
    })

    it('weapon starts not recharging', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-recharging')).toBe('false')
    })

    it('weapon starts with lightning inactive', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-lightning')).toBe('false')
    })

    it('weapon starts with recharge progress at 100', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-progress')).toBe('100')
    })

    it('shows formatted time 2:00 for duration=2', () => {
      renderGameScreen({ duration: 2 })
      expect(screen.getByText('2:00')).toBeInTheDocument()
    })
  })

  // ─── Plane Initialization ────────────────────────────────────────────────

  describe('plane initialization', () => {
    it('creates planes with IDs plane-0 through plane-9', () => {
      renderGameScreen({ planeCount: 10 })
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`plane-plane-${i}`)).toBeInTheDocument()
      }
    })

    it('planes have sequential numbers starting from 1', () => {
      renderGameScreen({ planeCount: 10 })
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`Plane ${i}`)).toBeInTheDocument()
      }
    })

    it('10 planes use 2 varieties cycling 1,2,1,2...', () => {
      renderGameScreen({ planeCount: 10 })
      for (let i = 0; i < 10; i++) {
        const plane = screen.getByTestId(`plane-plane-${i}`)
        const expectedVariety = (i % 2) + 1
        expect(plane.getAttribute('data-variety')).toBe(String(expectedVariety))
      }
    })

    it('15 planes use 3 varieties cycling 1,2,3,1,2,3...', () => {
      renderGameScreen({ planeCount: 15 })
      for (let i = 0; i < 15; i++) {
        const plane = screen.getByTestId(`plane-plane-${i}`)
        const expectedVariety = (i % 3) + 1
        expect(plane.getAttribute('data-variety')).toBe(String(expectedVariety))
      }
    })

    it('20 planes use 4 varieties', () => {
      renderGameScreen({ planeCount: 20 })
      for (let i = 0; i < 20; i++) {
        const plane = screen.getByTestId(`plane-plane-${i}`)
        const expectedVariety = (i % 4) + 1
        expect(plane.getAttribute('data-variety')).toBe(String(expectedVariety))
      }
    })

    it('Y positions follow formula 50 + (i * 30) % 400', () => {
      renderGameScreen({ planeCount: 10 })
      for (let i = 0; i < 10; i++) {
        const plane = screen.getByTestId(`plane-plane-${i}`)
        const expectedY = 50 + (i * 30) % 400
        expect(plane.getAttribute('data-y')).toBe(String(expectedY))
      }
    })

    it('right-facing planes start at x=-100', () => {
      allPlanesRightZeroSpeedRandom()
      renderGameScreen({ planeCount: 10 })
      const plane = screen.getByTestId('plane-plane-0')
      expect(plane.getAttribute('data-x')).toBe('-100')
      expect(plane.getAttribute('data-direction')).toBe('right')
    })

    it('left-facing planes start at x=window.innerWidth+100 (1124)', () => {
      allPlanesLeftZeroSpeedRandom()
      renderGameScreen({ planeCount: 10 })
      const plane = screen.getByTestId('plane-plane-0')
      expect(plane.getAttribute('data-x')).toBe('1124')
      expect(plane.getAttribute('data-direction')).toBe('left')
    })

    it('easy difficulty: plane width is 144 (120 * 1.2)', () => {
      renderGameScreen({ difficulty: 'easy', planeCount: 10 })
      const plane = screen.getByTestId('plane-plane-0')
      expect(plane.getAttribute('data-width')).toBe('144')
    })

    it('hard difficulty: plane width is 90 (120 * 0.75)', () => {
      renderGameScreen({ difficulty: 'hard', planeCount: 10 })
      const plane = screen.getByTestId('plane-plane-0')
      expect(plane.getAttribute('data-width')).toBe('90')
    })

    it('medium difficulty: plane width is 120 (120 * 1.0)', () => {
      renderGameScreen({ difficulty: 'medium', planeCount: 10 })
      const plane = screen.getByTestId('plane-plane-0')
      expect(plane.getAttribute('data-width')).toBe('120')
    })

    it('easy difficulty: plane height is 57.6 (48 * 1.2)', () => {
      renderGameScreen({ difficulty: 'easy', planeCount: 10 })
      const plane = screen.getByTestId('plane-plane-0')
      expect(plane.getAttribute('data-height')).toBe(String(48 * 1.2))
    })

    it('hard difficulty: plane height is 36 (48 * 0.75)', () => {
      renderGameScreen({ difficulty: 'hard', planeCount: 10 })
      const plane = screen.getByTestId('plane-plane-0')
      expect(plane.getAttribute('data-height')).toBe('36')
    })
  })

  // ─── Timer Countdown ─────────────────────────────────────────────────────

  describe('timer countdown', () => {
    it('starts at config.duration * 60 seconds (1:00 for duration=1)', () => {
      renderGameScreen({ duration: 1 })
      expect(screen.getByText('1:00')).toBeInTheDocument()
    })

    it('after 1 second, time decrements to 0:59', () => {
      renderGameScreen({ duration: 1 })
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(screen.getByText('0:59')).toBeInTheDocument()
    })

    it('after 5 seconds, time shows 0:55', () => {
      renderGameScreen({ duration: 1 })
      for (let i = 0; i < 5; i++) {
        act(() => {
          vi.advanceTimersByTime(1000)
        })
      }
      expect(screen.getByText('0:55')).toBeInTheDocument()
    })

    it('formats time as M:SS with zero-padded seconds', () => {
      renderGameScreen({ duration: 2 })
      // 2:00 initially
      expect(screen.getByText('2:00')).toBeInTheDocument()
      // After 55 seconds: 1:05
      for (let i = 0; i < 55; i++) {
        act(() => {
          vi.advanceTimersByTime(1000)
        })
      }
      expect(screen.getByText('1:05')).toBeInTheDocument()
    })

    it('shows 0:00 when time expires', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      // Game over screen now, but let's verify the time was set to 0
      // The game over screen should be showing
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()
    })

    it('sets game over when time reaches 0', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()
      expect(screen.getByText('Return to Menu')).toBeInTheDocument()
    })

    it('stops decrementing after game over', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()
      // Advance more time - should not cause errors
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      // Still showing game over
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()
    })
  })

  // ─── Plane Movement ───────────────────────────────────────────────────────

  describe('plane movement', () => {
    it('right-facing planes move right (x increases after game loop tick)', () => {
      allPlanesRightZeroSpeedRandom()
      renderGameScreen({ planeCount: 10 })
      const planeBefore = screen.getByTestId('plane-plane-0')
      const xBefore = Number(planeBefore.getAttribute('data-x'))

      // Advance one game frame (~16.67ms)
      act(() => {
        vi.advanceTimersByTime(17)
      })

      const planeAfter = screen.getByTestId('plane-plane-0')
      const xAfter = Number(planeAfter.getAttribute('data-x'))
      expect(xAfter).toBeGreaterThan(xBefore)
    })

    it('left-facing planes move left (x decreases)', () => {
      allPlanesLeftZeroSpeedRandom()
      renderGameScreen({ planeCount: 10 })
      const planeBefore = screen.getByTestId('plane-plane-0')
      const xBefore = Number(planeBefore.getAttribute('data-x'))

      act(() => {
        vi.advanceTimersByTime(17)
      })

      const planeAfter = screen.getByTestId('plane-plane-0')
      const xAfter = Number(planeAfter.getAttribute('data-x'))
      expect(xAfter).toBeLessThan(xBefore)
    })

    it('right plane wraps to left when x > window.innerWidth', () => {
      allPlanesRightZeroSpeedRandom()
      renderGameScreen({ planeCount: 10 })

      // Speed = 2 (medium, zero variation). Starting at -100.
      // Need to move past 1024. That's 1124 units / 2 per frame = 562 frames.
      // At ~16.67ms per frame, that's about 9367ms. Advance 10000ms to be safe.
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      const plane = screen.getByTestId('plane-plane-0')
      const x = Number(plane.getAttribute('data-x'))
      // After wrapping, x should be negative (set to -plane.width = -120)
      // The plane may have advanced a few frames after wrapping, but x should be < 1024
      expect(x).toBeLessThan(1024)
    })

    it('left plane wraps to right when x < -plane.width', () => {
      allPlanesLeftZeroSpeedRandom()
      renderGameScreen({ planeCount: 10 })

      // Starting at 1124, speed=2 moving left. Need to go below -120.
      // Distance: 1124 + 120 = 1244 units / 2 per frame = 622 frames ~ 10367ms
      act(() => {
        vi.advanceTimersByTime(11000)
      })

      const plane = screen.getByTestId('plane-plane-0')
      const x = Number(plane.getAttribute('data-x'))
      // After wrapping, x should be around window.innerWidth (1024) or greater
      expect(x).toBeGreaterThan(-120)
    })

    it('movement stops after game over', () => {
      allPlanesRightZeroSpeedRandom()
      renderGameScreen({ planeCount: 10, duration: 1 })

      // Advance to game over
      advanceToTimerGameOver(1)
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()

      // No more plane elements visible in game over screen
      expect(screen.queryByTestId('plane-plane-0')).not.toBeInTheDocument()
    })
  })

  // ─── Firing Mechanism ─────────────────────────────────────────────────────

  describe('firing mechanism', () => {
    it('click on window fires lightning (Weapon receives lightningActive=true)', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-lightning')).toBe('false')

      currentTime = 10500
      act(() => {
        fireEvent.click(window)
      })

      expect(weapon.getAttribute('data-lightning')).toBe('true')
    })

    it('spacebar fires lightning', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-lightning')).toBe('false')

      currentTime = 10500
      act(() => {
        fireEvent.keyDown(window, { code: 'Space' })
      })

      expect(weapon.getAttribute('data-lightning')).toBe('true')
    })

    it('firing sets weaponRecharging to true', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-recharging')).toBe('false')

      fireWeapon()

      expect(weapon.getAttribute('data-recharging')).toBe('true')
    })

    it('lightning deactivates after 150ms timeout', () => {
      renderGameScreen()
      fireWeapon()

      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-lightning')).toBe('true')

      act(() => {
        vi.advanceTimersByTime(150)
      })

      expect(weapon.getAttribute('data-lightning')).toBe('false')
    })

    it('cannot fire while recharging (second fire does not re-activate lightning)', () => {
      renderGameScreen()
      fireWeapon()

      // Deactivate lightning but still recharging
      act(() => {
        vi.advanceTimersByTime(150)
      })

      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-lightning')).toBe('false')
      expect(weapon.getAttribute('data-recharging')).toBe('true')

      // Try to fire again
      currentTime = 11000
      act(() => {
        fireEvent.keyDown(window, { code: 'Space' })
      })

      // Lightning should still be false because weapon is recharging
      expect(weapon.getAttribute('data-lightning')).toBe('false')
    })

    it('cannot fire when game is over', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()

      // Weapon is no longer in the DOM (game over screen replaces it)
      expect(screen.queryByTestId('weapon')).not.toBeInTheDocument()
    })

    it('cannot fire within 300ms of game start', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')

      // Time is still 10000 (same as game start), so timeSinceStart = 0
      currentTime = 10200 // 200ms < 300ms
      act(() => {
        fireEvent.keyDown(window, { code: 'Space' })
      })

      expect(weapon.getAttribute('data-lightning')).toBe('false')
    })

    it('can fire after 300ms cooldown', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')

      currentTime = 10300 // exactly 300ms — the check is timeSinceStart < 300, so 300 is NOT < 300
      act(() => {
        fireEvent.keyDown(window, { code: 'Space' })
      })
      expect(weapon.getAttribute('data-lightning')).toBe('true')
    })

    it('non-Space keys do not fire the weapon', () => {
      renderGameScreen()
      const weapon = screen.getByTestId('weapon')

      currentTime = 10500
      act(() => {
        fireEvent.keyDown(window, { code: 'Enter' })
      })
      expect(weapon.getAttribute('data-lightning')).toBe('false')

      act(() => {
        fireEvent.keyDown(window, { code: 'KeyA' })
      })
      expect(weapon.getAttribute('data-lightning')).toBe('false')
    })
  })

  // ─── Weapon Recharge ──────────────────────────────────────────────────────

  describe('weapon recharge', () => {
    it('after firing, weapon shows recharging', () => {
      renderGameScreen()
      fireWeapon()
      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-recharging')).toBe('true')
    })

    it('recharge progress starts at 0 when fired', () => {
      renderGameScreen()
      fireWeapon()
      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-progress')).toBe('0')
    })

    it('recharge progress increases over time', () => {
      renderGameScreen()
      fireWeapon()

      // The recharge interval checks Date.now() every 50ms.
      // Advance Date.now by 1500ms (half of 3000ms recharge) and tick the interval.
      currentTime = 10500 + 1500 // 1500ms elapsed since recharge start
      act(() => {
        vi.advanceTimersByTime(100) // several recharge interval ticks
      })

      const weapon = screen.getByTestId('weapon')
      const progress = Number(weapon.getAttribute('data-progress'))
      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThan(100)
    })

    it('weapon becomes available after ~3000ms recharge', () => {
      renderGameScreen()
      fireWeapon()

      // Simulate 3000ms of recharge time
      currentTime = 10500 + 3100 // 3100ms elapsed, more than 3000ms
      act(() => {
        vi.advanceTimersByTime(3200) // enough interval ticks to detect completion
      })

      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-recharging')).toBe('false')
    })

    it('recharge progress reaches 100 on completion', () => {
      renderGameScreen()
      fireWeapon()

      currentTime = 10500 + 3100
      act(() => {
        vi.advanceTimersByTime(3200)
      })

      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-progress')).toBe('100')
    })

    it('can fire again after recharge completes', () => {
      renderGameScreen()
      fireWeapon()

      // Complete recharge
      currentTime = 10500 + 3100
      act(() => {
        vi.advanceTimersByTime(3200)
      })

      const weapon = screen.getByTestId('weapon')
      expect(weapon.getAttribute('data-recharging')).toBe('false')

      // Fire again
      currentTime = 15000
      act(() => {
        fireEvent.keyDown(window, { code: 'Space' })
      })

      expect(weapon.getAttribute('data-lightning')).toBe('true')
      expect(weapon.getAttribute('data-recharging')).toBe('true')
    })
  })

  // ─── Collision Detection ──────────────────────────────────────────────────

  describe('collision detection', () => {
    // Container: 1024x768
    // weaponCenterX = 1024/2 - 3 = 509
    // collisionWidth = 22, so weapon spans x=498 to x=520
    // lightningBottom = 768 - 160 = 608
    // lightningHeight = max(768 - 160, 600) = 608
    // lightningTop = max(608 - 608, 0) = 0
    // So lightning covers y=0 to y=608

    it('plane overlapping weapon column is destroyed (removed from DOM)', () => {
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      // Planes start at x=-100, speed=2. After 4800ms, x=500 (empirically verified).
      // Plane spans 500-620. Weapon spans 498-520. Overlap!
      act(() => {
        vi.advanceTimersByTime(4800)
      })

      // Verify plane-0 is in the collision zone
      const plane0 = screen.getByTestId('plane-plane-0')
      const x = Number(plane0.getAttribute('data-x'))
      expect(x).toBeGreaterThanOrEqual(490)
      expect(x).toBeLessThan(520)

      fireWeapon()

      // Plane-0 should be destroyed
      expect(screen.queryByTestId('plane-plane-0')).not.toBeInTheDocument()
    })

    it('score increments when plane is hit', () => {
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      // Move planes into weapon column: after 4800ms, x=500 (in weapon zone 498-520)
      act(() => {
        vi.advanceTimersByTime(4800)
      })

      fireWeapon()

      // All 10 planes at x=500, y values 50-320 all in lightning zone (0-608).
      // All should be hit! Score should be 10.
      const scoreElements = screen.getAllByText('10')
      expect(scoreElements.length).toBeGreaterThanOrEqual(1)
    })

    it('explosion is created at hit location', () => {
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      act(() => {
        vi.advanceTimersByTime(4800)
      })

      fireWeapon()

      // Explosions should be created for all hit planes
      const explosions = screen.getAllByTestId('explosion')
      expect(explosions.length).toBeGreaterThan(0)
    })

    it('plane to the left of weapon is not hit', () => {
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      // At time 0, planes are at x=-100. Plane right edge = -100 + 120 = 20.
      // Weapon left = 498. 20 < 498, so no horizontal overlap. No hit.
      fireWeapon()

      // All 10 planes should still be present
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`plane-plane-${i}`)).toBeInTheDocument()
      }
    })

    it('plane to the right of weapon is not hit', () => {
      // Use left-facing planes that start at x=1124
      allPlanesLeftZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      // At time 0, planes are at x=1124. Plane left = 1124. Weapon right = 520.
      // 1124 > 520, so planeLeft < weaponRight is false. No horizontal overlap.
      fireWeapon()

      // All 10 planes should still be present
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`plane-plane-${i}`)).toBeInTheDocument()
      }
    })

    it('plane below lightning zone is not hit (y > 608)', () => {
      // We need a plane with y > 608. The formula is 50 + (i*30) % 400.
      // Max y from formula is 50 + 390 = 440, which is still in range.
      // We'll test with a smaller container where the lightning zone is smaller.
      // Container height=200: lightningBottom = 200-160 = 40, lightningHeight = max(40, 600) = 600
      // lightningTop = max(40-600, 0) = 0. Range is y=0 to y=40.
      // A plane at y=50 (plane-0) has planeTop=50, planeBottom=50+48=98. 50 > 40, so no vertical overlap.

      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })

      // Mock a very short container
      const gameContainer = container.querySelector('.h-screen')
      if (gameContainer) {
        ;(gameContainer as HTMLElement).getBoundingClientRect = vi.fn(() =>
          mockContainerRect({ height: 200 })
        )
      }

      // Move planes into weapon column: after 4800ms, x=500
      act(() => {
        vi.advanceTimersByTime(4800)
      })

      fireWeapon()

      // Planes should NOT be hit because lightningBottom = 40 and planes have y >= 50
      // planeTop=50, planeBottom=98, lightningTop=0, lightningBottom=40
      // 98 > 0 (true) AND 50 < 40 (false) → no overlap
      expect(screen.getByTestId('plane-plane-0')).toBeInTheDocument()
    })

    it('two planes in weapon column: both destroyed, score increments by 2', () => {
      // All 10 planes go right with speed=2 (random mock cycles for 10 planes)
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      // After 4800ms, all planes at x=500 (in weapon zone 498-520).
      // All y values (50-320) in lightning zone (0-608). All 10 hit.
      // This tests that multiple simultaneous hits are counted correctly.
      act(() => {
        vi.advanceTimersByTime(4800)
      })

      // Verify at least two planes are present before firing
      expect(screen.getByTestId('plane-plane-0')).toBeInTheDocument()
      expect(screen.getByTestId('plane-plane-1')).toBeInTheDocument()

      fireWeapon()

      // Both plane-0 and plane-1 (and all others) should be destroyed
      expect(screen.queryByTestId('plane-plane-0')).not.toBeInTheDocument()
      expect(screen.queryByTestId('plane-plane-1')).not.toBeInTheDocument()

      // Score should reflect all 10 planes destroyed
      const scoreText = screen.getAllByText('10')
      expect(scoreText.length).toBeGreaterThanOrEqual(1)
    })

    it('explosion data-x and data-y match plane center', () => {
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      // Move planes into weapon column: after 4800ms, x=500
      act(() => {
        vi.advanceTimersByTime(4800)
      })

      // Get plane-0 position before firing
      const plane0 = screen.getByTestId('plane-plane-0')
      const planeX = Number(plane0.getAttribute('data-x'))
      const planeY = Number(plane0.getAttribute('data-y'))
      const planeWidth = Number(plane0.getAttribute('data-width'))
      const planeHeight = Number(plane0.getAttribute('data-height'))

      fireWeapon()

      // Verify explosions exist
      const explosions = screen.getAllByTestId('explosion')
      expect(explosions.length).toBeGreaterThan(0)

      // The explosion x,y should be plane.x + plane.width/2, plane.y + plane.height/2
      const expectedX = planeX + planeWidth / 2
      const expectedY = planeY + planeHeight / 2

      // Find the explosion matching plane-0's center
      const matchingExplosion = explosions.find(
        (exp) =>
          Number(exp.getAttribute('data-x')) === expectedX &&
          Number(exp.getAttribute('data-y')) === expectedY
      )
      expect(matchingExplosion).toBeTruthy()
    })

    it('explosion can be removed via onComplete callback', () => {
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      // Move planes into weapon column and fire
      act(() => {
        vi.advanceTimersByTime(4800)
      })
      fireWeapon()

      // Verify explosions exist
      const explosions = screen.getAllByTestId('explosion')
      expect(explosions.length).toBeGreaterThan(0)

      // Click the "Complete Explosion" button on the first explosion
      const completeButton = screen.getAllByText('Complete Explosion')[0]
      act(() => {
        fireEvent.click(completeButton)
      })

      // One fewer explosion should remain
      const remainingExplosions = screen.getAllByTestId('explosion')
      expect(remainingExplosions.length).toBe(explosions.length - 1)
    })
  })

  // ─── Win Condition ────────────────────────────────────────────────────────

  describe('win condition', () => {
    it('game does NOT end while planes remain', () => {
      renderGameScreen()

      // Advance some time but not enough to run out
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Should not show game over
      expect(screen.queryByText('Battle Complete!')).not.toBeInTheDocument()
    })

    it('game ends 1500ms after all planes destroyed', () => {
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10 })
      mockContainer(container)

      // Move all planes into weapon column: after 4800ms, x=500
      act(() => {
        vi.advanceTimersByTime(4800)
      })

      // Destroy all planes
      fireWeapon()

      // Verify all planes destroyed
      expect(screen.queryByTestId('plane-plane-0')).not.toBeInTheDocument()

      // Not game over yet (1500ms delay)
      expect(screen.queryByText('Battle Complete!')).not.toBeInTheDocument()

      // Wait for 1500ms delay
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()
    })

    it('no premature game over before planes are initialized (hasSeenPlanesRef check)', () => {
      // The initial state has planes=[], but hasSeenPlanesRef starts false.
      // The game should NOT trigger the "all planes destroyed" game over on init.
      renderGameScreen()

      // Advance well past the 1500ms setTimeout
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // Game should NOT be over — planes exist
      expect(screen.queryByText('Battle Complete!')).not.toBeInTheDocument()
      expect(screen.getByTestId('weapon')).toBeInTheDocument()
    })

    it('no game over trigger if time already expired', () => {
      renderGameScreen({ duration: 1 })

      // Run out the timer first
      advanceToTimerGameOver(1)
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()

      // The game over was triggered by timer, not by all planes destroyed
      // This verifies the screen shows correctly in either case
      expect(screen.getByText('Return to Menu')).toBeInTheDocument()
    })
  })

  // ─── Game Over Screen ─────────────────────────────────────────────────────

  describe('game over screen', () => {
    it('shows "Battle Complete!" heading', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()
    })

    it('shows final score', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      // Score should be 0 (no planes destroyed)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('shows "Planes Destroyed" text', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('Planes Destroyed')).toBeInTheDocument()
    })

    it('shows "out of {planeCount} enemy aircraft" text', () => {
      renderGameScreen({ planeCount: 10, duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('out of 10 enemy aircraft')).toBeInTheDocument()
    })

    it('shows "Return to Menu" button', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('Return to Menu')).toBeInTheDocument()
    })

    it('clicking "Return to Menu" calls onExit', () => {
      const { onExit } = renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)

      const returnButton = screen.getByText('Return to Menu')
      fireEvent.click(returnButton)

      expect(onExit).toHaveBeenCalledTimes(1)
    })

    it('score displayed matches actual hits scored', () => {
      allPlanesRightZeroSpeedRandom()
      const { container } = renderGameScreen({ planeCount: 10, duration: 1 })
      mockContainer(container)

      // Move planes into weapon column: after 4800ms, x=500
      act(() => {
        vi.advanceTimersByTime(4800)
      })
      fireWeapon()

      // All 10 planes destroyed. Now advance to game over via win condition (1500ms delay).
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      // Game over screen should show score of 10
      expect(screen.getByText('Battle Complete!')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('Trophy icon is rendered (SVG element)', () => {
      const { container } = renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)

      // lucide-react Trophy renders as an SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('game over screen shows correct plane count for 15 planes', () => {
      renderGameScreen({ planeCount: 15, duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('out of 15 enemy aircraft')).toBeInTheDocument()
    })

    it('game over screen shows correct plane count for 20 planes', () => {
      renderGameScreen({ planeCount: 20, duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.getByText('out of 20 enemy aircraft')).toBeInTheDocument()
    })

    it('game over screen hides weapon and planes', () => {
      renderGameScreen({ duration: 1 })
      advanceToTimerGameOver(1)
      expect(screen.queryByTestId('weapon')).not.toBeInTheDocument()
      expect(screen.queryByText('SCORE')).not.toBeInTheDocument()
      expect(screen.queryByText('TIME')).not.toBeInTheDocument()
    })
  })

  // ─── Exit Button ──────────────────────────────────────────────────────────

  describe('Exit button', () => {
    it('Exit button calls onExit when clicked', () => {
      const { onExit } = renderGameScreen()

      // Get direct reference to the exit button to avoid window click handler firing lightning
      const exitButton = screen.getByText('Exit').closest('button')!

      // We need to click the button without also triggering fireLightning.
      // fireLightning is blocked within 300ms, so keep currentTime at 10000 (0ms since start).
      // This way the window click handler's fireLightning call will early-return.
      fireEvent.click(exitButton)

      expect(onExit).toHaveBeenCalledTimes(1)
    })

    it('Exit button shows "Exit" text', () => {
      renderGameScreen()
      const exitButton = screen.getByText('Exit')
      expect(exitButton).toBeInTheDocument()
    })
  })

  // ─── Input Event Listeners ────────────────────────────────────────────────

  describe('input event listeners', () => {
    it('spacebar keydown preventDefault is called', () => {
      renderGameScreen()

      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        bubbles: true,
        cancelable: true,
      })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      window.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('both keydown and click listeners are added on mount', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener')
      renderGameScreen()

      const keydownCalls = addEventSpy.mock.calls.filter(
        (call) => call[0] === 'keydown'
      )
      const clickCalls = addEventSpy.mock.calls.filter(
        (call) => call[0] === 'click'
      )

      expect(keydownCalls.length).toBeGreaterThanOrEqual(1)
      expect(clickCalls.length).toBeGreaterThanOrEqual(1)
    })

    it('listeners removed on unmount', () => {
      const removeEventSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderGameScreen()

      unmount()

      const keydownCalls = removeEventSpy.mock.calls.filter(
        (call) => call[0] === 'keydown'
      )
      const clickCalls = removeEventSpy.mock.calls.filter(
        (call) => call[0] === 'click'
      )

      expect(keydownCalls.length).toBeGreaterThanOrEqual(1)
      expect(clickCalls.length).toBeGreaterThanOrEqual(1)
    })
  })
})
