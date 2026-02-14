import { renderHook, act } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useGameState } from '../hooks/useGameState'

// ─── Constants ──────────────────────────────────────────────────────

export const PLAYER_COLORS = [
	'#3B82F6', '#EF4444', '#10B981', '#F59E0B',
	'#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
]

// ─── Factory: Player configs ────────────────────────────────────────

export function makePlayer(overrides = {}) {
	return {
		name: 'Player 1',
		isComputer: false,
		color: PLAYER_COLORS[0],
		...overrides,
	}
}

export function makePlayers(count = 2, overrides = []) {
	return Array.from({ length: count }, (_, i) => makePlayer({
		name: `Player ${i + 1}`,
		color: PLAYER_COLORS[i % PLAYER_COLORS.length],
		...overrides[i],
	}))
}

export function makeComputerPlayer(overrides = {}) {
	return makePlayer({ name: 'CPU 1', isComputer: true, ...overrides })
}

// ─── Factory: Game configs ──────────────────────────────────────────

export function makeGameConfig(overrides = {}) {
	return {
		players: makePlayers(2),
		boardSize: 3, // 2x2 boxes — small for fast testing
		...overrides,
	}
}

// ─── Line key helper (mirrors hook's lineKey) ───────────────────────

export function lineKey(row, col, isHorizontal) {
	return `${row},${col},${isHorizontal ? 'h' : 'v'}`
}

// ─── Board state builders ───────────────────────────────────────────

// Build a lines object from an array of [row, col, isHorizontal] tuples
export function buildLines(lineSpecs, playerIndex = 0) {
	const lines = {}
	for (const [row, col, isH] of lineSpecs) {
		lines[lineKey(row, col, isH)] = playerIndex
	}
	return lines
}

// Build line specs for a complete box at (row, col)
export function boxLines(row, col) {
	return [
		[row, col, true],      // top
		[row + 1, col, true],  // bottom
		[row, col, false],     // left
		[row, col + 1, false], // right
	]
}

// Build line specs for 3 sides of a box (missing one side)
export function threeOfFourLines(row, col, missingSide = 'right') {
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

// ─── Hook renderer ──────────────────────────────────────────────────

export function renderDotsHook() {
	return renderHook(() => useGameState())
}

export async function initGame(result, config = makeGameConfig()) {
	await act(async () => {
		result.current.initializeGame(config)
	})
}

// ─── Router wrapper for component tests ─────────────────────────────

export function DotsWrapper({ children }) {
	return <MemoryRouter>{children}</MemoryRouter>
}

export function renderWithRouter(ui) {
	return render(ui, { wrapper: DotsWrapper })
}

// ─── checkBoxCompletion helper (mirrors hook logic) ─────────────────

export function checkBoxCompletion(lines, row, col) {
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
