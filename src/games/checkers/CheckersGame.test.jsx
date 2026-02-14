import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CheckersGame from './CheckersGame.jsx'

function renderCheckersGame() {
  return render(
    <MemoryRouter>
      <CheckersGame />
    </MemoryRouter>
  )
}

describe('CheckersGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('setup phase', () => {
    it('renders SetupScreen on initial load', () => {
      renderCheckersGame()
      expect(screen.getByText('Checkers')).toBeInTheDocument()
      expect(screen.getByText('Choose your game settings')).toBeInTheDocument()
    })

    it('renders Home link', () => {
      renderCheckersGame()
      expect(screen.getByText(/Home/)).toBeInTheDocument()
    })

    it('renders dark mode toggle button', () => {
      renderCheckersGame()
      expect(screen.getByText(/Dark/)).toBeInTheDocument()
    })

    it('clicking dark mode toggle switches to Light', () => {
      renderCheckersGame()
      const toggle = screen.getByText(/Dark/)
      fireEvent.click(toggle)
      expect(screen.getByText(/Light/)).toBeInTheDocument()
    })

    it('persists dark mode to localStorage', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText(/Dark/))
      expect(localStorage.getItem('checkers:darkMode')).toBe('true')
    })

    it('loads dark mode from localStorage', () => {
      localStorage.setItem('checkers:darkMode', 'true')
      renderCheckersGame()
      expect(screen.getByText(/Light/)).toBeInTheDocument()
    })
  })

  describe('phase transitions', () => {
    it('transitions from SETUP to PLAYING when Start Game clicked', () => {
      renderCheckersGame()
      // Select 2 Players to avoid AI auto-play
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      // Setup should be gone, game board should render
      expect(screen.queryByText('Choose your game settings')).not.toBeInTheDocument()
    })

    it('displays scoreboard after starting', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText('Red')).toBeInTheDocument()
      expect(screen.getByText('Black')).toBeInTheDocument()
    })

    it('displays piece counts in scoreboard', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      // Each side starts with 12 pieces
      const onBoardTexts = screen.getAllByText('On board: 12')
      expect(onBoardTexts).toHaveLength(2)
    })

    it('displays Parent/Teacher Mode panel', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText('Parent/Teacher Mode')).toBeInTheDocument()
    })
  })

  describe('gameplay rendering', () => {
    it('renders game rules section', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText('Game Rules:')).toBeInTheDocument()
    })

    it('renders legend section', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText('Legend:')).toBeInTheDocument()
    })

    it('renders valid move and capture legend items', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText('Valid move')).toBeInTheDocument()
      expect(screen.getByText('Must capture')).toBeInTheDocument()
    })
  })

  describe('hint controls', () => {
    it('Enable Hints button toggles hint mode', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText('Enable Hints')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Enable Hints'))
      expect(screen.getByText('Hints Enabled')).toBeInTheDocument()
    })

    it('Show Hint button appears when hints enabled', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      fireEvent.click(screen.getByText('Enable Hints'))
      expect(screen.getByText('Show Hint')).toBeInTheDocument()
    })

    it('Show Hint button is hidden when hints disabled', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.queryByText('Show Hint')).not.toBeInTheDocument()
    })
  })

  describe('dark mode across phases', () => {
    it('dark mode persists from setup to playing', () => {
      renderCheckersGame()
      fireEvent.click(screen.getByText(/Dark/))
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      // Should still be in dark mode (showing Light toggle)
      expect(screen.getByText(/Light/)).toBeInTheDocument()
    })
  })
})
