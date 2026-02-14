import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EndScreen } from './EndScreen'
import { makeCar, mockCanvasGetContext } from '../test/raceTestHelpers'

let canvasMock: ReturnType<typeof mockCanvasGetContext>

beforeEach(() => {
  canvasMock = mockCanvasGetContext()
})

afterEach(() => {
  canvasMock.restore()
})

const finishedCars = [
  makeCar({ id: 'p1', number: 7, color: '#E53935', isAI: false, playerIndex: 0, finished: true, finishPosition: 1, lapsCompleted: 3 }),
  makeCar({ id: 'ai1', number: 42, color: '#1E88E5', isAI: true, finished: true, finishPosition: 2, lapsCompleted: 3 }),
  makeCar({ id: 'ai2', number: 13, color: '#43A047', isAI: true, finished: true, finishPosition: 3, lapsCompleted: 3 }),
]

describe('EndScreen', () => {
  it('renders "Race Complete!" title', () => {
    render(<EndScreen cars={finishedCars} onRaceAgain={vi.fn()} />)
    expect(screen.getByText('Race Complete!')).toBeInTheDocument()
  })

  it('renders winner car number', () => {
    render(<EndScreen cars={finishedCars} onRaceAgain={vi.fn()} />)
    // Winner #7 appears in both winner section and standings
    expect(screen.getAllByText('#7').length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Final Standings" section', () => {
    render(<EndScreen cars={finishedCars} onRaceAgain={vi.fn()} />)
    expect(screen.getByText('Final Standings')).toBeInTheDocument()
  })

  it('renders all cars in standings', () => {
    render(<EndScreen cars={finishedCars} onRaceAgain={vi.fn()} />)
    expect(screen.getAllByText('#7').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.getByText('#13')).toBeInTheDocument()
  })

  it('shows position labels', () => {
    render(<EndScreen cars={finishedCars} onRaceAgain={vi.fn()} />)
    expect(screen.getByText('1st Place')).toBeInTheDocument()
    expect(screen.getByText('2nd Place')).toBeInTheDocument()
    expect(screen.getByText('3rd Place')).toBeInTheDocument()
  })

  it('shows Player badge for human winner', () => {
    render(<EndScreen cars={finishedCars} onRaceAgain={vi.fn()} />)
    expect(screen.getByText('Player 1')).toBeInTheDocument()
  })

  it('shows AI Racer badge for AI winner', () => {
    const aiFirst = [
      makeCar({ id: 'ai1', number: 42, isAI: true, finished: true, finishPosition: 1, lapsCompleted: 3 }),
      makeCar({ id: 'p1', number: 7, isAI: false, playerIndex: 0, finished: true, finishPosition: 2, lapsCompleted: 3 }),
    ]
    render(<EndScreen cars={aiFirst} onRaceAgain={vi.fn()} />)
    expect(screen.getByText('AI Racer')).toBeInTheDocument()
  })

  it('sorts by finishPosition', () => {
    // Pass cars in reverse order
    const reversed = [...finishedCars].reverse()
    render(<EndScreen cars={reversed} onRaceAgain={vi.fn()} />)
    const places = screen.getAllByText(/Place/)
    expect(places[0].textContent).toBe('1st Place')
  })

  it('Race Again button fires callback', () => {
    const onRaceAgain = vi.fn()
    render(<EndScreen cars={finishedCars} onRaceAgain={onRaceAgain} />)
    fireEvent.click(screen.getByText('Race Again'))
    expect(onRaceAgain).toHaveBeenCalledTimes(1)
  })

  it('renders confetti particles', () => {
    const { container } = render(<EndScreen cars={finishedCars} onRaceAgain={vi.fn()} />)
    const confettiPieces = container.querySelectorAll('.animate-confetti')
    expect(confettiPieces.length).toBe(50)
  })
})
