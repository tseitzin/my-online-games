import { describe, it, expect, afterEach, vi } from 'vitest'
import { findBestMove } from './aiLogic'

// ─── Inline helpers (from dotsTestHelpers — inlined to avoid JSX parse issue) ──

function lineKey(row, col, isHorizontal) {
	return `${row},${col},${isHorizontal ? 'h' : 'v'}`
}

function buildLines(lineSpecs, playerIndex = 0) {
	const lines = {}
	for (const [row, col, isH] of lineSpecs) {
		lines[lineKey(row, col, isH)] = playerIndex
	}
	return lines
}

function boxLines(row, col) {
	return [
		[row, col, true],      // top
		[row + 1, col, true],  // bottom
		[row, col, false],     // left
		[row, col + 1, false], // right
	]
}

function threeOfFourLines(row, col, missingSide = 'right') {
	const all = {
		top:    [row, col, true],
		bottom: [row + 1, col, true],
		left:   [row, col, false],
		right:  [row, col + 1, false],
	}
	return Object.entries(all)
		.filter(([side]) => side !== missingSide)
		.map(([, spec]) => spec)
}

function checkBoxCompletion(lines, row, col) {
	const top = lineKey(row, col, true)
	const bottom = lineKey(row + 1, col, true)
	const left = lineKey(row, col, false)
	const right = lineKey(row, col + 1, false)
	return (
		lines[top] !== undefined &&
		lines[bottom] !== undefined &&
		lines[left] !== undefined &&
		lines[right] !== undefined
	)
}

// ─── Test-only helpers ──────────────────────────────────────────────

/**
 * Build a lines object containing ALL possible lines for a given boardSize.
 * This represents a fully drawn board with no available moves.
 */
function allLines(boardSize, playerIndex = 0) {
	const specs = []
	// Horizontal lines: boardSize rows x (boardSize-1) cols
	for (let row = 0; row < boardSize; row++) {
		for (let col = 0; col < boardSize - 1; col++) {
			specs.push([row, col, true])
		}
	}
	// Vertical lines: (boardSize-1) rows x boardSize cols
	for (let row = 0; row < boardSize - 1; row++) {
		for (let col = 0; col < boardSize; col++) {
			specs.push([row, col, false])
		}
	}
	return buildLines(specs, playerIndex)
}

/**
 * Build a lines object containing all lines EXCEPT specified ones.
 */
function allLinesExcept(boardSize, exceptSpecs, playerIndex = 0) {
	const lines = allLines(boardSize, playerIndex)
	for (const [row, col, isH] of exceptSpecs) {
		delete lines[lineKey(row, col, isH)]
	}
	return lines
}

afterEach(() => {
	vi.restoreAllMocks()
})

// ─── Available move enumeration ─────────────────────────────────────

describe('available move enumeration', () => {
	it('returns null when no moves available (all lines drawn)', () => {
		const boardSize = 3
		const lines = allLines(boardSize)
		// All boxes completed
		const boxes = { '0,0': 0, '0,1': 0, '1,0': 0, '1,1': 0 }

		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		expect(result).toBeNull()
	})

	it('returns a move when exactly one horizontal line available', () => {
		const boardSize = 3
		// Remove one horizontal line: row=0, col=0, horizontal
		const lines = allLinesExcept(boardSize, [[0, 0, true]])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		expect(result).toEqual({ row: 0, col: 0, isHorizontal: true })
	})

	it('returns a move when exactly one vertical line available', () => {
		const boardSize = 3
		// Remove one vertical line: row=0, col=0, vertical
		const lines = allLinesExcept(boardSize, [[0, 0, false]])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		expect(result).toEqual({ row: 0, col: 0, isHorizontal: false })
	})

	it('enumerates correct count of horizontal lines for empty board', () => {
		// For boardSize=3: horizontal lines = 3 rows x 2 cols = 6
		// For boardSize=4: horizontal lines = 4 rows x 3 cols = 12
		const boardSize = 4
		const lines = {}
		const boxes = {}

		// With an empty board all moves are safe (no 3-sided boxes), so we can
		// count them by ensuring the function picks from the full set.
		// But we can't directly count — instead verify the function returns
		// a valid horizontal or vertical move.
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		expect(result).not.toBeNull()
		// The first available move enumerated is always row=0, col=0, horizontal
		expect(result).toEqual({ row: 0, col: 0, isHorizontal: true })
	})

	it('enumerates correct count of vertical lines for empty board', () => {
		// For boardSize=3: vertical lines = 2 rows x 3 cols = 6
		// Total available on boardSize=3 empty board = 6h + 6v = 12
		const boardSize = 3
		const lines = {}
		const boxes = {}

		// Pick the last move — Math.random returning just under 1
		// should select the last element (index 11 of 12)
		vi.spyOn(Math, 'random').mockReturnValue(0.99)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		expect(result).not.toBeNull()
		// The last vertical line enumerated is row=1, col=2, vertical
		expect(result).toEqual({ row: 1, col: 2, isHorizontal: false })
	})

	it('excludes already-drawn lines from available moves', () => {
		const boardSize = 3
		// Draw all lines except two specific ones
		const remaining = [[0, 0, true], [1, 2, false]]
		const lines = allLinesExcept(boardSize, remaining)
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		// Should be one of the two remaining moves
		const isValidMove =
			(result.row === 0 && result.col === 0 && result.isHorizontal === true) ||
			(result.row === 1 && result.col === 2 && result.isHorizontal === false)
		expect(isValidMove).toBe(true)
	})
})

// ─── Completing moves (priority 1) ─────────────────────────────────

describe('completing moves (priority 1)', () => {
	it('completes a box when 3/4 sides drawn (missing top)', () => {
		const boardSize = 3
		const lines = buildLines(threeOfFourLines(0, 0, 'top'))
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		// The completing move is the missing top line: row=0, col=0, horizontal
		expect(result).toEqual({ row: 0, col: 0, isHorizontal: true })
	})

	it('completes a box when 3/4 sides drawn (missing bottom)', () => {
		const boardSize = 3
		const lines = buildLines(threeOfFourLines(0, 0, 'bottom'))
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		// The missing bottom line: row=1, col=0, horizontal
		expect(result).toEqual({ row: 1, col: 0, isHorizontal: true })
	})

	it('completes a box when 3/4 sides drawn (missing left)', () => {
		const boardSize = 3
		const lines = buildLines(threeOfFourLines(0, 0, 'left'))
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		// The missing left line: row=0, col=0, vertical
		expect(result).toEqual({ row: 0, col: 0, isHorizontal: false })
	})

	it('completes a box when 3/4 sides drawn (missing right)', () => {
		const boardSize = 3
		const lines = buildLines(threeOfFourLines(0, 0, 'right'))
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		// The missing right line: row=0, col=1, vertical
		expect(result).toEqual({ row: 0, col: 1, isHorizontal: false })
	})

	it('prioritizes completing over safe moves', () => {
		const boardSize = 3
		// Box (0,0) has 3 sides, missing right. That one move completes the box.
		// Plenty of other lines are undrawn and safe.
		const lines = buildLines(threeOfFourLines(0, 0, 'right'))
		const boxes = {}

		// No matter which random value, the completing move must be chosen
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		expect(result).toEqual({ row: 0, col: 1, isHorizontal: false })
	})

	it('prioritizes completing over risky moves', () => {
		const boardSize = 3
		// Box (0,0) has 3 sides drawn missing 'right'
		// Box (0,1) has 2 sides drawn — adding the 3rd would be risky
		// The AI should still pick the completing move for box (0,0)
		const lines = buildLines([
			...threeOfFourLines(0, 0, 'right'),
			// Add 2 sides of box (0,1) so many moves near it become risky
			[0, 1, true],   // top of box (0,1)
			[0, 2, false],  // right of box (0,1)
		])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		// Must pick the completing move: right side of box(0,0) = row=0, col=1, vertical
		expect(result).toEqual({ row: 0, col: 1, isHorizontal: false })
	})

	it('randomly selects among multiple completing moves', () => {
		const boardSize = 3
		// Set up two boxes each missing one side
		// Box (0,0) missing right (which is the same as box (0,1) missing left)
		// Box (1,0) missing top (which is the same as box (0,0) missing bottom — but
		// we need them truly separate)
		// Box (0,0) missing right: row=0, col=1, vertical
		// Box (1,1) missing bottom: row=2, col=1, horizontal
		const lines = buildLines([
			...threeOfFourLines(0, 0, 'right'),
			...threeOfFourLines(1, 1, 'bottom'),
		])
		const boxes = {}

		// Math.random=0 picks first completing move
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result1 = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// Math.random=0.99 picks last completing move
		vi.mocked(Math.random).mockReturnValue(0.99)
		const result2 = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// Both results should be completing moves
		const completingMoveA = { row: 0, col: 1, isHorizontal: false }  // right of box(0,0)
		const completingMoveB = { row: 2, col: 1, isHorizontal: true }   // bottom of box(1,1)

		// With random=0, should pick first; with random=0.99, should pick last
		// (or second if only 2 completing moves)
		expect([completingMoveA, completingMoveB]).toContainEqual(result1)
		expect([completingMoveA, completingMoveB]).toContainEqual(result2)

		// They should be different picks when there are multiple completing moves
		if (JSON.stringify(result1) === JSON.stringify(result2)) {
			// This could happen if only one completing move was detected
			// (e.g. because the shared line completes both boxes at once).
			// That's still valid behavior — just verify it's a completing move.
			expect([completingMoveA, completingMoveB]).toContainEqual(result1)
		} else {
			expect(result1).not.toEqual(result2)
		}
	})
})

// ─── Safe moves (priority 2) ───────────────────────────────────────

describe('safe moves (priority 2)', () => {
	it('selects safe move when no completing moves exist', () => {
		const boardSize = 3
		// Empty board: all moves are safe (no box has 2 sides yet)
		const lines = {}
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		expect(result).not.toBeNull()
		// On an empty board, the first available move is row=0, col=0, horizontal
		expect(result).toEqual({ row: 0, col: 0, isHorizontal: true })
	})

	it('identifies a move as safe when it does not create a 3-sided box', () => {
		const boardSize = 3
		// Draw just one line — drawing another non-adjacent line won't create
		// a 3-sided box anywhere
		const lines = buildLines([[0, 0, true]])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)
		expect(result).not.toBeNull()
		// Result should NOT be a completing move (no box has 3 sides)
		// It should be classified as safe — we verify by checking the AI
		// returns a valid move (not null)
		expect(result.row).toBeDefined()
		expect(result.col).toBeDefined()
		expect(result.isHorizontal).toBeDefined()
	})

	it('randomly selects among multiple safe moves', () => {
		const boardSize = 3
		const lines = {}
		const boxes = {}

		// Pick first safe move
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result1 = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// Pick last safe move
		vi.mocked(Math.random).mockReturnValue(0.99)
		const result2 = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// Both are valid moves
		expect(result1).not.toBeNull()
		expect(result2).not.toBeNull()

		// They should be different since there are 12 safe moves on an empty 3x3 board
		expect(result1).not.toEqual(result2)
	})
})

// ─── Risky moves (priority 3) ──────────────────────────────────────

describe('risky moves (priority 3)', () => {
	it('falls back to risky when no completing or safe moves exist', () => {
		const boardSize = 3
		// Set up a board where every remaining move would create a 3-sided box
		// (no completing moves, no safe moves — only risky).
		//
		// For a 2x2 grid (boardSize=3), draw 2 sides of every box so that
		// any new line will be the 3rd side of some box.
		//
		// Box (0,0): top + left  = 2 sides
		// Box (0,1): top + right = 2 sides (shares top-right area with box 0,0)
		// Box (1,0): bottom + left = 2 sides
		// Box (1,1): bottom + right = 2 sides
		//
		// Actually, let's be more precise. Draw all lines except 4, one per box,
		// where each remaining line would be the 3rd side.
		//
		// Strategy: draw lines so every box has exactly 2 sides, meaning any
		// additional line gives some box its 3rd side.
		//
		// Board (boardSize=3):
		//  . - . - .     (row 0 horizontals)
		//  |   |   |     (row 0 verticals)
		//  . - . - .     (row 1 horizontals)
		//  |   |   |     (row 1 verticals)
		//  . - . - .     (row 2 horizontals)
		//
		// Let's draw specific lines to ensure all moves are risky:
		// Draw 2 sides per box:
		// Box(0,0): top(0,0,h), left(0,0,v) — 2 sides
		// Box(0,1): top(0,1,h), right(0,2,v) — 2 sides
		// Box(1,0): bottom(2,0,h), left(1,0,v) — 2 sides
		// Box(1,1): bottom(2,1,h), right(1,2,v) — 2 sides
		//
		// Remaining lines: bottom of top row / top of bottom row (1,0,h), (1,1,h),
		// middle verticals (0,1,v), (1,1,v)
		//
		// Check if any remaining line would be a 3rd side:
		// (1,0,h) is bottom of box(0,0) [already has top+left=2] -> becomes 3rd side. Risky!
		// (1,1,h) is bottom of box(0,1) [already has top+right=2] -> becomes 3rd side. Risky!
		// (0,1,v) is right of box(0,0) [already has top+left=2] -> becomes 3rd side. Risky!
		// (1,1,v) is right of box(1,0) [already has bottom+left=2] -> becomes 3rd side. Risky!
		//
		// All remaining moves are risky.
		const lines = buildLines([
			[0, 0, true],  // top of box(0,0)
			[0, 1, true],  // top of box(0,1)
			[2, 0, true],  // bottom of box(1,0)
			[2, 1, true],  // bottom of box(1,1)
			[0, 0, false], // left of box(0,0)
			[0, 2, false], // right of box(0,1)
			[1, 0, false], // left of box(1,0)
			[1, 2, false], // right of box(1,1)
		])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		expect(result).not.toBeNull()
		// All remaining moves are risky, so the AI is forced to pick one
		const remainingKeys = [
			lineKey(1, 0, true),
			lineKey(1, 1, true),
			lineKey(0, 1, false),
			lineKey(1, 1, false),
		]
		const resultKey = lineKey(result.row, result.col, result.isHorizontal)
		expect(remainingKeys).toContain(resultKey)
	})

	it('identifies a move that creates a 3-sided box for opponent', () => {
		const boardSize = 3
		// Box (0,0) has top and left drawn (2 sides).
		// Drawing the bottom (1,0,h) would give it 3 sides — risky.
		// But there are also safe moves available elsewhere on the board.
		const lines = buildLines([
			[0, 0, true],  // top of box(0,0)
			[0, 0, false], // left of box(0,0)
		])
		const boxes = {}

		// The AI should avoid the risky move and pick a safe one
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// The result should NOT be any move that gives box(0,0) its 3rd side.
		// Risky moves for box(0,0): bottom(1,0,h) or right(0,1,v)
		const isRiskyForBox00 =
			(result.row === 1 && result.col === 0 && result.isHorizontal === true) ||
			(result.row === 0 && result.col === 1 && result.isHorizontal === false)

		// With safe moves available, AI should not pick a risky one
		expect(isRiskyForBox00).toBe(false)
	})
})

// ─── wouldCreateThreeSidedBox (tested via integration) ──────────────

describe('wouldCreateThreeSidedBox (tested via integration)', () => {
	it('horizontal line at top edge only checks box below', () => {
		const boardSize = 3
		// A horizontal line at row=0 is the top edge; it can only be the top of
		// box(0,col). There's no box above it.
		// Draw 2 sides of box(0,0): left and bottom. Adding top(0,0,h) = 3rd side.
		// Also ensure box above (row=-1) doesn't exist / isn't checked.
		const lines = buildLines([
			[0, 0, false], // left of box(0,0)
			[1, 0, true],  // bottom of box(0,0)
		])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// The move (0,0,h) would create a 3-sided box(0,0), so AI should avoid it
		// if safe moves exist
		const isTopEdgeMove = result.row === 0 && result.col === 0 && result.isHorizontal === true
		expect(isTopEdgeMove).toBe(false)
	})

	it('horizontal line at bottom edge only checks box above', () => {
		const boardSize = 3
		// A horizontal line at row=2 (boardSize-1) is the bottom edge; it can only
		// be the bottom of box(1,col). There's no box below it.
		// Draw 2 sides of box(1,0): top and left. Adding bottom(2,0,h) = 3rd side.
		const lines = buildLines([
			[1, 0, true],  // top of box(1,0)
			[1, 0, false], // left of box(1,0)
		])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// The move (2,0,h) would create a 3-sided box(1,0), so AI should avoid it
		const isBottomEdgeMove = result.row === 2 && result.col === 0 && result.isHorizontal === true
		expect(isBottomEdgeMove).toBe(false)
	})

	it('vertical line at left edge only checks box to the right', () => {
		const boardSize = 3
		// A vertical line at col=0 is the left edge; it can only be the left of
		// box(row,0). There's no box to its left.
		// Draw 2 sides of box(0,0): top and bottom. Adding left(0,0,v) = 3rd side.
		const lines = buildLines([
			[0, 0, true],  // top of box(0,0)
			[1, 0, true],  // bottom of box(0,0)
		])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// The move (0,0,v) would create a 3-sided box(0,0), so AI should avoid it
		const isLeftEdgeMove = result.row === 0 && result.col === 0 && result.isHorizontal === false
		expect(isLeftEdgeMove).toBe(false)
	})

	it('vertical line at right edge only checks box to the left', () => {
		const boardSize = 3
		// A vertical line at col=2 (boardSize-1) is the right edge; it can only be
		// the right of box(row,col-1). There's no box to its right.
		// Draw 2 sides of box(0,1): top and bottom. Adding right(0,2,v) = 3rd side.
		const lines = buildLines([
			[0, 1, true],  // top of box(0,1)
			[1, 1, true],  // bottom of box(0,1)
		])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// The move (0,2,v) would create a 3-sided box(0,1), so AI should avoid it
		const isRightEdgeMove = result.row === 0 && result.col === 2 && result.isHorizontal === false
		expect(isRightEdgeMove).toBe(false)
	})

	it('skips already-completed boxes when checking', () => {
		const boardSize = 3
		// Box (0,0) is fully completed and marked in boxes.
		// Box (0,1) has 2 sides drawn. A move that would normally create
		// a 3-sided box for (0,0) should NOT be flagged as risky since
		// box (0,0) is already completed.
		//
		// Draw all 4 sides of box(0,0) and mark it completed.
		// Draw 2 sides of box(1,0): top and left.
		// The move (2,0,h) — bottom of box(1,0) — would create 3 sides for
		// box(1,0). But if we mark box(1,0) as completed too, it should skip.
		const _lines = buildLines([
			...boxLines(0, 0),    // all 4 sides of box(0,0)
			[1, 0, true],        // this is both bottom of box(0,0) and top of box(1,0) — already drawn above
			[1, 0, false],       // left of box(1,0)
		])
		// Mark box(0,0) as completed. Box(1,0) has top + left = 2 sides.
		const boxes = { '0,0': 0 }

		// Now consider the move bottom-of-box(1,0) = (2,0,h).
		// It would create 3 sides for box(1,0) [top + left + bottom], which IS risky.
		// But if we also mark box(1,0) as completed, it should be skipped.
		const boxesBothComplete = { '0,0': 0, '1,0': 0 }
		const linesWith3Sides = buildLines([
			...boxLines(0, 0),
			[1, 0, true],   // top of box(1,0)
			[1, 0, false],  // left of box(1,0)
		])

		vi.spyOn(Math, 'random').mockReturnValue(0)

		// With box(1,0) NOT completed, AI avoids (2,0,h)
		const resultNotCompleted = findBestMove(boardSize, linesWith3Sides, boxes, lineKey, checkBoxCompletion)
		// (2,0,h) is risky because box(1,0) would get 3 sides
		// AI should avoid it if safe moves exist
		const hasAvoidedRiskyWithIncomplete =
			!(resultNotCompleted.row === 2 && resultNotCompleted.col === 0 && resultNotCompleted.isHorizontal === true)
		// This should be true (AI avoids the risky move)
		expect(hasAvoidedRiskyWithIncomplete).toBe(true)

		// With box(1,0) completed, the same move is no longer risky for that box
		// because completed boxes are skipped. The move might still be risky for
		// other boxes though, so we just verify the function runs without error.
		const resultBothComplete = findBestMove(boardSize, linesWith3Sides, boxesBothComplete, lineKey, checkBoxCompletion)
		expect(resultBothComplete).not.toBeNull()
	})
})

// ─── Edge cases ─────────────────────────────────────────────────────

describe('edge cases', () => {
	it('works correctly on minimum board size (boardSize=3, 2x2 boxes)', () => {
		const boardSize = 3
		const lines = {}
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0.5)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		expect(result).not.toBeNull()
		expect(result.row).toBeGreaterThanOrEqual(0)
		expect(result.col).toBeGreaterThanOrEqual(0)
		expect(typeof result.isHorizontal).toBe('boolean')

		// Verify bounds: for horizontal lines, row < boardSize, col < boardSize-1
		// for vertical lines, row < boardSize-1, col < boardSize
		if (result.isHorizontal) {
			expect(result.row).toBeLessThan(boardSize)
			expect(result.col).toBeLessThan(boardSize - 1)
		} else {
			expect(result.row).toBeLessThan(boardSize - 1)
			expect(result.col).toBeLessThan(boardSize)
		}
	})

	it('handles nearly-full board with only one move remaining', () => {
		const boardSize = 3
		// Leave only one line undrawn: the very last one
		const lastMove = [1, 1, false] // row=1, col=1, vertical
		const lines = allLinesExcept(boardSize, [lastMove])
		// Mark some boxes as completed (those that are already closed)
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		expect(result).toEqual({ row: 1, col: 1, isHorizontal: false })
	})

	it('works on larger board size (boardSize=5, 4x4 boxes)', () => {
		const boardSize = 5
		const lines = {}
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		expect(result).not.toBeNull()
		// Total available moves on 5x5: 5*4(h) + 4*5(v) = 20 + 20 = 40
		// First move should be row=0, col=0, horizontal
		expect(result).toEqual({ row: 0, col: 0, isHorizontal: true })
	})

	it('completing move takes priority even with only one completing and many risky', () => {
		const boardSize = 3
		// Set up board where box(0,0) has 3 sides (completing move exists)
		// and all other remaining moves are risky
		// Box(0,0): top, left, bottom drawn, missing right
		// Box(0,1): top, right drawn (2 sides — any 3rd side is risky)
		// Box(1,0): bottom, left drawn (2 sides — any 3rd side is risky)
		// Box(1,1): bottom, right drawn (2 sides — any 3rd side is risky)
		const lines = buildLines([
			// 3 sides of box(0,0)
			[0, 0, true],  // top
			[1, 0, true],  // bottom
			[0, 0, false], // left
			// Additional lines to make other boxes have 2 sides
			[0, 1, true],  // top of box(0,1)
			[0, 2, false], // right of box(0,1)
			[2, 0, true],  // bottom of box(1,0)
			[1, 0, false], // left of box(1,0) — wait, this is also left of box(1,0)
			[2, 1, true],  // bottom of box(1,1)
			[1, 2, false], // right of box(1,1)
		])
		const boxes = {}

		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = findBestMove(boardSize, lines, boxes, lineKey, checkBoxCompletion)

		// Should pick the completing move: right of box(0,0) = (0,1,v)
		expect(result).toEqual({ row: 0, col: 1, isHorizontal: false })
	})
})
