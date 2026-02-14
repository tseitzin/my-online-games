import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RaceGame from './RaceGame'
import { mockCanvasGetContext } from './test/raceTestHelpers'

// Mock RaceCanvas to avoid canvas/RAF complexity
vi.mock('./components/RaceCanvas', () => ({
  RaceCanvas: ({ onRaceFinished, onCarsUpdate, cars }: { onRaceFinished: () => void; onCarsUpdate: (cars: unknown[]) => void; cars: unknown[] }) => (
    <div data-testid="race-canvas">
      <button data-testid="finish-race" onClick={() => onRaceFinished()}>Finish</button>
    </div>
  ),
}))

// Mock Countdown for controlled transitions
vi.mock('./components/Countdown', () => ({
  Countdown: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="countdown">
      <button data-testid="countdown-done" onClick={onComplete}>GO!</button>
    </div>
  ),
}))

// Mock EndScreen
vi.mock('./components/EndScreen', () => ({
  EndScreen: ({ onRaceAgain }: { onRaceAgain: () => void }) => (
    <div data-testid="end-screen">
      <button data-testid="race-again" onClick={onRaceAgain}>Race Again</button>
    </div>
  ),
}))

let canvasMock: ReturnType<typeof mockCanvasGetContext>

beforeEach(() => {
  canvasMock = mockCanvasGetContext()
})

afterEach(() => {
  canvasMock.restore()
  vi.restoreAllMocks()
})

function renderGame() {
  return render(
    <MemoryRouter>
      <RaceGame />
    </MemoryRouter>
  )
}

describe('RaceGame', () => {
  describe('setup phase', () => {
    it('renders SetupScreen with Race Setup title', () => {
      renderGame()
      expect(screen.getByText('Race Setup')).toBeInTheDocument()
    })

    it('renders Home link', () => {
      renderGame()
      const homeLink = screen.getByText(/Home/)
      expect(homeLink.closest('a')).toHaveAttribute('href', '/')
    })

    it('renders Start Race button', () => {
      renderGame()
      expect(screen.getByText('Start Race!')).toBeInTheDocument()
    })
  })

  describe('phase transitions', () => {
    it('Start Race transitions to countdown', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Race!'))
      expect(screen.getByTestId('countdown')).toBeInTheDocument()
    })

    it('countdown complete transitions to racing', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Race!'))
      fireEvent.click(screen.getByTestId('countdown-done'))
      expect(screen.getByTestId('race-canvas')).toBeInTheDocument()
      expect(screen.queryByTestId('countdown')).toBeNull()
    })

    it('race finish transitions to end screen', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Race!'))
      fireEvent.click(screen.getByTestId('countdown-done'))
      fireEvent.click(screen.getByTestId('finish-race'))
      expect(screen.getByTestId('end-screen')).toBeInTheDocument()
    })

    it('Race Again returns to setup', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Race!'))
      fireEvent.click(screen.getByTestId('countdown-done'))
      fireEvent.click(screen.getByTestId('finish-race'))
      fireEvent.click(screen.getByTestId('race-again'))
      expect(screen.getByText('Race Setup')).toBeInTheDocument()
    })
  })

  describe('keyboard events', () => {
    it('adds keyboard listeners on mount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      renderGame()
      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(addSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
    })

    it('removes keyboard listeners on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderGame()
      unmount()
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(removeSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
    })
  })

  describe('Home button', () => {
    it('Home button visible during setup', () => {
      renderGame()
      expect(screen.getByText(/Home/)).toBeInTheDocument()
    })

    it('Home button visible during racing', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Race!'))
      fireEvent.click(screen.getByTestId('countdown-done'))
      expect(screen.getByText(/Home/)).toBeInTheDocument()
    })
  })
})
