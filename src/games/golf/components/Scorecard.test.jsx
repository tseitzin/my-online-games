import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Scorecard from './Scorecard.jsx'

const sampleBreakdown = {
  rawScore: 44,
  matchingColumnCount: 2,
  matchingColumnLargestGroup: 2,
  minusFiveCount: 0,
  bonus: -10,
  final: 34,
  columns: [
    { top: 11, bottom: 11, canceled: true, isMinusFivePair: false, value: 11, countsTowardBonus: false },
    { top: 12, bottom: 12, canceled: true, isMinusFivePair: false, value: 12, countsTowardBonus: true },
    { top: 12, bottom: 12, canceled: true, isMinusFivePair: false, value: 12, countsTowardBonus: true },
    { top: 13, bottom: 14, canceled: false, isMinusFivePair: false, value: null, countsTowardBonus: false },
  ],
}

const defaultProps = {
  holeScores: [],
  overallTotals: [0, 0],
  currentHole: 1,
  playerNames: ['Alice', 'Bob'],
  darkMode: false,
}

describe('Scorecard', () => {
  it('renders heading', () => {
    render(<Scorecard {...defaultProps} />)
    expect(screen.getByText('Golf Card Game Scorecard')).toBeInTheDocument()
  })

  it('renders column headers for each player', () => {
    render(<Scorecard {...defaultProps} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders Hole column header', () => {
    render(<Scorecard {...defaultProps} />)
    expect(screen.getByText('Hole')).toBeInTheDocument()
  })

  it('shows "--" for unplayed holes', () => {
    render(<Scorecard {...defaultProps} />)
    const dashes = screen.getAllByText('--')
    // 9 holes x 2 players + subtotal rows = lots of dashes
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('shows scores for completed holes', () => {
    const holeScores = [
      { hole: 1, scores: [10, 15], breakdowns: [sampleBreakdown, sampleBreakdown] },
    ]
    render(<Scorecard {...defaultProps} holeScores={holeScores} />)
    expect(screen.getAllByText('10')).toHaveLength(1)
    expect(screen.getAllByText('15')).toHaveLength(1)
  })

  it('shows Game Total row', () => {
    render(<Scorecard {...defaultProps} />)
    expect(screen.getByText('Game Total')).toBeInTheDocument()
  })

  it('shows correct game totals', () => {
    render(<Scorecard {...defaultProps} overallTotals={[25, 30]} />)
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('clicking a scored cell opens breakdown modal', () => {
    const holeScores = [
      { hole: 1, scores: [22, 33], breakdowns: [sampleBreakdown, sampleBreakdown] },
    ]
    render(<Scorecard {...defaultProps} holeScores={holeScores} />)
    // Click on Alice's score for hole 1
    fireEvent.click(screen.getByText('22'))
    expect(screen.getByText('Hole 1 - Alice')).toBeInTheDocument()
    expect(screen.getByText('Raw Score')).toBeInTheDocument()
  })

  it('breakdown modal shows score details', () => {
    const holeScores = [
      { hole: 1, scores: [22, 33], breakdowns: [sampleBreakdown, sampleBreakdown] },
    ]
    render(<Scorecard {...defaultProps} holeScores={holeScores} />)
    fireEvent.click(screen.getByText('22'))
    expect(screen.getByText('44')).toBeInTheDocument() // rawScore
    expect(screen.getByText('Matching Columns')).toBeInTheDocument()
    expect(screen.getByText('-10')).toBeInTheDocument() // bonus
  })

  it('clicking close button closes the modal', () => {
    const holeScores = [
      { hole: 1, scores: [22, 33], breakdowns: [sampleBreakdown, sampleBreakdown] },
    ]
    render(<Scorecard {...defaultProps} holeScores={holeScores} />)
    fireEvent.click(screen.getByText('22'))
    expect(screen.getByText('Hole 1 - Alice')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close breakdown'))
    expect(screen.queryByText('Hole 1 - Alice')).not.toBeInTheDocument()
  })

  it('clicking same cell again toggles modal off', () => {
    const holeScores = [
      { hole: 1, scores: [22, 33], breakdowns: [sampleBreakdown, sampleBreakdown] },
    ]
    render(<Scorecard {...defaultProps} holeScores={holeScores} />)
    fireEvent.click(screen.getByText('22'))
    expect(screen.getByText('Hole 1 - Alice')).toBeInTheDocument()
    fireEvent.click(screen.getByText('22'))
    expect(screen.queryByText('Hole 1 - Alice')).not.toBeInTheDocument()
  })

  it('shows subtotal rows after hole 2+', () => {
    const holeScores = [
      { hole: 1, scores: [10, 15], breakdowns: [sampleBreakdown, sampleBreakdown] },
      { hole: 2, scores: [5, 8], breakdowns: [sampleBreakdown, sampleBreakdown] },
    ]
    render(<Scorecard {...defaultProps} holeScores={holeScores} />)
    expect(screen.getByText('Round 2 Subtotal')).toBeInTheDocument()
  })
})
