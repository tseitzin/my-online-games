import { describe, expect, it } from 'vitest'
import {
  isValidSquare,
  isDarkSquare,
  getValidMoves,
  getAllCaptures,
  hasAnyCaptures,
  getValidMovesForPiece,
  canContinueCapture,
  applyMove,
  getAllPossibleMoves,
  hasLegalMoves,
  countPieces,
} from './moveValidation.js'
import {
  RED,
  BLACK,
  KING,
  NORMAL,
  piece,
  emptyBoard,
  buildBoard,
} from '../test/checkersTestHelpers.js'
import { createInitialBoard } from '../constants/index.js'

describe('isValidSquare', () => {
  it('returns true for all corners of the board', () => {
    expect(isValidSquare(0, 0)).toBe(true)
    expect(isValidSquare(0, 7)).toBe(true)
    expect(isValidSquare(7, 0)).toBe(true)
    expect(isValidSquare(7, 7)).toBe(true)
  })

  it('returns true for a center square', () => {
    expect(isValidSquare(3, 4)).toBe(true)
  })

  it('returns false for negative row', () => {
    expect(isValidSquare(-1, 3)).toBe(false)
  })

  it('returns false for negative col', () => {
    expect(isValidSquare(3, -1)).toBe(false)
  })

  it('returns false for row equal to 8', () => {
    expect(isValidSquare(8, 0)).toBe(false)
  })

  it('returns false for col equal to 8', () => {
    expect(isValidSquare(0, 8)).toBe(false)
  })

  it('returns false for large out-of-bounds values', () => {
    expect(isValidSquare(100, 100)).toBe(false)
  })
})

describe('isDarkSquare', () => {
  it('returns false when row + col is even', () => {
    expect(isDarkSquare(0, 0)).toBe(false)
    expect(isDarkSquare(2, 4)).toBe(false)
  })

  it('returns true when row + col is odd', () => {
    expect(isDarkSquare(0, 1)).toBe(true)
    expect(isDarkSquare(3, 4)).toBe(true)
  })

  it('returns true for row 1, col 0', () => {
    expect(isDarkSquare(1, 0)).toBe(true)
  })

  it('returns false for row 1, col 1', () => {
    expect(isDarkSquare(1, 1)).toBe(false)
  })
})

describe('getValidMoves', () => {
  it('returns empty array for an empty square', () => {
    const board = emptyBoard()
    expect(getValidMoves(board, 3, 3)).toEqual([])
  })

  it('returns forward-left and forward-right moves for a red normal piece', () => {
    const board = buildBoard([{ row: 5, col: 3, color: RED }])
    const moves = getValidMoves(board, 5, 3)
    expect(moves).toEqual([
      { row: 4, col: 2, isCapture: false },
      { row: 4, col: 4, isCapture: false },
    ])
  })

  it('returns forward-left and forward-right moves for a black normal piece', () => {
    const board = buildBoard([{ row: 2, col: 3, color: BLACK }])
    const moves = getValidMoves(board, 2, 3)
    expect(moves).toEqual([
      { row: 3, col: 2, isCapture: false },
      { row: 3, col: 4, isCapture: false },
    ])
  })

  it('returns all four diagonal moves for a king piece', () => {
    const board = buildBoard([{ row: 4, col: 3, color: RED, type: KING }])
    const moves = getValidMoves(board, 4, 3)
    expect(moves).toHaveLength(4)
    expect(moves).toContainEqual({ row: 3, col: 2, isCapture: false })
    expect(moves).toContainEqual({ row: 3, col: 4, isCapture: false })
    expect(moves).toContainEqual({ row: 5, col: 2, isCapture: false })
    expect(moves).toContainEqual({ row: 5, col: 4, isCapture: false })
  })

  it('does not allow a red normal piece to move backward', () => {
    const board = buildBoard([{ row: 4, col: 3, color: RED }])
    const moves = getValidMoves(board, 4, 3)
    const backwardMoves = moves.filter(m => m.row > 4)
    expect(backwardMoves).toHaveLength(0)
  })

  it('does not allow a black normal piece to move backward', () => {
    const board = buildBoard([{ row: 4, col: 3, color: BLACK }])
    const moves = getValidMoves(board, 4, 3)
    const backwardMoves = moves.filter(m => m.row < 4)
    expect(backwardMoves).toHaveLength(0)
  })

  it('is blocked by own piece in a move direction', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: RED },
    ])
    const moves = getValidMoves(board, 5, 3)
    const normalMoves = moves.filter(m => !m.isCapture)
    expect(normalMoves).toEqual([{ row: 4, col: 4, isCapture: false }])
  })

  it('returns capture moves with correct metadata', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
    ])
    const moves = getValidMoves(board, 5, 3)
    const captures = moves.filter(m => m.isCapture)
    expect(captures).toHaveLength(1)
    expect(captures[0]).toEqual({
      row: 3,
      col: 1,
      isCapture: true,
      capturedPiece: { row: 4, col: 2 },
    })
  })

  it('lists captures before normal moves', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
    ])
    const moves = getValidMoves(board, 5, 3)
    expect(moves.length).toBeGreaterThanOrEqual(2)
    expect(moves[0].isCapture).toBe(true)
    const firstNonCapture = moves.findIndex(m => !m.isCapture)
    if (firstNonCapture !== -1) {
      for (let i = firstNonCapture; i < moves.length; i++) {
        expect(moves[i].isCapture).toBe(false)
      }
    }
  })

  it('returns limited moves for a piece in a corner', () => {
    const board = buildBoard([{ row: 7, col: 0, color: RED }])
    const moves = getValidMoves(board, 7, 0)
    expect(moves).toEqual([{ row: 6, col: 1, isCapture: false }])
  })

  it('returns limited moves for a piece on the edge', () => {
    const board = buildBoard([{ row: 5, col: 0, color: RED }])
    const moves = getValidMoves(board, 5, 0)
    expect(moves).toEqual([{ row: 4, col: 1, isCapture: false }])
  })

  it('does not allow capturing own piece', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: RED },
    ])
    const moves = getValidMoves(board, 5, 3)
    const captures = moves.filter(m => m.isCapture)
    expect(captures).toHaveLength(0)
  })

  it('does not capture if landing square is occupied', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
      { row: 3, col: 1, color: RED },
    ])
    const moves = getValidMoves(board, 5, 3)
    const captures = moves.filter(m => m.isCapture)
    expect(captures).toHaveLength(0)
  })
})

describe('getAllCaptures', () => {
  it('returns captures for pieces that can capture', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
    ])
    const captures = getAllCaptures(board, RED)
    expect(captures).toHaveLength(1)
    expect(captures[0].row).toBe(5)
    expect(captures[0].col).toBe(3)
    expect(captures[0].captures).toHaveLength(1)
  })

  it('returns empty array when no captures are available', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 2, col: 4, color: BLACK },
    ])
    expect(getAllCaptures(board, RED)).toEqual([])
  })

  it('returns captures for the correct color only', () => {
    // Place pieces far enough apart that neither can capture the other
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 2, col: 4, color: BLACK },
    ])
    expect(getAllCaptures(board, BLACK)).toEqual([])
  })

  it('returns multiple pieces with captures', () => {
    const board = buildBoard([
      { row: 5, col: 1, color: RED },
      { row: 4, col: 2, color: BLACK },
      { row: 5, col: 5, color: RED },
      { row: 4, col: 4, color: BLACK },
    ])
    const captures = getAllCaptures(board, RED)
    expect(captures).toHaveLength(2)
  })
})

describe('hasAnyCaptures', () => {
  it('returns true when captures are available', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
    ])
    expect(hasAnyCaptures(board, RED)).toBe(true)
  })

  it('returns false when no captures are available', () => {
    const board = buildBoard([{ row: 5, col: 3, color: RED }])
    expect(hasAnyCaptures(board, RED)).toBe(false)
  })

  it('returns false on an empty board', () => {
    const board = emptyBoard()
    expect(hasAnyCaptures(board, RED)).toBe(false)
  })
})

describe('getValidMovesForPiece', () => {
  it('returns empty array if square is empty', () => {
    const board = emptyBoard()
    expect(getValidMovesForPiece(board, 3, 3)).toEqual([])
  })

  it('returns same result as getValidMoves when piece exists', () => {
    const board = buildBoard([{ row: 5, col: 3, color: RED }])
    expect(getValidMovesForPiece(board, 5, 3)).toEqual(getValidMoves(board, 5, 3))
  })
})

describe('canContinueCapture', () => {
  it('returns true when the piece has a capture available', () => {
    const board = buildBoard([
      { row: 3, col: 1, color: RED },
      { row: 2, col: 2, color: BLACK },
    ])
    expect(canContinueCapture(board, 3, 1)).toBe(true)
  })

  it('returns false when the piece has no captures', () => {
    const board = buildBoard([{ row: 5, col: 3, color: RED }])
    expect(canContinueCapture(board, 5, 3)).toBe(false)
  })

  it('returns false for an empty square', () => {
    const board = emptyBoard()
    expect(canContinueCapture(board, 3, 3)).toBe(false)
  })

  it('detects a multi-capture chain possibility', () => {
    const board = buildBoard([
      { row: 5, col: 1, color: RED },
      { row: 4, col: 2, color: BLACK },
      { row: 2, col: 4, color: BLACK },
    ])
    // After first capture, red lands at (3,3) — check if it can continue
    const { newBoard } = applyMove(board, 5, 1, 3, 3)
    expect(canContinueCapture(newBoard, 3, 3)).toBe(true)
  })
})

describe('applyMove', () => {
  it('moves a piece to a new square on a simple move', () => {
    const board = buildBoard([{ row: 5, col: 3, color: RED }])
    const { newBoard, capturedPiece } = applyMove(board, 5, 3, 4, 2)
    expect(newBoard[5][3]).toBeNull()
    expect(newBoard[4][2]).toEqual(piece(RED, NORMAL))
    expect(capturedPiece).toBeNull()
  })

  it('removes the captured piece on a capture move', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
    ])
    const { newBoard, capturedPiece } = applyMove(board, 5, 3, 3, 1)
    expect(newBoard[5][3]).toBeNull()
    expect(newBoard[4][2]).toBeNull()
    expect(newBoard[3][1]).toEqual(piece(RED, NORMAL))
    expect(capturedPiece).not.toBeNull()
    expect(capturedPiece.row).toBe(4)
    expect(capturedPiece.col).toBe(2)
    expect(capturedPiece.piece.color).toBe(BLACK)
  })

  it('promotes a red piece to king when it reaches row 0', () => {
    const board = buildBoard([{ row: 1, col: 3, color: RED }])
    const { newBoard } = applyMove(board, 1, 3, 0, 2)
    expect(newBoard[0][2].type).toBe(KING)
  })

  it('promotes a black piece to king when it reaches row 7', () => {
    const board = buildBoard([{ row: 6, col: 3, color: BLACK }])
    const { newBoard } = applyMove(board, 6, 3, 7, 2)
    expect(newBoard[7][2].type).toBe(KING)
  })

  it('does not promote a red piece that does not reach row 0', () => {
    const board = buildBoard([{ row: 5, col: 3, color: RED }])
    const { newBoard } = applyMove(board, 5, 3, 4, 2)
    expect(newBoard[4][2].type).toBe(NORMAL)
  })

  it('keeps a king as a king after moving', () => {
    const board = buildBoard([{ row: 4, col: 3, color: RED, type: KING }])
    const { newBoard } = applyMove(board, 4, 3, 5, 2)
    expect(newBoard[5][2].type).toBe(KING)
  })

  it('does not mutate the original board (immutability)', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
    ])
    const originalPiece = board[5][3]
    const originalCaptured = board[4][2]
    applyMove(board, 5, 3, 3, 1)
    expect(board[5][3]).toBe(originalPiece)
    expect(board[4][2]).toBe(originalCaptured)
    expect(board[3][1]).toBeNull()
  })

  it('promotes a red piece via capture landing on row 0', () => {
    const board = buildBoard([
      { row: 2, col: 3, color: RED },
      { row: 1, col: 2, color: BLACK },
    ])
    const { newBoard } = applyMove(board, 2, 3, 0, 1)
    expect(newBoard[0][1].type).toBe(KING)
    expect(newBoard[0][1].color).toBe(RED)
  })
})

describe('getAllPossibleMoves', () => {
  it('returns moves for all pieces of the given color', () => {
    const board = buildBoard([
      { row: 5, col: 1, color: RED },
      { row: 5, col: 5, color: RED },
    ])
    const moves = getAllPossibleMoves(board, RED)
    expect(moves.length).toBe(4)
    moves.forEach(m => {
      expect(m).toHaveProperty('from')
      expect(m).toHaveProperty('to')
      expect(m).toHaveProperty('isCapture')
    })
  })

  it('returns empty array when no pieces of that color exist', () => {
    const board = buildBoard([{ row: 5, col: 1, color: RED }])
    expect(getAllPossibleMoves(board, BLACK)).toEqual([])
  })

  it('returns empty array for a completely empty board', () => {
    const board = emptyBoard()
    expect(getAllPossibleMoves(board, RED)).toEqual([])
  })

  it('includes both captures and regular moves', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
    ])
    const moves = getAllPossibleMoves(board, RED)
    const captures = moves.filter(m => m.isCapture)
    const normals = moves.filter(m => !m.isCapture)
    expect(captures.length).toBeGreaterThanOrEqual(1)
    expect(normals.length).toBeGreaterThanOrEqual(1)
  })

  it('includes capturedPiece metadata for capture moves', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 4, color: BLACK },
    ])
    const moves = getAllPossibleMoves(board, RED)
    const capture = moves.find(m => m.isCapture)
    expect(capture.capturedPiece).toEqual({ row: 4, col: 4 })
  })
})

describe('hasLegalMoves', () => {
  it('returns true when pieces have legal moves', () => {
    const board = buildBoard([{ row: 5, col: 3, color: RED }])
    expect(hasLegalMoves(board, RED)).toBe(true)
  })

  it('returns false when no pieces of that color exist', () => {
    const board = emptyBoard()
    expect(hasLegalMoves(board, RED)).toBe(false)
  })

  it('returns false when all pieces are completely blocked', () => {
    // Red piece at row 0 col 1 (already promoted? No — it's a normal red piece)
    // A red normal piece at row 0 can't go up (off board) and can't go down (not allowed for normal)
    const board = buildBoard([{ row: 0, col: 1, color: RED }])
    expect(hasLegalMoves(board, RED)).toBe(false)
  })

  it('returns true on the initial board for both colors', () => {
    const board = createInitialBoard()
    expect(hasLegalMoves(board, RED)).toBe(true)
    expect(hasLegalMoves(board, BLACK)).toBe(true)
  })
})

describe('countPieces', () => {
  it('counts 12 pieces per color on the initial board', () => {
    const board = createInitialBoard()
    expect(countPieces(board, RED)).toBe(12)
    expect(countPieces(board, BLACK)).toBe(12)
  })

  it('returns 0 for a color with no pieces', () => {
    const board = emptyBoard()
    expect(countPieces(board, RED)).toBe(0)
  })

  it('counts correctly after removing a piece', () => {
    const board = createInitialBoard()
    const { newBoard } = applyMove(board, 5, 0, 4, 1)
    // Still 12 red (just moved) and 12 black (untouched)
    expect(countPieces(newBoard, RED)).toBe(12)
    expect(countPieces(newBoard, BLACK)).toBe(12)
  })

  it('counts correctly after a capture removes an opponent piece', () => {
    const board = buildBoard([
      { row: 5, col: 3, color: RED },
      { row: 4, col: 2, color: BLACK },
    ])
    const { newBoard } = applyMove(board, 5, 3, 3, 1)
    expect(countPieces(newBoard, RED)).toBe(1)
    expect(countPieces(newBoard, BLACK)).toBe(0)
  })

  it('counts only the specified color', () => {
    const board = buildBoard([
      { row: 5, col: 1, color: RED },
      { row: 5, col: 3, color: RED },
      { row: 2, col: 2, color: BLACK },
    ])
    expect(countPieces(board, RED)).toBe(2)
    expect(countPieces(board, BLACK)).toBe(1)
  })
})
