import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlayerBoard from './PlayerBoard.jsx'

const makeCards = (values, allFaceUp = false) =>
  values.map((value, i) => ({ id: i, value, faceUp: allFaceUp }))

const defaultProps = {
  index: 0,
  player: {
    cards: makeCards([5, 3, 7, 2, 5, 8, 1, 4]),
    flippedCount: 0,
  },
  name: 'Alice',
  color: '#fbbf24',
  isComputer: false,
  isCurrentPlayer: true,
  darkMode: false,
  runningTotal: 15,
  canInteractWithCard: vi.fn(() => false),
  onCardClick: vi.fn(),
}

describe('PlayerBoard', () => {
  it('renders player name', () => {
    render(<PlayerBoard {...defaultProps} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders running total', () => {
    render(<PlayerBoard {...defaultProps} runningTotal={15} />)
    expect(screen.getByText('Running Total: 15')).toBeInTheDocument()
  })

  it('renders 8 Card components', () => {
    const { container } = render(<PlayerBoard {...defaultProps} />)
    // Each Card renders a div with perspective style - count card wrappers in the grid
    const grid = container.querySelector('div[style*="grid"]')
    expect(grid.children).toHaveLength(8)
  })

  it('shows current player indicator when isCurrentPlayer true', () => {
    render(<PlayerBoard {...defaultProps} isCurrentPlayer={true} />)
    expect(screen.getByText('👈')).toBeInTheDocument()
  })

  it('does not show indicator when not current player', () => {
    render(<PlayerBoard {...defaultProps} isCurrentPlayer={false} />)
    expect(screen.queryByText('👈')).not.toBeInTheDocument()
  })

  it('applies highlight box-shadow for current player', () => {
    const { container } = render(<PlayerBoard {...defaultProps} isCurrentPlayer={true} />)
    const grid = container.querySelector('div[style*="grid"]')
    expect(grid.style.boxShadow).toContain('0 0 0 4px')
  })

  it('does not apply highlight shadow when not current player', () => {
    const { container } = render(<PlayerBoard {...defaultProps} isCurrentPlayer={false} />)
    const grid = container.querySelector('div[style*="grid"]')
    expect(grid.style.boxShadow).not.toContain('0 0 0 4px')
  })

  it('applies dark mode text color', () => {
    render(<PlayerBoard {...defaultProps} darkMode={true} />)
    const totalText = screen.getByText('Running Total: 15')
    // JSDOM may return hex or rgb format
    const color = totalText.style.color
    expect(color === '#e5e5e5' || color === 'rgb(229, 229, 229)').toBe(true)
  })

  it('renders with all face-up cards showing values', () => {
    const player = {
      cards: makeCards([5, 3, 7, 2, 5, 8, 1, 4], true),
      flippedCount: 8,
    }
    render(<PlayerBoard {...defaultProps} player={player} />)
    // Face-up cards show their values
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
