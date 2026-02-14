import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import GameScreen from './GameScreen'
import { makeGameConfig } from '../test/archerFishTestHelpers'

// Mock requestAnimationFrame to prevent infinite loop
let rafCallback: ((time: number) => void) | null = null

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallback = cb
    return 1
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  vi.spyOn(Date, 'now').mockReturnValue(1000)
})

afterEach(() => {
  rafCallback = null
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const defaultConfig = makeGameConfig({
  numPlayers: 2,
  numRobots: 1,
  humanPlayers: [true, false],
  playerNames: ['Player 1', 'AI Fish'],
  duration: 120,
  difficulty: 'medium',
})

describe('GameScreen', () => {
  describe('initial rendering', () => {
    it('renders fish names in scoreboard', () => {
      render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      // Names appear in scoreboard (with colon) and in fish labels
      expect(screen.getAllByText(/Player 1/).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/AI Fish/).length).toBeGreaterThanOrEqual(1)
    })

    it('renders time display', () => {
      render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      expect(screen.getByText(/Time:/)).toBeInTheDocument()
    })

    it('renders pause button', () => {
      const { container } = render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      const pauseButton = container.querySelector('button')
      expect(pauseButton).toBeTruthy()
    })

    it('renders arena with correct dimensions', () => {
      const { container } = render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      const arena = container.querySelector('[style*="width: 1200px"]')
      expect(arena).toBeTruthy()
    })

    it('renders control instructions', () => {
      render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      expect(screen.getByText(/Arrow Keys/)).toBeInTheDocument()
    })
  })

  describe('pause', () => {
    it('shows PAUSED overlay when pause clicked', () => {
      const { container } = render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      const pauseButton = container.querySelector('button')!
      fireEvent.click(pauseButton)
      expect(screen.getByText('PAUSED')).toBeInTheDocument()
    })

    it('hides PAUSED overlay when resume clicked', () => {
      const { container } = render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      const pauseButton = container.querySelector('button')!
      fireEvent.click(pauseButton) // pause
      expect(screen.getByText('PAUSED')).toBeInTheDocument()
      fireEvent.click(pauseButton) // resume
      expect(screen.queryByText('PAUSED')).toBeNull()
    })
  })

  describe('keyboard events', () => {
    it('adds keyboard event listeners on mount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(addSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
    })

    it('removes keyboard event listeners on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      unmount()
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(removeSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
    })
  })

  describe('game end', () => {
    it('calls onGameEnd when timer expires', () => {
      const onGameEnd = vi.fn()
      render(<GameScreen config={defaultConfig} onGameEnd={onGameEnd} />)

      // Advance Date.now past the game duration
      vi.spyOn(Date, 'now').mockReturnValue(1000 + defaultConfig.duration * 1000 + 1000)

      // Trigger one game loop iteration
      act(() => {
        if (rafCallback) rafCallback(Date.now())
      })

      expect(onGameEnd).toHaveBeenCalledWith(expect.any(Array))
    })
  })

  describe('entity rendering', () => {
    it('renders correct number of fish', () => {
      const { container } = render(<GameScreen config={defaultConfig} onGameEnd={vi.fn()} />)
      // Each fish has a name label
      const fishNames = container.querySelectorAll('.text-xs.font-bold.text-white')
      expect(fishNames.length).toBeGreaterThanOrEqual(2)
    })
  })
})
