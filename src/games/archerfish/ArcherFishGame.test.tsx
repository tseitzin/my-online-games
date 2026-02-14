import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArcherFishGame from './ArcherFishGame'

// Mock GameScreen to avoid RAF complexity in integration tests
vi.mock('./components/GameScreen', () => ({
  default: ({ config, onGameEnd }: { config: unknown; onGameEnd: (fish: unknown[]) => void }) => (
    <div data-testid="game-screen">
      <button onClick={() => onGameEnd([
        { id: 0, name: 'Player 1', color: '#10b981', survivalTime: 90, isHuman: true, frozenTime: 10, isFrozen: false, frozenUntil: 0, position: { x: 100, y: 100 }, velocity: { x: 0, y: 0 }, lastWaterJetTime: 0, waterJetCooldown: 3000 },
        { id: 1, name: 'AI Fish', color: '#3b82f6', survivalTime: 60, isHuman: false, frozenTime: 20, isFrozen: false, frozenUntil: 0, position: { x: 200, y: 200 }, velocity: { x: 0, y: 0 }, lastWaterJetTime: 0, waterJetCooldown: 3000 },
      ])}>
        End Game
      </button>
    </div>
  ),
}))

// Mock GameResults to simplify
vi.mock('./components/GameResults', () => ({
  default: ({ onPlayAgain }: { onPlayAgain: () => void }) => (
    <div data-testid="game-results">
      <button onClick={onPlayAgain}>Play Again</button>
    </div>
  ),
}))

// Mock leaderboard to avoid localStorage in integration
vi.mock('./utils/leaderboard', () => ({
  getLeaderboard: vi.fn(() => []),
  clearLeaderboard: vi.fn(() => true),
  saveLeaderboardEntry: vi.fn(() => true),
}))

function renderGame() {
  return render(
    <MemoryRouter>
      <ArcherFishGame />
    </MemoryRouter>
  )
}

describe('ArcherFishGame', () => {
  describe('setup phase', () => {
    it('renders GameSetup on initial load', () => {
      renderGame()
      expect(screen.getByText('Archer Fish Racing')).toBeInTheDocument()
    })

    it('renders Home link', () => {
      renderGame()
      expect(screen.getByText('← Home')).toBeInTheDocument()
    })

    it('Home link points to root', () => {
      renderGame()
      const homeLink = screen.getByText('← Home')
      expect(homeLink.getAttribute('href')).toBe('/')
    })
  })

  describe('phase transitions', () => {
    it('transitions from setup to playing when Start Game clicked', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Game!'))
      expect(screen.getByTestId('game-screen')).toBeInTheDocument()
    })

    it('transitions from playing to results when game ends', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Game!'))
      fireEvent.click(screen.getByText('End Game'))
      expect(screen.getByTestId('game-results')).toBeInTheDocument()
    })

    it('transitions from results back to setup when Play Again clicked', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Game!'))
      fireEvent.click(screen.getByText('End Game'))
      fireEvent.click(screen.getByText('Play Again'))
      expect(screen.getByText('Archer Fish Racing')).toBeInTheDocument()
    })
  })

  describe('home button persistence', () => {
    it('shows Home button during playing phase', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Game!'))
      expect(screen.getByText('← Home')).toBeInTheDocument()
    })

    it('shows Home button during results phase', () => {
      renderGame()
      fireEvent.click(screen.getByText('Start Game!'))
      fireEvent.click(screen.getByText('End Game'))
      expect(screen.getByText('← Home')).toBeInTheDocument()
    })
  })
})
