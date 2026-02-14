import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import DotsGame from './DotsGame.jsx'
import { renderWithRouter } from './test/dotsTestHelpers.jsx'

// Helper to start a game with a specific grid size (minimum 3)
function startGame(gridSize = '3') {
	renderWithRouter(<DotsGame />)

	// Change grid size from default 10 to the specified size
	const gridInput = screen.getByDisplayValue('10')
	fireEvent.change(gridInput, { target: { value: gridSize } })

	// Click Start Game
	fireEvent.click(screen.getByText('Start Game'))
}

// Helper to click all available hitbox rects (transparent rects) to complete the game.
// For boardSize=4 (grid 3x3), there are 24 lines total.
// Each undrawn line has a transparent hitbox rect.
function clickAllLines(container) {
	let clickCount = 0
	const maxClicks = 100 // safety limit
	while (clickCount < maxClicks) {
		// Find all transparent hitbox rects that are still available
		const rects = container.querySelectorAll('rect[fill="transparent"]')
		if (rects.length === 0) break
		fireEvent.click(rects[0])
		clickCount++
	}
	return clickCount
}

describe('DotsGame', () => {
	beforeEach(() => {
		localStorage.clear()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe('setup phase', () => {
		it('renders SetupScreen with "Dots and Boxes" title on initial load', () => {
			renderWithRouter(<DotsGame />)
			expect(screen.getByText('Dots and Boxes')).toBeInTheDocument()
		})

		it('renders Home link with href="/"', () => {
			renderWithRouter(<DotsGame />)
			const homeLink = screen.getByText(/Home/)
			expect(homeLink).toBeInTheDocument()
			expect(homeLink.closest('a')).toHaveAttribute('href', '/')
		})

		it('renders dark mode toggle button', () => {
			renderWithRouter(<DotsGame />)
			expect(screen.getByText(/Dark/)).toBeInTheDocument()
		})
	})

	describe('dark mode', () => {
		it('starts in light mode by default (button shows "Dark")', () => {
			renderWithRouter(<DotsGame />)
			expect(screen.getByText(/Dark/)).toBeInTheDocument()
			expect(screen.queryByText(/Light/)).not.toBeInTheDocument()
		})

		it('toggles to dark mode on button click (button changes to "Light")', () => {
			renderWithRouter(<DotsGame />)
			fireEvent.click(screen.getByText(/Dark/))
			expect(screen.getByText(/Light/)).toBeInTheDocument()
			expect(screen.queryByText(/Dark/)).not.toBeInTheDocument()
		})

		it('toggles back to light mode on second click', () => {
			renderWithRouter(<DotsGame />)
			const toggle = screen.getByText(/Dark/)
			fireEvent.click(toggle)
			expect(screen.getByText(/Light/)).toBeInTheDocument()
			fireEvent.click(screen.getByText(/Light/))
			expect(screen.getByText(/Dark/)).toBeInTheDocument()
		})

		it('persists dark mode to localStorage (key: "dots:darkMode")', () => {
			renderWithRouter(<DotsGame />)
			fireEvent.click(screen.getByText(/Dark/))
			expect(localStorage.getItem('dots:darkMode')).toBe('true')
		})

		it('reads dark mode from localStorage on mount', () => {
			localStorage.setItem('dots:darkMode', 'true')
			renderWithRouter(<DotsGame />)
			expect(screen.getByText(/Light/)).toBeInTheDocument()
			expect(screen.queryByText(/Dark/)).not.toBeInTheDocument()
		})

		it('handles corrupted localStorage gracefully (defaults to false)', () => {
			localStorage.setItem('dots:darkMode', 'not-valid-json')
			renderWithRouter(<DotsGame />)
			// Should fall back to light mode
			expect(screen.getByText(/Dark/)).toBeInTheDocument()
		})
	})

	describe('phase transitions', () => {
		it('transitions from setup to playing when game is started', () => {
			startGame()
			// Setup elements should be gone
			expect(screen.queryByText('Dots and Boxes')).not.toBeInTheDocument()
			// Playing elements should be present (turn indicator)
			expect(screen.getByText(/Turn/)).toBeInTheDocument()
		})

		it('shows GameBoard after starting game (renders SVG board)', () => {
			startGame()
			// GameBoard renders an SVG element
			const svg = document.querySelector('svg')
			expect(svg).toBeInTheDocument()
		})

		it('hides SetupScreen title after starting game', () => {
			startGame()
			expect(screen.queryByText('Dots and Boxes')).not.toBeInTheDocument()
			expect(screen.queryByText('Start Game')).not.toBeInTheDocument()
		})
	})

	describe('playing phase', () => {
		it('renders Home link during playing phase', () => {
			startGame()
			const homeLink = screen.getByText(/Home/)
			expect(homeLink).toBeInTheDocument()
			expect(homeLink.closest('a')).toHaveAttribute('href', '/')
		})

		it('renders dark mode toggle during playing phase', () => {
			startGame()
			expect(screen.getByText(/Dark/)).toBeInTheDocument()
		})

		it('renders Undo Last Move button during playing phase', () => {
			startGame()
			expect(screen.getByText(/Undo Last Move/)).toBeInTheDocument()
		})

		it('dark mode persists across phase transitions', () => {
			renderWithRouter(<DotsGame />)

			// Toggle dark mode in setup phase
			fireEvent.click(screen.getByText(/Dark/))
			expect(screen.getByText(/Light/)).toBeInTheDocument()

			// Transition to playing phase
			const gridInput = screen.getByDisplayValue('10')
			fireEvent.change(gridInput, { target: { value: '3' } })
			fireEvent.click(screen.getByText('Start Game'))

			// Dark mode should still be active in playing phase
			expect(screen.getByText(/Light/)).toBeInTheDocument()
			expect(screen.queryByText(/Dark/)).not.toBeInTheDocument()
		})
	})

	describe('results phase', () => {
		it('shows EndScreen overlay when game is over', () => {
			const { container } = renderWithRouter(<DotsGame />)

			// Set grid to minimum size (3 = 3x3 boxes, boardSize 4, 24 lines)
			const gridInput = screen.getByDisplayValue('10')
			fireEvent.change(gridInput, { target: { value: '3' } })
			fireEvent.click(screen.getByText('Start Game'))

			// Click all available lines to complete the game
			clickAllLines(container)

			// EndScreen should appear with "Game Over!" text
			expect(screen.getByText('Game Over!')).toBeInTheDocument()
			expect(screen.getByText('Play Again')).toBeInTheDocument()
			expect(screen.getByText('New Game')).toBeInTheDocument()
		})

		it('Play Again stays in playing phase and resets board', () => {
			const { container } = renderWithRouter(<DotsGame />)

			// Start a small game
			const gridInput = screen.getByDisplayValue('10')
			fireEvent.change(gridInput, { target: { value: '3' } })
			fireEvent.click(screen.getByText('Start Game'))

			// Complete the game
			clickAllLines(container)
			expect(screen.getByText('Game Over!')).toBeInTheDocument()

			// Click Play Again
			fireEvent.click(screen.getByText('Play Again'))

			// Should still be in playing phase (GameBoard visible, not setup)
			expect(screen.queryByText('Game Over!')).not.toBeInTheDocument()
			expect(screen.queryByText('Dots and Boxes')).not.toBeInTheDocument()
			expect(screen.getByText(/Turn/)).toBeInTheDocument()

			// Board should be reset — transparent hitbox rects should reappear
			const rects = container.querySelectorAll('rect[fill="transparent"]')
			expect(rects.length).toBeGreaterThan(0)
		})

		it('New Game returns to setup phase', () => {
			const { container } = renderWithRouter(<DotsGame />)

			// Start a small game
			const gridInput = screen.getByDisplayValue('10')
			fireEvent.change(gridInput, { target: { value: '3' } })
			fireEvent.click(screen.getByText('Start Game'))

			// Complete the game
			clickAllLines(container)
			expect(screen.getByText('Game Over!')).toBeInTheDocument()

			// Click New Game
			fireEvent.click(screen.getByText('New Game'))

			// Should be back in setup phase
			expect(screen.getByText('Dots and Boxes')).toBeInTheDocument()
			expect(screen.getByText('Start Game')).toBeInTheDocument()
			expect(screen.queryByText('Game Over!')).not.toBeInTheDocument()
		})
	})

	describe('Home button', () => {
		it('Home link has href="/" pointing to home page', () => {
			renderWithRouter(<DotsGame />)
			const homeLinks = screen.getAllByText(/Home/)
			const link = homeLinks[0].closest('a')
			expect(link).toHaveAttribute('href', '/')
		})
	})
})
