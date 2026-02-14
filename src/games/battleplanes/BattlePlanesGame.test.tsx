import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithRouter } from './test/battlePlanesTestHelpers'
import BattlePlanesGame from './BattlePlanesGame'

vi.mock('./components/GameSetup', () => ({
  default: ({ onStartGame }: any) => (
    <div data-testid="game-setup">
      <button onClick={() => onStartGame({ planeCount: 10, duration: 1, difficulty: 'medium' })}>
        Mock Start
      </button>
    </div>
  ),
}))

vi.mock('./components/GameScreen', () => ({
  default: ({ config, onExit }: any) => (
    <div data-testid="game-screen">
      <span data-testid="config-planes">{config.planeCount}</span>
      <button onClick={onExit}>Mock Exit</button>
    </div>
  ),
}))

describe('BattlePlanesGame', () => {
  // ─── Setup phase ────────────────────────────────────────────────────────

  describe('setup phase', () => {
    it('renders GameSetup component initially', () => {
      renderWithRouter(<BattlePlanesGame />)
      expect(screen.getByTestId('game-setup')).toBeInTheDocument()
    })

    it('renders Home link with correct text', () => {
      renderWithRouter(<BattlePlanesGame />)
      const homeLink = screen.getByText('← Home')
      expect(homeLink).toBeInTheDocument()
    })

    it('Home link navigates to /', () => {
      renderWithRouter(<BattlePlanesGame />)
      const homeLink = screen.getByText('← Home').closest('a')
      expect(homeLink).toHaveAttribute('href', '/')
    })

    it('Home link has fixed positioning', () => {
      renderWithRouter(<BattlePlanesGame />)
      const homeLink = screen.getByText('← Home').closest('a') as HTMLElement
      expect(homeLink.style.position).toBe('fixed')
    })
  })

  // ─── Phase transitions ──────────────────────────────────────────────────

  describe('phase transitions', () => {
    it('transitions to GameScreen when start is clicked', () => {
      renderWithRouter(<BattlePlanesGame />)
      fireEvent.click(screen.getByText('Mock Start'))

      expect(screen.getByTestId('game-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('game-setup')).not.toBeInTheDocument()
    })

    it('passes correct config to GameScreen', () => {
      renderWithRouter(<BattlePlanesGame />)
      fireEvent.click(screen.getByText('Mock Start'))

      expect(screen.getByTestId('config-planes')).toHaveTextContent('10')
    })

    it('transitions back to GameSetup when exit is clicked', () => {
      renderWithRouter(<BattlePlanesGame />)
      fireEvent.click(screen.getByText('Mock Start'))
      fireEvent.click(screen.getByText('Mock Exit'))

      expect(screen.getByTestId('game-setup')).toBeInTheDocument()
      expect(screen.queryByTestId('game-screen')).not.toBeInTheDocument()
    })

    it('supports full cycle: setup -> playing -> exit -> setup', () => {
      renderWithRouter(<BattlePlanesGame />)

      // Start in setup
      expect(screen.getByTestId('game-setup')).toBeInTheDocument()

      // Transition to playing
      fireEvent.click(screen.getByText('Mock Start'))
      expect(screen.getByTestId('game-screen')).toBeInTheDocument()

      // Transition back to setup
      fireEvent.click(screen.getByText('Mock Exit'))
      expect(screen.getByTestId('game-setup')).toBeInTheDocument()

      // Can start again
      fireEvent.click(screen.getByText('Mock Start'))
      expect(screen.getByTestId('game-screen')).toBeInTheDocument()
    })
  })

  // ─── Home button persistence ────────────────────────────────────────────

  describe('Home button persistence', () => {
    it('Home link is visible during setup phase', () => {
      renderWithRouter(<BattlePlanesGame />)
      expect(screen.getByTestId('game-setup')).toBeInTheDocument()
      expect(screen.getByText('← Home')).toBeInTheDocument()
    })

    it('Home link is visible during playing phase', () => {
      renderWithRouter(<BattlePlanesGame />)
      fireEvent.click(screen.getByText('Mock Start'))

      expect(screen.getByTestId('game-screen')).toBeInTheDocument()
      expect(screen.getByText('← Home')).toBeInTheDocument()
    })
  })
})
