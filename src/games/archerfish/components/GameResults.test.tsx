import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameResults from './GameResults'
import { makeFish, makeGameConfig } from '../test/archerFishTestHelpers'
import * as leaderboardModule from '../utils/leaderboard'

vi.mock('../utils/leaderboard', () => ({
  saveLeaderboardEntry: vi.fn(() => true),
}))

const defaultFish = [
  makeFish({ id: 0, name: 'Player 1', color: '#10b981', survivalTime: 90, isHuman: true, frozenTime: 10 }),
  makeFish({ id: 1, name: 'AI Fish', color: '#3b82f6', survivalTime: 60, isHuman: false, frozenTime: 20 }),
]

const defaultConfig = makeGameConfig()

describe('GameResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders Game Over heading', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('Game Over!')).toBeInTheDocument()
    })

    it('shows winner name with Wins!', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('Player 1 Wins!')).toBeInTheDocument()
    })

    it('shows winner survival time', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText(/Survived for/)).toBeInTheDocument()
    })

    it('renders Final Scores heading', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('Final Scores')).toBeInTheDocument()
    })

    it('renders all fish names in results', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('AI Fish')).toBeInTheDocument()
    })

    it('renders medal emojis for top 3', () => {
      const threeFish = [
        makeFish({ id: 0, name: 'First', survivalTime: 90 }),
        makeFish({ id: 1, name: 'Second', survivalTime: 60 }),
        makeFish({ id: 2, name: 'Third', survivalTime: 30 }),
      ]
      render(<GameResults fish={threeFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('1st Place')).toBeInTheDocument()
      expect(screen.getByText('2nd Place')).toBeInTheDocument()
      expect(screen.getByText('3rd Place')).toBeInTheDocument()
    })

    it('shows Human/AI labels', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('Human Player')).toBeInTheDocument()
      expect(screen.getByText('AI Player')).toBeInTheDocument()
    })

    it('renders Play Again button', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('Play Again')).toBeInTheDocument()
    })

    it('shows game settings summary', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('Game Settings')).toBeInTheDocument()
      expect(screen.getByText('medium')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('sorts fish by survival time descending', () => {
      const fish = [
        makeFish({ id: 0, name: 'Slow', survivalTime: 30 }),
        makeFish({ id: 1, name: 'Fast', survivalTime: 90 }),
      ]
      render(<GameResults fish={fish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      // Winner should be "Fast"
      expect(screen.getByText('Fast Wins!')).toBeInTheDocument()
    })
  })

  describe('play again', () => {
    it('calls onPlayAgain when Play Again clicked', () => {
      const onPlayAgain = vi.fn()
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={onPlayAgain} />)
      fireEvent.click(screen.getByText('Play Again'))
      expect(onPlayAgain).toHaveBeenCalledOnce()
    })
  })

  describe('leaderboard saving', () => {
    it('saves winner to leaderboard on mount', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(leaderboardModule.saveLeaderboardEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          player_name: 'Player 1',
          difficulty: 'medium',
          is_human: true,
        })
      )
    })

    it('shows saved confirmation', () => {
      render(<GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />)
      expect(screen.getByText('Results saved to leaderboard!')).toBeInTheDocument()
    })

    it('saves only once even on rerender', () => {
      const { rerender } = render(
        <GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />
      )
      rerender(
        <GameResults fish={defaultFish} config={defaultConfig} onPlayAgain={vi.fn()} />
      )
      // Should only be called once due to hasSaved ref
      expect(leaderboardModule.saveLeaderboardEntry).toHaveBeenCalledTimes(1)
    })
  })
})
