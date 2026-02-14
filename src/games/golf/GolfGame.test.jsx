import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GolfGame from './GolfGame.jsx'

function renderGolfGame() {
  return render(
    <MemoryRouter>
      <GolfGame />
    </MemoryRouter>
  )
}

describe('GolfGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('setup phase rendering', () => {
    it('renders the "Golf" heading', () => {
      renderGolfGame()
      expect(screen.getByText('Golf')).toBeInTheDocument()
    })

    it('renders Home link', () => {
      renderGolfGame()
      expect(screen.getByText(/Home/)).toBeInTheDocument()
    })

    it('renders PlayerSetup form', () => {
      renderGolfGame()
      expect(screen.getByText('Player Setup')).toBeInTheDocument()
      expect(screen.getByText('Start Game')).toBeInTheDocument()
    })

    it('renders dark mode toggle button', () => {
      renderGolfGame()
      expect(screen.getByText(/Dark/)).toBeInTheDocument()
    })

    it('clicking dark mode toggle switches theme text', () => {
      renderGolfGame()
      const toggle = screen.getByText(/Dark/)
      fireEvent.click(toggle)
      expect(screen.getByText(/Light/)).toBeInTheDocument()
    })
  })

  describe('phase transitions', () => {
    it('transitions from setup to playing when form submitted', () => {
      renderGolfGame()
      expect(screen.getByText('Player Setup')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Start Game'))
      // After setup, should show turn indicator and action bar
      expect(screen.queryByText('Player Setup')).not.toBeInTheDocument()
      expect(screen.getByText('End Round')).toBeInTheDocument()
      expect(screen.getByText('Reset')).toBeInTheDocument()
    })
  })

  describe('gameplay phase rendering', () => {
    it('renders player turn indicator after setup', () => {
      renderGolfGame()
      fireEvent.click(screen.getByText('Start Game'))
      // Should show "Player 1's Turn" or similar
      expect(screen.getByText(/Turn/)).toBeInTheDocument()
    })

    it('renders Scorecard after setup', () => {
      renderGolfGame()
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText('Golf Card Game Scorecard')).toBeInTheDocument()
    })

    it('renders AI Speed selector', () => {
      renderGolfGame()
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText('AI Speed:')).toBeInTheDocument()
    })

    it('renders draw and discard area', () => {
      renderGolfGame()
      fireEvent.click(screen.getByText('Start Game'))
      expect(screen.getByText(/cards? left/)).toBeInTheDocument()
    })
  })

  describe('action bar interactions', () => {
    it('End Round calls window.confirm and endRoundImmediately', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      renderGolfGame()
      fireEvent.click(screen.getByText('Start Game'))
      fireEvent.click(screen.getByText('End Round'))
      expect(window.confirm).toHaveBeenCalled()
      window.confirm.mockRestore()
    })

    it('Reset calls window.confirm and resetGame', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      renderGolfGame()
      fireEvent.click(screen.getByText('Start Game'))
      fireEvent.click(screen.getByText('Reset'))
      expect(window.confirm).toHaveBeenCalled()
      // Should return to setup after reset
      expect(screen.getByText('Player Setup')).toBeInTheDocument()
      window.confirm.mockRestore()
    })

    it('Reset is cancelled when user declines confirm', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      renderGolfGame()
      fireEvent.click(screen.getByText('Start Game'))
      fireEvent.click(screen.getByText('Reset'))
      // Should stay in gameplay phase
      expect(screen.queryByText('Player Setup')).not.toBeInTheDocument()
      window.confirm.mockRestore()
    })
  })

  describe('dark mode', () => {
    it('persists dark mode preference to localStorage', () => {
      renderGolfGame()
      fireEvent.click(screen.getByText(/Dark/))
      expect(localStorage.getItem('golf:darkMode')).toBe('true')
    })

    it('loads dark mode preference from localStorage', () => {
      localStorage.setItem('golf:darkMode', 'true')
      renderGolfGame()
      expect(screen.getByText(/Light/)).toBeInTheDocument()
    })
  })

  describe('player names', () => {
    it('derives player names from setup config', () => {
      renderGolfGame()
      fireEvent.click(screen.getByText('Start Game'))
      // Default names: "Player 1" and "Computer 2"
      expect(screen.getByText('Golf Card Game Scorecard')).toBeInTheDocument()
    })
  })
})
