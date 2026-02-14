import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EndScreen from './EndScreen.jsx'

const defaultPlayers = [
  { name: 'Alice', isComputer: false, color: '#3B82F6', score: 5 },
  { name: 'Bob', isComputer: false, color: '#EF4444', score: 3 },
]

const defaultProps = {
  players: defaultPlayers,
  winner: defaultPlayers[0],
  onPlayAgain: vi.fn(),
  onNewGame: vi.fn(),
  darkMode: false,
}

describe('EndScreen', () => {
  describe('structure', () => {
    it('renders "Game Over!" heading', () => {
      render(<EndScreen {...defaultProps} />)
      expect(screen.getByText('Game Over!')).toBeInTheDocument()
    })

    it('renders "Final Scores" subheading', () => {
      render(<EndScreen {...defaultProps} />)
      expect(screen.getByText('Final Scores')).toBeInTheDocument()
    })

    it('renders Play Again button', () => {
      render(<EndScreen {...defaultProps} />)
      expect(screen.getByText('Play Again')).toBeInTheDocument()
    })

    it('renders New Game button', () => {
      render(<EndScreen {...defaultProps} />)
      expect(screen.getByText('New Game')).toBeInTheDocument()
    })
  })

  describe('winner display', () => {
    it('shows winner name with "Wins!" when single winner', () => {
      render(<EndScreen {...defaultProps} />)
      expect(screen.getByText('Alice Wins!')).toBeInTheDocument()
    })

    it('applies winner color to winner text', () => {
      render(<EndScreen {...defaultProps} />)
      const winnerText = screen.getByText('Alice Wins!')
      // JSDOM returns CSS colors as rgb() not hex
      expect(winnerText.style.color).toBe('rgb(59, 130, 246)')
    })

    it('shows "It\'s a Tie!" when scores are tied', () => {
      const tiedPlayers = [
        { name: 'Alice', isComputer: false, color: '#3B82F6', score: 4 },
        { name: 'Bob', isComputer: false, color: '#EF4444', score: 4 },
      ]
      render(
        <EndScreen
          {...defaultProps}
          players={tiedPlayers}
          winner={null}
        />
      )
      expect(screen.getByText("It's a Tie!")).toBeInTheDocument()
    })

    it('applies amber color to tie text', () => {
      const tiedPlayers = [
        { name: 'Alice', isComputer: false, color: '#3B82F6', score: 4 },
        { name: 'Bob', isComputer: false, color: '#EF4444', score: 4 },
      ]
      render(
        <EndScreen
          {...defaultProps}
          players={tiedPlayers}
          winner={null}
        />
      )
      const tieText = screen.getByText("It's a Tie!")
      expect(tieText.style.color).toBe('rgb(245, 158, 11)')
    })
  })

  describe('scores', () => {
    it('shows all player names', () => {
      render(<EndScreen {...defaultProps} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('shows player scores', () => {
      render(<EndScreen {...defaultProps} />)
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows score 0 for players without score property', () => {
      const noScorePlayers = [
        { name: 'Alice', isComputer: false, color: '#3B82F6' },
        { name: 'Bob', isComputer: false, color: '#EF4444' },
      ]
      render(
        <EndScreen
          {...defaultProps}
          players={noScorePlayers}
          winner={null}
        />
      )
      const zeros = screen.getAllByText('0')
      expect(zeros).toHaveLength(2)
    })

    it('renders player color indicator circles', () => {
      const { container } = render(<EndScreen {...defaultProps} />)
      // Color dots are 24x24 circular divs with borderRadius 50%
      const allDivs = container.querySelectorAll('div')
      const colorDots = Array.from(allDivs).filter(
        (div) =>
          div.style.width === '24px' &&
          div.style.height === '24px' &&
          div.style.borderRadius === '50%'
      )
      expect(colorDots).toHaveLength(2)
      // JSDOM returns CSS colors as rgb() not hex
      expect(colorDots[0].style.backgroundColor).toBe('rgb(59, 130, 246)')
      expect(colorDots[1].style.backgroundColor).toBe('rgb(239, 68, 68)')
    })
  })

  describe('interactions', () => {
    it('calls onPlayAgain when Play Again button clicked', () => {
      const onPlayAgain = vi.fn()
      render(<EndScreen {...defaultProps} onPlayAgain={onPlayAgain} />)
      fireEvent.click(screen.getByText('Play Again'))
      expect(onPlayAgain).toHaveBeenCalledOnce()
    })

    it('calls onNewGame when New Game button clicked', () => {
      const onNewGame = vi.fn()
      render(<EndScreen {...defaultProps} onNewGame={onNewGame} />)
      fireEvent.click(screen.getByText('New Game'))
      expect(onNewGame).toHaveBeenCalledOnce()
    })
  })

  describe('dark mode', () => {
    it('applies light theme overlay when darkMode false', () => {
      const { container } = render(<EndScreen {...defaultProps} darkMode={false} />)
      // Outermost div is the overlay
      const overlay = container.firstChild
      expect(overlay.style.backgroundColor).toBe('rgba(0, 0, 0, 0.7)')
    })

    it('applies dark theme overlay when darkMode true', () => {
      const { container } = render(<EndScreen {...defaultProps} darkMode={true} />)
      const overlay = container.firstChild
      expect(overlay.style.backgroundColor).toBe('rgba(0, 0, 0, 0.85)')
    })
  })
})
