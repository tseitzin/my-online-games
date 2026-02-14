import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import {
	renderDotsHook,
	initGame,
	makeGameConfig,
	makePlayers,
	makeComputerPlayer,
	makePlayer,
	lineKey,
	buildLines,
	boxLines,
	threeOfFourLines,
} from '../test/dotsTestHelpers.jsx'

vi.mock('../utils/aiLogic', () => ({
	findBestMove: vi.fn(),
}))

import { findBestMove } from '../utils/aiLogic'

describe('useGameState', () => {
	// ─── Initial state ─────────────────────────────────────────────────

	describe('initial state', () => {
		it('starts with empty players array', () => {
			const { result } = renderDotsHook()
			expect(result.current.players).toEqual([])
		})

		it('defaults boardSize to 4', () => {
			const { result } = renderDotsHook()
			expect(result.current.boardSize).toBe(4)
		})

		it('starts with currentPlayerIndex 0', () => {
			const { result } = renderDotsHook()
			expect(result.current.currentPlayerIndex).toBe(0)
		})

		it('starts with empty lines object', () => {
			const { result } = renderDotsHook()
			expect(result.current.lines).toEqual({})
		})

		it('starts with empty boxes object', () => {
			const { result } = renderDotsHook()
			expect(result.current.boxes).toEqual({})
		})

		it('starts with gameOver false', () => {
			const { result } = renderDotsHook()
			expect(result.current.gameOver).toBe(false)
		})

		it('starts with winner null', () => {
			const { result } = renderDotsHook()
			expect(result.current.winner).toBeNull()
		})

		it('starts with lastMove null', () => {
			const { result } = renderDotsHook()
			expect(result.current.lastMove).toBeNull()
		})
	})

	// ─── initializeGame ────────────────────────────────────────────────

	describe('initializeGame', () => {
		it('sets players from config', async () => {
			const { result } = renderDotsHook()
			const config = makeGameConfig()
			await initGame(result, config)
			expect(result.current.players).toHaveLength(2)
			expect(result.current.players[0].name).toBe('Player 1')
			expect(result.current.players[1].name).toBe('Player 2')
		})

		it('sets boardSize from config', async () => {
			const { result } = renderDotsHook()
			await initGame(result, makeGameConfig({ boardSize: 5 }))
			expect(result.current.boardSize).toBe(5)
		})

		it('resets currentPlayerIndex to 0', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Make a move to change player index
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.currentPlayerIndex).toBe(1)
			// Re-initialize should reset to 0
			await initGame(result)
			expect(result.current.currentPlayerIndex).toBe(0)
		})

		it('clears lines', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(Object.keys(result.current.lines).length).toBeGreaterThan(0)
			await initGame(result)
			expect(result.current.lines).toEqual({})
		})

		it('clears boxes', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			expect(result.current.boxes).toEqual({})
		})

		it('sets gameOver to false', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			expect(result.current.gameOver).toBe(false)
		})

		it('handles 3-player config', async () => {
			const { result } = renderDotsHook()
			const config = makeGameConfig({ players: makePlayers(3) })
			await initGame(result, config)
			expect(result.current.players).toHaveLength(3)
			expect(result.current.players[2].name).toBe('Player 3')
		})

		it('handles 4-player config', async () => {
			const { result } = renderDotsHook()
			const config = makeGameConfig({ players: makePlayers(4) })
			await initGame(result, config)
			expect(result.current.players).toHaveLength(4)
			expect(result.current.players[3].name).toBe('Player 4')
		})
	})

	// ─── resetGame ─────────────────────────────────────────────────────

	describe('resetGame', () => {
		it('resets currentPlayerIndex to 0', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.currentPlayerIndex).toBe(1)
			act(() => { result.current.resetGame() })
			expect(result.current.currentPlayerIndex).toBe(0)
		})

		it('clears lines', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(Object.keys(result.current.lines).length).toBeGreaterThan(0)
			act(() => { result.current.resetGame() })
			expect(result.current.lines).toEqual({})
		})

		it('clears boxes', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.resetGame() })
			expect(result.current.boxes).toEqual({})
		})

		it('sets gameOver to false', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.resetGame() })
			expect(result.current.gameOver).toBe(false)
		})

		it('sets winner to null', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.resetGame() })
			expect(result.current.winner).toBeNull()
		})

		it('sets lastMove to null', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.lastMove).not.toBeNull()
			act(() => { result.current.resetGame() })
			expect(result.current.lastMove).toBeNull()
		})

		it('preserves players and boardSize', async () => {
			const { result } = renderDotsHook()
			const config = makeGameConfig({ boardSize: 5, players: makePlayers(3) })
			await initGame(result, config)
			act(() => { result.current.makeMove(0, 0, true) })
			act(() => { result.current.resetGame() })
			expect(result.current.players).toHaveLength(3)
			expect(result.current.boardSize).toBe(5)
		})
	})

	// ─── makeMove - basic line drawing ─────────────────────────────────

	describe('makeMove - basic line drawing', () => {
		it('adds a horizontal line to lines', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.lines[lineKey(0, 0, true)]).toBe(0)
		})

		it('adds a vertical line to lines', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, false) })
			expect(result.current.lines[lineKey(0, 0, false)]).toBe(0)
		})

		it('returns true on successful move', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			let moveResult
			act(() => { moveResult = result.current.makeMove(0, 0, true) })
			expect(moveResult).toBe(true)
		})

		it('returns false when line already exists', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			let moveResult
			act(() => { moveResult = result.current.makeMove(0, 0, true) })
			expect(moveResult).toBe(false)
		})

		it('returns false when game is over', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Complete all boxes on a 2x2 board (boardSize 3) to end the game
			// Box (0,0): top, bottom, left, right
			// Box (0,1): top, bottom, left(=shared), right
			// Box (1,0): top(=shared), bottom, left, right(=shared)
			// Box (1,1): top(=shared), bottom, left(=shared), right
			const allMoves = [
				// Complete box (0,0) - player 0 draws 3, player 1 draws the rest
				[0, 0, true],  // top of (0,0) - p0
				[1, 0, true],  // bottom of (0,0) - p1 (turn rotated)
				[0, 0, false], // left of (0,0) - p0 (turn rotated)
				[0, 1, false], // right of (0,0) - p1 (turn rotated)
				// Now we need to fill the rest
				[0, 1, true],  // top of (0,1) - p0
				[1, 1, true],  // bottom of (0,1) - p1
				[0, 2, false], // right of (0,1) - p0
				// That completes (0,1) for p0, extra turn
				[2, 0, true],  // bottom of (1,0) - p0
				[1, 0, false], // left of (1,0) - p1
				// That might complete (1,0) for p1
				[2, 1, true],  // bottom of (1,1)
				[1, 2, false], // right of (1,1)
				[1, 1, false], // middle vertical
			]
			for (const [row, col, isH] of allMoves) {
				act(() => { result.current.makeMove(row, col, isH) })
			}
			expect(result.current.gameOver).toBe(true)
			let moveResult
			act(() => { moveResult = result.current.makeMove(0, 0, true) })
			expect(moveResult).toBe(false)
		})

		it('records line in correct key format', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(1, 0, true) })
			expect(result.current.lines).toHaveProperty('1,0,h')
			act(() => { result.current.makeMove(0, 1, false) })
			expect(result.current.lines).toHaveProperty('0,1,v')
		})
	})

	// ─── makeMove - turn rotation ──────────────────────────────────────

	describe('makeMove - turn rotation', () => {
		it('advances to next player when no box completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			expect(result.current.currentPlayerIndex).toBe(0)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.currentPlayerIndex).toBe(1)
		})

		it('stays on same player when box completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Draw 3 sides of box (0,0) as player 0 (but turns alternate)
			// We need to set up 3 sides without completing a box, then have a player complete it
			// Use a specific sequence: draw lines that don't complete any box first
			// Sides of box (0,0): top=(0,0,h), bottom=(1,0,h), left=(0,0,v), right=(0,1,v)
			// Player 0 draws top
			act(() => { result.current.makeMove(0, 0, true) })
			// Player 1 draws a line that doesn't affect box (0,0) completion directly
			// Let's draw bottom of (1,0) - row 2, col 0, horizontal
			act(() => { result.current.makeMove(2, 0, true) })
			// Player 0 draws bottom of (0,0)
			act(() => { result.current.makeMove(1, 0, true) })
			// Player 1 draws another unrelated line
			act(() => { result.current.makeMove(2, 1, true) })
			// Player 0 draws left of (0,0)
			act(() => { result.current.makeMove(0, 0, false) })
			// Player 1 draws the right of (0,0) - completing the box!
			expect(result.current.currentPlayerIndex).toBe(1)
			act(() => { result.current.makeMove(0, 1, false) })
			// Player 1 completed a box, should stay on player 1
			expect(result.current.currentPlayerIndex).toBe(1)
		})

		it('wraps from last player back to player 0', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Player 0 draws a non-completing line
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.currentPlayerIndex).toBe(1)
			// Player 1 draws a non-completing line
			act(() => { result.current.makeMove(2, 0, true) })
			expect(result.current.currentPlayerIndex).toBe(0)
		})

		it('rotates correctly with 3 players', async () => {
			const { result } = renderDotsHook()
			const config = makeGameConfig({ players: makePlayers(3), boardSize: 4 })
			await initGame(result, config)
			// Player 0
			expect(result.current.currentPlayerIndex).toBe(0)
			act(() => { result.current.makeMove(0, 0, true) })
			// Player 1
			expect(result.current.currentPlayerIndex).toBe(1)
			act(() => { result.current.makeMove(0, 1, true) })
			// Player 2
			expect(result.current.currentPlayerIndex).toBe(2)
			act(() => { result.current.makeMove(0, 2, true) })
			// Back to player 0
			expect(result.current.currentPlayerIndex).toBe(0)
		})

		it('rotates correctly with 4 players', async () => {
			const { result } = renderDotsHook()
			const config = makeGameConfig({ players: makePlayers(4), boardSize: 5 })
			await initGame(result, config)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.currentPlayerIndex).toBe(1)
			act(() => { result.current.makeMove(0, 1, true) })
			expect(result.current.currentPlayerIndex).toBe(2)
			act(() => { result.current.makeMove(0, 2, true) })
			expect(result.current.currentPlayerIndex).toBe(3)
			act(() => { result.current.makeMove(0, 3, true) })
			expect(result.current.currentPlayerIndex).toBe(0)
		})
	})

	// ─── makeMove - box completion ─────────────────────────────────────

	describe('makeMove - box completion', () => {
		it('completes a box when the 4th horizontal line is drawn', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Box (0,0) on boardSize 3:
			// top=(0,0,h), bottom=(1,0,h), left=(0,0,v), right=(0,1,v)
			// Draw 3 sides first, then the 4th horizontal line completes it
			// We need the same player to draw the completing line
			// Draw lines that alternate turns but set up for completion
			act(() => { result.current.makeMove(1, 0, true) })  // p0 - bottom of (0,0)
			act(() => { result.current.makeMove(2, 0, true) })  // p1 - unrelated
			act(() => { result.current.makeMove(0, 0, false) }) // p0 - left of (0,0)
			act(() => { result.current.makeMove(2, 1, true) })  // p1 - unrelated
			act(() => { result.current.makeMove(0, 1, false) }) // p0 - right of (0,0)
			act(() => { result.current.makeMove(0, 1, true) })  // p1 - unrelated
			// Now player 0 draws top of (0,0) - 4th horizontal line completes box
			act(() => { result.current.makeMove(0, 0, true) })  // p0 - top of (0,0) -> completes!
			expect(result.current.boxes['0,0']).toBe(0)
		})

		it('completes a box when the 4th vertical line is drawn', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Set up 3 sides of box (0,0), with the 4th being a vertical line
			act(() => { result.current.makeMove(0, 0, true) })  // p0 - top
			act(() => { result.current.makeMove(2, 0, true) })  // p1 - unrelated
			act(() => { result.current.makeMove(1, 0, true) })  // p0 - bottom
			act(() => { result.current.makeMove(2, 1, true) })  // p1 - unrelated
			act(() => { result.current.makeMove(0, 0, false) }) // p0 - left
			act(() => { result.current.makeMove(0, 1, true) })  // p1 - unrelated
			// Now p0 draws the right vertical line to complete
			act(() => { result.current.makeMove(0, 1, false) }) // p0 - right (vertical) -> completes!
			expect(result.current.boxes['0,0']).toBe(0)
		})

		it('assigns completed box to the current player', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Have player 1 complete a box
			act(() => { result.current.makeMove(0, 0, true) })  // p0 - top of (0,0)
			act(() => { result.current.makeMove(1, 0, true) })  // p1 - bottom of (0,0)
			// p1 goes to p0 (no box)
			act(() => { result.current.makeMove(0, 0, false) }) // p0 - left of (0,0)
			// p0 goes to p1
			// p1 completes the box by drawing right of (0,0)
			act(() => { result.current.makeMove(0, 1, false) }) // p1 - right of (0,0) -> completes!
			expect(result.current.boxes['0,0']).toBe(1)
		})

		it('completes two boxes with a single shared-edge line', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// boardSize 3: boxes (0,0) and (0,1) share vertical line at (0,1,v)
			// Set up both boxes with 3 sides each, missing the shared edge
			// Box (0,0): top=(0,0,h), bottom=(1,0,h), left=(0,0,v), right=(0,1,v)
			// Box (0,1): top=(0,1,h), bottom=(1,1,h), left=(0,1,v), right=(0,2,v)
			// Shared edge: (0,1,v)

			// Draw all non-shared lines first, alternating players
			act(() => { result.current.makeMove(0, 0, true) })  // p0 - top of (0,0)
			act(() => { result.current.makeMove(0, 1, true) })  // p1 - top of (0,1)
			act(() => { result.current.makeMove(1, 0, true) })  // p0 - bottom of (0,0)
			act(() => { result.current.makeMove(1, 1, true) })  // p1 - bottom of (0,1)
			act(() => { result.current.makeMove(0, 0, false) }) // p0 - left of (0,0)
			act(() => { result.current.makeMove(0, 2, false) }) // p1 - right of (0,1)
			// Now the shared edge (0,1,v) will complete BOTH boxes
			act(() => { result.current.makeMove(0, 1, false) }) // p0 - shared vertical -> completes both!
			expect(result.current.boxes['0,0']).toBe(0)
			expect(result.current.boxes['0,1']).toBe(0)
		})

		it('gives extra turn when box is completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Set up 3 sides of box (0,0) so player 0 can complete it
			act(() => { result.current.makeMove(0, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 0, true) })  // p1
			act(() => { result.current.makeMove(1, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 1, true) })  // p1
			act(() => { result.current.makeMove(0, 0, false) }) // p0
			act(() => { result.current.makeMove(0, 1, true) })  // p1
			// Player 0 completes box (0,0)
			expect(result.current.currentPlayerIndex).toBe(0)
			act(() => { result.current.makeMove(0, 1, false) }) // p0 completes (0,0)
			// Should stay on player 0 (extra turn)
			expect(result.current.currentPlayerIndex).toBe(0)
		})

		it('does not give extra turn when no box completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			expect(result.current.currentPlayerIndex).toBe(0)
			act(() => { result.current.makeMove(0, 0, true) }) // no box completed
			expect(result.current.currentPlayerIndex).toBe(1) // turn changed
		})
	})

	// ─── makeMove - lastMove tracking ──────────────────────────────────

	describe('makeMove - lastMove tracking', () => {
		it('records the line key in lastMove', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(1, 0, true) })
			expect(result.current.lastMove.line).toBe(lineKey(1, 0, true))
		})

		it('records empty boxesAdded when no box completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.lastMove.boxesAdded).toEqual([])
		})

		it('records boxesAdded with one key when one box completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Set up box (0,0) with 3 sides, then complete it
			act(() => { result.current.makeMove(0, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 0, true) })  // p1
			act(() => { result.current.makeMove(1, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 1, true) })  // p1
			act(() => { result.current.makeMove(0, 0, false) }) // p0
			act(() => { result.current.makeMove(0, 1, true) })  // p1
			// p0 completes box (0,0) with right side
			act(() => { result.current.makeMove(0, 1, false) })
			expect(result.current.lastMove.boxesAdded).toEqual(['0,0'])
		})

		it('records boxesAdded with two keys when two boxes completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Set up both boxes missing the shared edge (0,1,v)
			act(() => { result.current.makeMove(0, 0, true) })  // p0
			act(() => { result.current.makeMove(0, 1, true) })  // p1
			act(() => { result.current.makeMove(1, 0, true) })  // p0
			act(() => { result.current.makeMove(1, 1, true) })  // p1
			act(() => { result.current.makeMove(0, 0, false) }) // p0
			act(() => { result.current.makeMove(0, 2, false) }) // p1
			// p0 draws shared edge completing both
			act(() => { result.current.makeMove(0, 1, false) })
			expect(result.current.lastMove.boxesAdded).toHaveLength(2)
			expect(result.current.lastMove.boxesAdded).toContain('0,0')
			expect(result.current.lastMove.boxesAdded).toContain('0,1')
		})

		it('records previousPlayerIndex correctly', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Player 0 makes a move
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.lastMove.previousPlayerIndex).toBe(0)
			// Player 1 makes a move
			act(() => { result.current.makeMove(0, 1, true) })
			expect(result.current.lastMove.previousPlayerIndex).toBe(1)
		})

		it('sets turnChanged to true when no box completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.lastMove.turnChanged).toBe(true)
		})

		it('sets turnChanged to false when box completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Complete box (0,0)
			act(() => { result.current.makeMove(0, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 0, true) })  // p1
			act(() => { result.current.makeMove(1, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 1, true) })  // p1
			act(() => { result.current.makeMove(0, 0, false) }) // p0
			act(() => { result.current.makeMove(0, 1, true) })  // p1
			act(() => { result.current.makeMove(0, 1, false) }) // p0 completes (0,0)
			expect(result.current.lastMove.turnChanged).toBe(false)
		})
	})

	// ─── makeMove - game over detection ────────────────────────────────

	describe('makeMove - game over detection', () => {
		// Helper: fill all 12 lines on a boardSize=3 board in a controlled way
		// Returns the final result so we can inspect the hook state.
		function fillBoard(result) {
			// boardSize 3 = 2x2 = 4 boxes, 12 total lines
			// We'll draw lines strategically so player 0 gets 3 boxes and player 1 gets 1
			// Box (0,0): top=(0,0,h), bottom=(1,0,h), left=(0,0,v), right=(0,1,v)
			// Box (0,1): top=(0,1,h), bottom=(1,1,h), left=(0,1,v), right=(0,2,v)
			// Box (1,0): top=(1,0,h), bottom=(2,0,h), left=(1,0,v), right=(1,1,v)
			// Box (1,1): top=(1,1,h), bottom=(2,1,h), left=(1,1,v), right=(1,2,v)

			// Draw non-completing lines to set up, then complete boxes
			// Top row horizontals
			act(() => { result.current.makeMove(0, 0, true) })  // p0
			act(() => { result.current.makeMove(0, 1, true) })  // p1
			// Bottom row horizontals
			act(() => { result.current.makeMove(2, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 1, true) })  // p1
			// Left column verticals
			act(() => { result.current.makeMove(0, 0, false) }) // p0
			act(() => { result.current.makeMove(1, 0, false) }) // p1
			// Right column verticals
			act(() => { result.current.makeMove(0, 2, false) }) // p0
			act(() => { result.current.makeMove(1, 2, false) }) // p1
			// Middle horizontal - shared between top and bottom rows
			act(() => { result.current.makeMove(1, 0, true) })  // p0
			act(() => { result.current.makeMove(1, 1, true) })  // p1
			// Middle vertical (0,1) - shared between (0,0) and (0,1) - completes top 2 boxes
			act(() => { result.current.makeMove(0, 1, false) }) // p0 -> completes (0,0) and (0,1)!
			// p0 gets extra turn, now draw shared middle vertical (1,1) - completes bottom 2 boxes
			act(() => { result.current.makeMove(1, 1, false) }) // p0 -> completes (1,0) and (1,1)!
		}

		it('sets gameOver true when all boxes completed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			fillBoard(result)
			expect(result.current.gameOver).toBe(true)
		})

		it('sets winner to the player with the most boxes', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			fillBoard(result)
			// Player 0 completed all 4 boxes (both double-completions)
			expect(result.current.winner).not.toBeNull()
			expect(result.current.winner.name).toBe('Player 1') // player index 0
		})

		it('sets winner to null when scores are tied', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Create a 2-2 tie on boardSize 3 (2x2 = 4 boxes).
			// Strategy: draw all 6 horizontals first (no completions), then verticals
			// in an order that gives p1 the top two boxes and p0 the bottom two.
			//
			// Move sequence (boardSize 3):
			//   m1:  p0 draws (0,0,h) -> no box, turn to p1
			//   m2:  p1 draws (0,1,h) -> no box, turn to p0
			//   m3:  p0 draws (1,0,h) -> no box, turn to p1
			//   m4:  p1 draws (1,1,h) -> no box, turn to p0
			//   m5:  p0 draws (2,0,h) -> no box, turn to p1
			//   m6:  p1 draws (2,1,h) -> no box, turn to p0
			//   m7:  p0 draws (0,0,v) -> box(0,0) 3 sides, no completion, turn to p1
			//   m8:  p1 draws (0,1,v) -> completes (0,0)! p1=1, extra turn
			//   m9:  p1 draws (0,2,v) -> completes (0,1)! p1=2, extra turn
			//   m10: p1 draws (1,0,v) -> box(1,0) 3 sides, no completion, turn to p0
			//   m11: p0 draws (1,1,v) -> completes (1,0)! p0=1, extra turn
			//   m12: p0 draws (1,2,v) -> completes (1,1)! p0=2, game over: 2-2 tie

			act(() => { result.current.makeMove(0, 0, true) })  // m1:  p0
			act(() => { result.current.makeMove(0, 1, true) })  // m2:  p1
			act(() => { result.current.makeMove(1, 0, true) })  // m3:  p0
			act(() => { result.current.makeMove(1, 1, true) })  // m4:  p1
			act(() => { result.current.makeMove(2, 0, true) })  // m5:  p0
			act(() => { result.current.makeMove(2, 1, true) })  // m6:  p1
			act(() => { result.current.makeMove(0, 0, false) }) // m7:  p0 (no completion)
			act(() => { result.current.makeMove(0, 1, false) }) // m8:  p1 completes (0,0)
			expect(result.current.boxes['0,0']).toBe(1)
			act(() => { result.current.makeMove(0, 2, false) }) // m9:  p1 completes (0,1)
			expect(result.current.boxes['0,1']).toBe(1)
			act(() => { result.current.makeMove(1, 0, false) }) // m10: p1 (no completion)
			act(() => { result.current.makeMove(1, 1, false) }) // m11: p0 completes (1,0)
			expect(result.current.boxes['1,0']).toBe(0)
			act(() => { result.current.makeMove(1, 2, false) }) // m12: p0 completes (1,1)
			expect(result.current.boxes['1,1']).toBe(0)

			expect(result.current.gameOver).toBe(true)
			expect(result.current.players[0].score).toBe(2)
			expect(result.current.players[1].score).toBe(2)
			expect(result.current.winner).toBeNull()
		})

		it('calculates final scores correctly for 2 players', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			fillBoard(result)
			expect(result.current.gameOver).toBe(true)
			// Each player should have a score property
			const totalBoxes = result.current.players.reduce((sum, p) => sum + p.score, 0)
			expect(totalBoxes).toBe(4) // 2x2 board = 4 boxes total
		})

		it('updates players with score property on game end', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			fillBoard(result)
			expect(result.current.gameOver).toBe(true)
			result.current.players.forEach(player => {
				expect(player).toHaveProperty('score')
				expect(typeof player.score).toBe('number')
			})
		})

		it('detects game end on a 2x2 board (boardSize 3)', async () => {
			const { result } = renderDotsHook()
			await initGame(result, makeGameConfig({ boardSize: 3 }))
			fillBoard(result)
			expect(result.current.gameOver).toBe(true)
			const totalScore = result.current.players.reduce((sum, p) => sum + p.score, 0)
			expect(totalScore).toBe(4) // (3-1)*(3-1) = 4 boxes
		})

		it('detects game end on a 3x3 board (boardSize 4)', async () => {
			const { result } = renderDotsHook()
			await initGame(result, makeGameConfig({ boardSize: 4 }))
			// boardSize 4 = 3x3 = 9 boxes, 24 total lines
			// Horizontal: rows 0-3, cols 0-2 = 12 h-lines
			// Vertical: rows 0-2, cols 0-3 = 12 v-lines

			// Fill all horizontal lines first (these don't complete any boxes by themselves)
			for (let row = 0; row <= 3; row++) {
				for (let col = 0; col <= 2; col++) {
					act(() => { result.current.makeMove(row, col, true) })
				}
			}
			// Now fill all vertical lines
			for (let row = 0; row <= 2; row++) {
				for (let col = 0; col <= 3; col++) {
					act(() => { result.current.makeMove(row, col, false) })
				}
			}
			expect(result.current.gameOver).toBe(true)
			const totalScore = result.current.players.reduce((sum, p) => sum + p.score, 0)
			expect(totalScore).toBe(9) // (4-1)*(4-1) = 9 boxes
		})
	})

	// ─── undoLastMove ──────────────────────────────────────────────────

	describe('undoLastMove', () => {
		it('removes the last drawn line', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.lines[lineKey(0, 0, true)]).toBe(0)
			act(() => { result.current.undoLastMove() })
			expect(result.current.lines[lineKey(0, 0, true)]).toBeUndefined()
		})

		it('removes boxes completed by the last move', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Set up 3 sides of box (0,0), then complete it, then undo
			act(() => { result.current.makeMove(0, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 0, true) })  // p1
			act(() => { result.current.makeMove(1, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 1, true) })  // p1
			act(() => { result.current.makeMove(0, 0, false) }) // p0
			act(() => { result.current.makeMove(0, 1, true) })  // p1
			act(() => { result.current.makeMove(0, 1, false) }) // p0 completes (0,0)
			expect(result.current.boxes['0,0']).toBe(0)
			act(() => { result.current.undoLastMove() })
			expect(result.current.boxes['0,0']).toBeUndefined()
		})

		it('restores the previous player when turn had changed', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			expect(result.current.currentPlayerIndex).toBe(0)
			act(() => { result.current.makeMove(0, 0, true) }) // p0, no box, turn changes to p1
			expect(result.current.currentPlayerIndex).toBe(1)
			act(() => { result.current.undoLastMove() })
			expect(result.current.currentPlayerIndex).toBe(0)
		})

		it('does not change player when turn had not changed (box was completed)', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Complete box (0,0) by player 0 so turn doesn't change
			act(() => { result.current.makeMove(0, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 0, true) })  // p1
			act(() => { result.current.makeMove(1, 0, true) })  // p0
			act(() => { result.current.makeMove(2, 1, true) })  // p1
			act(() => { result.current.makeMove(0, 0, false) }) // p0
			act(() => { result.current.makeMove(0, 1, true) })  // p1
			// p0 completes (0,0) - turn does NOT change
			act(() => { result.current.makeMove(0, 1, false) })
			expect(result.current.currentPlayerIndex).toBe(0)
			act(() => { result.current.undoLastMove() })
			// Player should still be 0 (turn hadn't changed)
			expect(result.current.currentPlayerIndex).toBe(0)
		})

		it('sets lastMove to null after undo', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.lastMove).not.toBeNull()
			act(() => { result.current.undoLastMove() })
			expect(result.current.lastMove).toBeNull()
		})

		it('returns true on successful undo', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			act(() => { result.current.makeMove(0, 0, true) })
			let undoResult
			act(() => { undoResult = result.current.undoLastMove() })
			expect(undoResult).toBe(true)
		})

		it('returns false when there is no last move', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			let undoResult
			act(() => { undoResult = result.current.undoLastMove() })
			expect(undoResult).toBe(false)
		})

		it('returns false when game is over', async () => {
			const { result } = renderDotsHook()
			await initGame(result)
			// Fill the board to end the game
			act(() => { result.current.makeMove(0, 0, true) })
			act(() => { result.current.makeMove(0, 1, true) })
			act(() => { result.current.makeMove(2, 0, true) })
			act(() => { result.current.makeMove(2, 1, true) })
			act(() => { result.current.makeMove(0, 0, false) })
			act(() => { result.current.makeMove(1, 0, false) })
			act(() => { result.current.makeMove(0, 2, false) })
			act(() => { result.current.makeMove(1, 2, false) })
			act(() => { result.current.makeMove(1, 0, true) })
			act(() => { result.current.makeMove(1, 1, true) })
			act(() => { result.current.makeMove(0, 1, false) })
			act(() => { result.current.makeMove(1, 1, false) })
			expect(result.current.gameOver).toBe(true)
			let undoResult
			act(() => { undoResult = result.current.undoLastMove() })
			expect(undoResult).toBe(false)
		})

		it('returns false when current player is computer', async () => {
			const { result } = renderDotsHook()
			const players = [
				makePlayer({ name: 'Human' }),
				makeComputerPlayer({ name: 'CPU' }),
			]
			await initGame(result, makeGameConfig({ players }))
			// Human (p0) makes a move, turn goes to CPU (p1)
			act(() => { result.current.makeMove(0, 0, true) })
			expect(result.current.currentPlayerIndex).toBe(1)
			expect(result.current.players[1].isComputer).toBe(true)
			let undoResult
			act(() => { undoResult = result.current.undoLastMove() })
			expect(undoResult).toBe(false)
		})

		it('returns false when previous player was computer', async () => {
			const { result } = renderDotsHook()
			const players = [
				makeComputerPlayer({ name: 'CPU' }),
				makePlayer({ name: 'Human' }),
			]
			await initGame(result, makeGameConfig({ players }))
			// CPU is p0. We need to simulate CPU having made a move and it being human's turn.
			// Since AI auto-play is mocked, we manually make a move as p0 (CPU)
			findBestMove.mockReturnValue(null) // prevent AI auto-play
			act(() => { result.current.makeMove(0, 0, true) }) // p0 (CPU) move
			expect(result.current.currentPlayerIndex).toBe(1)
			// Now it's the human's turn, but the lastMove was made by CPU (p0)
			expect(result.current.lastMove.previousPlayerIndex).toBe(0)
			let undoResult
			act(() => { undoResult = result.current.undoLastMove() })
			expect(undoResult).toBe(false)
		})
	})

	// ─── AI auto-play ──────────────────────────────────────────────────

	describe('AI auto-play', () => {
		beforeEach(() => {
			vi.useFakeTimers()
			findBestMove.mockReset()
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it('triggers AI move after 500ms when current player is computer', async () => {
			const { result } = renderDotsHook()
			findBestMove.mockReturnValue({ row: 0, col: 0, isHorizontal: true })
			const players = [
				makeComputerPlayer({ name: 'CPU 1' }),
				makePlayer({ name: 'Human' }),
			]
			await initGame(result, makeGameConfig({ players }))
			// CPU is player 0, should trigger after 500ms
			expect(result.current.currentPlayerIndex).toBe(0)
			await act(async () => { vi.advanceTimersByTime(500) })
			expect(findBestMove).toHaveBeenCalled()
			// The CPU should have made a move and the line should exist
			expect(result.current.lines[lineKey(0, 0, true)]).toBeDefined()
		})

		it('does not trigger AI move when current player is human', async () => {
			const { result } = renderDotsHook()
			findBestMove.mockReturnValue({ row: 0, col: 0, isHorizontal: true })
			const players = [
				makePlayer({ name: 'Human' }),
				makeComputerPlayer({ name: 'CPU' }),
			]
			await initGame(result, makeGameConfig({ players }))
			// Human is player 0
			await act(async () => { vi.advanceTimersByTime(1000) })
			expect(findBestMove).not.toHaveBeenCalled()
		})

		it('does not trigger AI move when game is over', async () => {
			const { result } = renderDotsHook()
			findBestMove.mockReturnValue({ row: 0, col: 0, isHorizontal: true })
			const players = [
				makeComputerPlayer({ name: 'CPU' }),
				makePlayer({ name: 'Human' }),
			]
			await initGame(result, makeGameConfig({ players }))
			// Fill board to end game first - use real timer flow
			// Actually we need to prevent AI from playing while we fill the board
			findBestMove.mockReturnValue(null)
			await act(async () => { vi.advanceTimersByTime(500) })

			// Fill the board manually
			const allMoves = [
				[0, 0, true], [0, 1, true], [2, 0, true], [2, 1, true],
				[0, 0, false], [1, 0, false], [0, 2, false], [1, 2, false],
				[1, 0, true], [1, 1, true], [0, 1, false], [1, 1, false],
			]
			for (const [row, col, isH] of allMoves) {
				act(() => { result.current.makeMove(row, col, isH) })
			}
			expect(result.current.gameOver).toBe(true)
			findBestMove.mockClear()
			findBestMove.mockReturnValue({ row: 0, col: 0, isHorizontal: true })
			await act(async () => { vi.advanceTimersByTime(1000) })
			expect(findBestMove).not.toHaveBeenCalled()
		})

		it('does not trigger AI move when players array is empty', async () => {
			const { result } = renderDotsHook()
			findBestMove.mockReturnValue({ row: 0, col: 0, isHorizontal: true })
			// Don't initialize game - players array is empty
			await act(async () => { vi.advanceTimersByTime(1000) })
			expect(findBestMove).not.toHaveBeenCalled()
		})

		it('clears timeout on cleanup/unmount', async () => {
			const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
			const { result, unmount } = renderDotsHook()
			findBestMove.mockReturnValue({ row: 0, col: 0, isHorizontal: true })
			const players = [
				makeComputerPlayer({ name: 'CPU' }),
				makePlayer({ name: 'Human' }),
			]
			await initGame(result, makeGameConfig({ players }))
			// The AI effect should have set a timeout
			unmount()
			expect(clearTimeoutSpy).toHaveBeenCalled()
			clearTimeoutSpy.mockRestore()
		})

		it('calls makeMove with the result of findBestMove', async () => {
			const { result } = renderDotsHook()
			findBestMove.mockReturnValue({ row: 1, col: 0, isHorizontal: false })
			const players = [
				makeComputerPlayer({ name: 'CPU' }),
				makePlayer({ name: 'Human' }),
			]
			await initGame(result, makeGameConfig({ players }))
			await act(async () => { vi.advanceTimersByTime(500) })
			// The AI should have drawn the line at (1, 0, vertical)
			expect(result.current.lines[lineKey(1, 0, false)]).toBeDefined()
		})

		it('handles findBestMove returning null gracefully', async () => {
			const { result } = renderDotsHook()
			findBestMove.mockReturnValue(null)
			const players = [
				makeComputerPlayer({ name: 'CPU' }),
				makePlayer({ name: 'Human' }),
			]
			await initGame(result, makeGameConfig({ players }))
			// Should not throw when findBestMove returns null
			await act(async () => { vi.advanceTimersByTime(500) })
			expect(findBestMove).toHaveBeenCalled()
			// No lines should have been drawn
			expect(Object.keys(result.current.lines)).toHaveLength(0)
		})
	})
})
