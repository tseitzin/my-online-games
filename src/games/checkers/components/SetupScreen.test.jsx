import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SetupScreen from './SetupScreen.jsx'

describe('SetupScreen', () => {
  describe('initial rendering', () => {
    it('renders Checkers heading', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('Checkers')).toBeInTheDocument()
    })

    it('renders subtitle', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('Choose your game settings')).toBeInTheDocument()
    })

    it('renders game mode buttons', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('2 Players')).toBeInTheDocument()
      expect(screen.getByText('vs Computer')).toBeInTheDocument()
    })

    it('renders color selection in default PvC mode', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('Red')).toBeInTheDocument()
      expect(screen.getByText('Black')).toBeInTheDocument()
    })

    it('shows Goes First on Red', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('Goes First')).toBeInTheDocument()
    })

    it('shows Second on Black', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('Second')).toBeInTheDocument()
    })

    it('renders difficulty selection', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('Easy')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('Hard')).toBeInTheDocument()
    })

    it('renders Start Game button', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('Start Game')).toBeInTheDocument()
    })

    it('renders How to Play section', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      expect(screen.getByText('How to Play:')).toBeInTheDocument()
    })
  })

  describe('game mode selection', () => {
    it('clicking 2 Players hides color selection', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      fireEvent.click(screen.getByText('2 Players'))
      expect(screen.queryByText('Choose Your Color')).not.toBeInTheDocument()
    })

    it('clicking 2 Players hides difficulty selection', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      fireEvent.click(screen.getByText('2 Players'))
      expect(screen.queryByText('Difficulty Level')).not.toBeInTheDocument()
    })

    it('clicking vs Computer shows color and difficulty again', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('vs Computer'))
      expect(screen.getByText('Choose Your Color')).toBeInTheDocument()
      expect(screen.getByText('Difficulty Level')).toBeInTheDocument()
    })
  })

  describe('color selection', () => {
    it('clicking Black selects black color', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      fireEvent.click(screen.getByText('Black'))
      // Black button should have selected border
      const blackButton = screen.getByText('Black').closest('button')
      expect(blackButton.className).toContain('border-gray-700')
    })

    it('clicking Red reselects red color', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      fireEvent.click(screen.getByText('Black'))
      fireEvent.click(screen.getByText('Red'))
      const redButton = screen.getByText('Red').closest('button')
      expect(redButton.className).toContain('border-red-500')
    })
  })

  describe('difficulty selection', () => {
    it('clicking Easy selects easy', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      fireEvent.click(screen.getByText('Easy'))
      const easyButton = screen.getByText('Easy').closest('button')
      expect(easyButton.className).toContain('border-green-500')
    })

    it('clicking Hard selects hard', () => {
      render(<SetupScreen onStartGame={vi.fn()} />)
      fireEvent.click(screen.getByText('Hard'))
      const hardButton = screen.getByText('Hard').closest('button')
      expect(hardButton.className).toContain('border-red-500')
    })
  })

  describe('start game', () => {
    it('calls onStartGame with default PvC/red/medium', () => {
      const onStartGame = vi.fn()
      render(<SetupScreen onStartGame={onStartGame} />)
      fireEvent.click(screen.getByText('Start Game'))
      expect(onStartGame).toHaveBeenCalledWith('human-vs-computer', 'red', 'medium')
    })

    it('passes PvP mode when 2 Players selected', () => {
      const onStartGame = vi.fn()
      render(<SetupScreen onStartGame={onStartGame} />)
      fireEvent.click(screen.getByText('2 Players'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(onStartGame).toHaveBeenCalledWith('human-vs-human', 'red', 'medium')
    })

    it('passes black color when Black selected', () => {
      const onStartGame = vi.fn()
      render(<SetupScreen onStartGame={onStartGame} />)
      fireEvent.click(screen.getByText('Black'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(onStartGame).toHaveBeenCalledWith('human-vs-computer', 'black', 'medium')
    })

    it('passes hard difficulty when Hard selected', () => {
      const onStartGame = vi.fn()
      render(<SetupScreen onStartGame={onStartGame} />)
      fireEvent.click(screen.getByText('Hard'))
      fireEvent.click(screen.getByText('Start Game'))
      expect(onStartGame).toHaveBeenCalledWith('human-vs-computer', 'red', 'hard')
    })
  })

  describe('dark mode', () => {
    it('applies dark background when darkMode=true', () => {
      const { container } = render(<SetupScreen onStartGame={vi.fn()} darkMode={true} />)
      const outerDiv = container.firstChild
      expect(outerDiv.style.background).toBe('rgb(26, 32, 44)')
    })

    it('applies light background when darkMode=false', () => {
      const { container } = render(<SetupScreen onStartGame={vi.fn()} darkMode={false} />)
      const outerDiv = container.firstChild
      expect(outerDiv.style.background).toBe('rgb(248, 246, 241)')
    })
  })
})
