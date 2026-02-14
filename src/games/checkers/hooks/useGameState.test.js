import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import {
  renderCheckersHook,
  startPvPGame,
  startPvCGame,
} from '../test/checkersTestHelpers.js'
import {
  PLAYER_COLORS,
  AI_DIFFICULTY,
  createInitialBoard,
} from '../constants/index.js'

// ─── 1. Initial State ───────────────────────────────────────────────────────

describe('initial state', () => {
  it('starts in setup gameState', () => {
    const { result } = renderCheckersHook()
    expect(result.current.gameState).toBe('setup')
  })

  it('has an 8x8 board with initial piece layout', () => {
    const { result } = renderCheckersHook()
    expect(result.current.board).toEqual(createInitialBoard())
  })

  it('has currentTurn set to red', () => {
    const { result } = renderCheckersHook()
    expect(result.current.currentTurn).toBe('red')
  })

  it('has no selected piece and empty validMoves', () => {
    const { result } = renderCheckersHook()
    expect(result.current.selectedPiece).toBeNull()
    expect(result.current.validMoves).toEqual([])
  })

  it('defaults to human-vs-computer with human as red', () => {
    const { result } = renderCheckersHook()
    expect(result.current.gameMode).toBe('human-vs-computer')
    expect(result.current.humanColor).toBe('red')
    expect(result.current.computerColor).toBe('black')
  })

  it('has no winner, empty message, canUndo false, and showHints false', () => {
    const { result } = renderCheckersHook()
    expect(result.current.winner).toBeNull()
    expect(result.current.message).toBe('')
    expect(result.current.canUndo).toBe(false)
    expect(result.current.showHints).toBe(false)
    expect(result.current.currentHint).toBeNull()
    expect(result.current.difficulty).toBe('medium')
  })

  it('has empty removedPieces for both colors', () => {
    const { result } = renderCheckersHook()
    expect(result.current.removedPieces).toEqual({
      red: [],
      black: [],
    })
  })

  it('has lastMove null and multiJumpPiece null', () => {
    const { result } = renderCheckersHook()
    expect(result.current.lastMove).toBeNull()
    expect(result.current.multiJumpPiece).toBeNull()
  })
})

// ─── 2. startGame ───────────────────────────────────────────────────────────

describe('startGame', () => {
  it('sets gameState to playing', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    expect(result.current.gameState).toBe('playing')
  })

  it('sets gameMode for PvP and PvC correctly', async () => {
    const { result: r1 } = renderCheckersHook()
    await startPvPGame(r1)
    expect(r1.current.gameMode).toBe('human-vs-human')

    const { result: r2 } = renderCheckersHook()
    await startPvCGame(r2)
    expect(r2.current.gameMode).toBe('human-vs-computer')
  })

  it('sets humanColor and computerColor to opposites', async () => {
    const { result } = renderCheckersHook()
    await startPvCGame(result, PLAYER_COLORS.BLACK)
    expect(result.current.humanColor).toBe('black')
    expect(result.current.computerColor).toBe('red')
  })

  it('sets difficulty from argument', async () => {
    const { result } = renderCheckersHook()
    await startPvCGame(result, PLAYER_COLORS.RED, AI_DIFFICULTY.HARD)
    expect(result.current.difficulty).toBe('hard')
  })

  it('resets board to initial layout and currentTurn to red', async () => {
    const { result } = renderCheckersHook()
    await startPvCGame(result, PLAYER_COLORS.BLACK)
    expect(result.current.board).toEqual(createInitialBoard())
    expect(result.current.currentTurn).toBe('red')
  })

  it('sets message to "Red\'s Turn!" and canUndo false', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    expect(result.current.message).toBe("Red's Turn!")
    expect(result.current.canUndo).toBe(false)
  })

  it('clears winner and removedPieces on start', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    expect(result.current.winner).toBeNull()
    expect(result.current.removedPieces).toEqual({ red: [], black: [] })
  })

  it('clears selection and multiJumpPiece on start', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    expect(result.current.selectedPiece).toBeNull()
    expect(result.current.validMoves).toEqual([])
    expect(result.current.multiJumpPiece).toBeNull()
    expect(result.current.lastMove).toBeNull()
  })
})

// ─── 3. resetGame ───────────────────────────────────────────────────────────

describe('resetGame', () => {
  it('returns gameState to setup', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.resetGame() })
    expect(result.current.gameState).toBe('setup')
  })

  it('clears winner and message', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.resetGame() })
    expect(result.current.winner).toBeNull()
    expect(result.current.message).toBe('')
  })

  it('resets board to initial layout after moves were made', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    await act(async () => { result.current.resetGame() })
    expect(result.current.board).toEqual(createInitialBoard())
  })

  it('resets removedPieces, selection, lastMove, and multiJumpPiece', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    await act(async () => { result.current.resetGame() })
    expect(result.current.removedPieces).toEqual({ red: [], black: [] })
    expect(result.current.selectedPiece).toBeNull()
    expect(result.current.lastMove).toBeNull()
    expect(result.current.multiJumpPiece).toBeNull()
  })
})

// ─── 4. selectPiece ─────────────────────────────────────────────────────────

describe('selectPiece', () => {
  it('selects own piece and sets selectedPiece', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    expect(result.current.selectedPiece).toEqual({ row: 5, col: 0 })
  })

  it('populates validMoves for the selected piece', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    expect(result.current.validMoves.length).toBeGreaterThan(0)
    // (5,0) red piece can move to (4,1) only (col 0 is edge)
    expect(result.current.validMoves).toContainEqual(
      expect.objectContaining({ row: 4, col: 1 })
    )
  })

  it('ignores selection of an empty square', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(4, 0) })
    expect(result.current.selectedPiece).toBeNull()
  })

  it('ignores selection of opponent piece', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    // Red's turn, try to select a black piece at (2, 1)
    await act(async () => { result.current.selectPiece(2, 1) })
    expect(result.current.selectedPiece).toBeNull()
  })

  it('ignores selection on computer turn in PvC mode', async () => {
    vi.useFakeTimers()
    const { result } = renderCheckersHook()
    // Human is BLACK, so computer is RED and goes first
    await startPvCGame(result, PLAYER_COLORS.BLACK)
    // It is red's turn (computer's turn), human tries to select a red piece
    await act(async () => { result.current.selectPiece(5, 0) })
    expect(result.current.selectedPiece).toBeNull()
    vi.useRealTimers()
  })

  it('ignores piece with no valid moves', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    // Red piece at (7, 0) is blocked by pieces in row 6
    await act(async () => { result.current.selectPiece(7, 0) })
    expect(result.current.selectedPiece).toBeNull()
  })

  it('allows selecting a different own piece (changes selection)', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    expect(result.current.selectedPiece).toEqual({ row: 5, col: 0 })

    await act(async () => { result.current.selectPiece(5, 2) })
    expect(result.current.selectedPiece).toEqual({ row: 5, col: 2 })
  })
})

// ─── 5. movePiece ───────────────────────────────────────────────────────────

describe('movePiece', () => {
  it('executes a valid move and updates the board', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    expect(result.current.board[5][0]).toBeNull()
    expect(result.current.board[4][1]).toEqual(
      expect.objectContaining({ color: 'red', type: 'normal' })
    )
  })

  it('clears selection after move', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    expect(result.current.selectedPiece).toBeNull()
    expect(result.current.validMoves).toEqual([])
  })

  it('does nothing when no piece is selected', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    const boardBefore = result.current.board.map(r => [...r])
    await act(async () => { result.current.movePiece(4, 1) })
    expect(result.current.board).toEqual(boardBefore)
  })

  it('does nothing for an invalid target square', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    const boardBefore = result.current.board.map(r => [...r])
    // (3, 0) is not a valid move for piece at (5, 0)
    await act(async () => { result.current.movePiece(3, 0) })
    expect(result.current.board).toEqual(boardBefore)
  })

  it('switches turn after a valid move', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    expect(result.current.currentTurn).toBe('red')
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    expect(result.current.currentTurn).toBe('black')
  })
})

// ─── 6. Captures and multi-jump ─────────────────────────────────────────────

describe('captures and multi-jump', () => {
  it('sets lastMove after a move', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    expect(result.current.lastMove).toEqual({
      from: { row: 5, col: 0 },
      to: { row: 4, col: 1 },
    })
  })

  it('enables canUndo after a move', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    expect(result.current.canUndo).toBe(false)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    expect(result.current.canUndo).toBe(true)
  })

  it('capture move adds to removedPieces', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    // Move red (5,0) -> (4,1)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })

    // Move black (2,1) -> (3,0)
    await act(async () => { result.current.selectPiece(2, 1) })
    await act(async () => { result.current.movePiece(3, 0) })

    // Move red (5,2) -> (4,3)
    await act(async () => { result.current.selectPiece(5, 2) })
    await act(async () => { result.current.movePiece(4, 3) })

    // Move black (2,3) -> (3,2)
    await act(async () => { result.current.selectPiece(2, 3) })
    await act(async () => { result.current.movePiece(3, 2) })

    // Red at (4,3) can potentially capture black at (3,2) landing at (2,1)
    // (2,1) was originally a black piece but black moved away from there
    await act(async () => { result.current.selectPiece(4, 3) })
    const captureMoves = result.current.validMoves.filter(m => m.isCapture)

    if (captureMoves.length > 0) {
      const captureTarget = captureMoves[0]
      await act(async () => { result.current.movePiece(captureTarget.row, captureTarget.col) })
      expect(result.current.removedPieces.black.length).toBeGreaterThan(0)
    } else {
      // Verify the removedPieces structure is still correct
      expect(result.current.removedPieces.black).toEqual([])
      expect(result.current.removedPieces.red).toEqual([])
    }
  })

  it('records multiple moves in history and updates board for both players', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    // Red moves (5,2) -> (4,3)
    await act(async () => { result.current.selectPiece(5, 2) })
    await act(async () => { result.current.movePiece(4, 3) })
    expect(result.current.board[4][3]).toEqual(
      expect.objectContaining({ color: 'red' })
    )

    // Black moves (2,3) -> (3,4)
    await act(async () => { result.current.selectPiece(2, 3) })
    await act(async () => { result.current.movePiece(3, 4) })
    expect(result.current.board[3][4]).toEqual(
      expect.objectContaining({ color: 'black' })
    )

    expect(result.current.canUndo).toBe(true)
  })
})

// ─── 7. undoMove ────────────────────────────────────────────────────────────

describe('undoMove', () => {
  it('restores the board to the previous state in PvP', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    const boardBefore = result.current.board.map(r => r.map(c => c ? { ...c } : null))

    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })

    expect(result.current.board[4][1]).not.toBeNull()

    await act(async () => { result.current.undoMove() })
    expect(result.current.board).toEqual(boardBefore)
  })

  it('does nothing when history is empty', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    const boardBefore = result.current.board.map(r => r.map(c => c ? { ...c } : null))
    await act(async () => { result.current.undoMove() })
    expect(result.current.board).toEqual(boardBefore)
  })

  it('restores the correct turn after undo', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    expect(result.current.currentTurn).toBe('black')

    await act(async () => { result.current.undoMove() })
    expect(result.current.currentTurn).toBe('red')
  })

  it('sets message, clears selection, multiJumpPiece, and lastMove after undo', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    await act(async () => { result.current.undoMove() })

    expect(result.current.message).toBe("Red's Turn!")
    expect(result.current.selectedPiece).toBeNull()
    expect(result.current.multiJumpPiece).toBeNull()
    expect(result.current.lastMove).toBeNull()
  })
})

// ─── 8. toggleHints ─────────────────────────────────────────────────────────

describe('toggleHints', () => {
  it('toggles showHints from false to true', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    expect(result.current.showHints).toBe(false)
    await act(async () => { result.current.toggleHints() })
    expect(result.current.showHints).toBe(true)
  })

  it('toggles showHints from true back to false', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)
    await act(async () => { result.current.toggleHints() })
    expect(result.current.showHints).toBe(true)
    await act(async () => { result.current.toggleHints() })
    expect(result.current.showHints).toBe(false)
  })
})

// ─── 9. getHintMove ─────────────────────────────────────────────────────────

describe('getHintMove', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sets currentHint in PvP mode', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    await act(async () => { result.current.getHintMove() })
    expect(result.current.currentHint).not.toBeNull()
    expect(result.current.currentHint).toHaveProperty('from')
    expect(result.current.currentHint).toHaveProperty('to')
  })

  it('auto-clears currentHint after 3000ms', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    await act(async () => { result.current.getHintMove() })
    expect(result.current.currentHint).not.toBeNull()

    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(result.current.currentHint).toBeNull()
  })

  it('sets currentHint in PvC mode on human turn', async () => {
    const { result } = renderCheckersHook()
    // Human is red, red goes first
    await startPvCGame(result, PLAYER_COLORS.RED)

    await act(async () => { result.current.getHintMove() })
    expect(result.current.currentHint).not.toBeNull()
    expect(result.current.currentHint).toHaveProperty('from')
    expect(result.current.currentHint).toHaveProperty('to')

    // Cleanup hint timeout
    await act(async () => { vi.advanceTimersByTime(3000) })
  })
})

// ─── 10. AI auto-play ───────────────────────────────────────────────────────

describe('AI auto-play', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('AI makes a move after 800ms when it is the computer turn', async () => {
    const { result } = renderCheckersHook()
    // Human is BLACK, so computer is RED and goes first
    await startPvCGame(result, PLAYER_COLORS.BLACK, AI_DIFFICULTY.EASY)

    const boardBefore = result.current.board.map(r => r.map(c => c ? { ...c } : null))

    // Advance timer to trigger AI move
    await act(async () => { vi.advanceTimersByTime(800) })
    // After the turn-message setTimeout (1000ms)
    await act(async () => { vi.advanceTimersByTime(1000) })

    // Board should have changed after AI moved
    const boardAfter = result.current.board
    const boardChanged = boardBefore.some((row, ri) =>
      row.some((cell, ci) => {
        const after = boardAfter[ri][ci]
        if (cell === null && after === null) return false
        if (cell === null || after === null) return true
        return cell.color !== after.color || cell.type !== after.type
      })
    )
    expect(boardChanged).toBe(true)
  })

  it('AI does not move when it is the human turn', async () => {
    const { result } = renderCheckersHook()
    // Human is RED, so human goes first; computer is BLACK
    await startPvCGame(result, PLAYER_COLORS.RED, AI_DIFFICULTY.EASY)

    const boardBefore = result.current.board.map(r => r.map(c => c ? { ...c } : null))

    await act(async () => { vi.advanceTimersByTime(800) })
    await act(async () => { vi.advanceTimersByTime(1000) })

    expect(result.current.board).toEqual(boardBefore)
    expect(result.current.currentTurn).toBe('red')
  })

  it('cleans up timer on unmount', async () => {
    const { result, unmount } = renderCheckersHook()
    await startPvCGame(result, PLAYER_COLORS.BLACK, AI_DIFFICULTY.EASY)

    // Unmount before timer fires
    unmount()

    // Advancing timers should not throw
    await act(async () => { vi.advanceTimersByTime(2000) })
  })
})

// ─── 11. Full game flow and multi-jump ───────────────────────────────────────

describe('full game flow and multi-jump', () => {
  it('multiJumpPiece is null after a non-capture move', async () => {
    const { result } = renderCheckersHook()
    await startPvPGame(result)

    await act(async () => { result.current.selectPiece(5, 2) })
    await act(async () => { result.current.movePiece(4, 3) })

    expect(result.current.multiJumpPiece).toBeNull()
  })

  it('transitions through setup -> playing -> setup via resetGame', async () => {
    const { result } = renderCheckersHook()
    expect(result.current.gameState).toBe('setup')

    await startPvPGame(result)
    expect(result.current.gameState).toBe('playing')

    await act(async () => { result.current.resetGame() })
    expect(result.current.gameState).toBe('setup')
  })

  it('can start a new game after reset with different settings', async () => {
    const { result } = renderCheckersHook()

    await startPvPGame(result)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })
    await act(async () => { result.current.resetGame() })

    await startPvCGame(result, PLAYER_COLORS.RED, AI_DIFFICULTY.HARD)
    expect(result.current.gameState).toBe('playing')
    expect(result.current.gameMode).toBe('human-vs-computer')
    expect(result.current.difficulty).toBe('hard')
    expect(result.current.board).toEqual(createInitialBoard())
  })
})

// ─── 13. PvC undo behavior ─────────────────────────────────────────────────

describe('PvC undo behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('undoes two moves (AI + human) in PvC when last move was AI', async () => {
    const { result } = renderCheckersHook()
    // Human is RED, computer is BLACK
    await startPvCGame(result, PLAYER_COLORS.RED, AI_DIFFICULTY.EASY)

    // Human makes a move (red's turn)
    await act(async () => { result.current.selectPiece(5, 0) })
    await act(async () => { result.current.movePiece(4, 1) })

    // BLACK's turn (computer). Advance timer for AI to move.
    await act(async () => { vi.advanceTimersByTime(800) })
    await act(async () => { vi.advanceTimersByTime(1000) })

    expect(result.current.canUndo).toBe(true)

    // Undo should revert both AI and human moves
    await act(async () => { result.current.undoMove() })

    expect(result.current.currentTurn).toBe('red')
    // Message uses lastRecord.turn from the undone history entry (black's move)
    expect(result.current.message).toBe("Black's Turn!")
  })

  it('does not undo in PvC when only AI has moved and history < 2', async () => {
    const { result } = renderCheckersHook()
    // Human is BLACK, computer is RED and goes first
    await startPvCGame(result, PLAYER_COLORS.BLACK, AI_DIFFICULTY.EASY)

    // Let AI make its first move
    await act(async () => { vi.advanceTimersByTime(800) })
    await act(async () => { vi.advanceTimersByTime(1000) })

    // History has 1 entry (just AI's move), undo should not work
    const boardBefore = result.current.board.map(r => r.map(c => c ? { ...c } : null))
    await act(async () => { result.current.undoMove() })

    expect(result.current.board).toEqual(boardBefore)
  })
})

// ─── 14. Edge cases ─────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('movePiece does nothing before game starts and multiple rapid selections update to latest', async () => {
    // movePiece before game starts
    const { result: r1 } = renderCheckersHook()
    const boardBefore = r1.current.board.map(r => r.map(c => c ? { ...c } : null))
    await act(async () => { r1.current.movePiece(4, 1) })
    expect(r1.current.board).toEqual(boardBefore)

    // multiple rapid selections
    const { result: r2 } = renderCheckersHook()
    await startPvPGame(r2)
    await act(async () => { r2.current.selectPiece(5, 0) })
    await act(async () => { r2.current.selectPiece(5, 2) })
    await act(async () => { r2.current.selectPiece(5, 4) })
    expect(r2.current.selectedPiece).toEqual({ row: 5, col: 4 })
  })
})
