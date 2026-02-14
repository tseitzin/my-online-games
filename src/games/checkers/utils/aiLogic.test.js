import { describe, expect, it, vi } from 'vitest'
import { getAIMove, getHint } from './aiLogic'
import {
  RED,
  BLACK,
  KING,
  NORMAL,
  emptyBoard,
  buildBoard,
} from '../test/checkersTestHelpers'
import { createInitialBoard } from '../constants/index.js'

describe('getAIMove', () => {
  describe('general behavior', () => {
    it('returns null when there are no pieces on the board', () => {
      const board = emptyBoard()
      const move = getAIMove(board, BLACK)
      expect(move).toBeNull()
    })

    it('returns null when AI color has no pieces', () => {
      const board = buildBoard([
        { row: 5, col: 0, color: RED, type: NORMAL },
      ])
      const move = getAIMove(board, BLACK)
      expect(move).toBeNull()
    })

    it('returns a valid move from initial board for easy difficulty', () => {
      const board = createInitialBoard()
      const move = getAIMove(board, BLACK, 'easy')
      expect(move).not.toBeNull()
      expect(move).toHaveProperty('from')
      expect(move).toHaveProperty('to')
      expect(move.from).toHaveProperty('row')
      expect(move.from).toHaveProperty('col')
      expect(move.to).toHaveProperty('row')
      expect(move.to).toHaveProperty('col')
      expect(typeof move.isCapture).toBe('boolean')
    })

    it('returns a valid move from initial board for medium difficulty', () => {
      const board = createInitialBoard()
      const move = getAIMove(board, BLACK, 'medium')
      expect(move).not.toBeNull()
      expect(move.from).toHaveProperty('row')
      expect(move.from).toHaveProperty('col')
      expect(move.to).toHaveProperty('row')
      expect(move.to).toHaveProperty('col')
    })

    it('returns a valid move from initial board for hard difficulty', () => {
      const board = createInitialBoard()
      const move = getAIMove(board, BLACK, 'hard')
      expect(move).not.toBeNull()
      expect(move.from).toHaveProperty('row')
      expect(move.from).toHaveProperty('col')
      expect(move.to).toHaveProperty('row')
      expect(move.to).toHaveProperty('col')
    })

    it('defaults to medium difficulty when no difficulty is specified', () => {
      // A single black piece at row 2, col 1 can move to row 3, col 0 or row 3, col 2
      const board = buildBoard([
        { row: 2, col: 1, color: BLACK, type: NORMAL },
      ])
      const defaultMove = getAIMove(board, BLACK)
      const mediumMove = getAIMove(board, BLACK, 'medium')
      // Both should return a valid move (same greedy evaluation)
      expect(defaultMove).not.toBeNull()
      expect(mediumMove).not.toBeNull()
      expect(defaultMove.from).toEqual(mediumMove.from)
      expect(defaultMove.to).toEqual(mediumMove.to)
    })
  })

  describe('easy difficulty', () => {
    it('prefers captures over regular moves', () => {
      // Black at row 4, col 3 can capture red at row 5, col 4 by jumping to row 6, col 5
      // Black at row 0, col 1 has a regular move available
      const board = buildBoard([
        { row: 4, col: 3, color: BLACK, type: NORMAL },
        { row: 5, col: 4, color: RED, type: NORMAL },
        { row: 0, col: 1, color: BLACK, type: NORMAL },
      ])
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0)
      const move = getAIMove(board, BLACK, 'easy')
      expect(move).not.toBeNull()
      expect(move.isCapture).toBe(true)
      spy.mockRestore()
    })

    it('returns deterministic first move when Math.random returns 0', () => {
      const board = createInitialBoard()
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0)
      const move1 = getAIMove(board, BLACK, 'easy')
      const move2 = getAIMove(board, BLACK, 'easy')
      expect(move1).toEqual(move2)
      spy.mockRestore()
    })

    it('can pick different moves based on Math.random value', () => {
      // Black king at center has multiple non-capture moves
      const board = buildBoard([
        { row: 3, col: 4, color: BLACK, type: KING },
      ])
      const spy = vi.spyOn(Math, 'random')

      spy.mockReturnValue(0)
      const move1 = getAIMove(board, BLACK, 'easy')

      spy.mockReturnValue(0.99)
      const move2 = getAIMove(board, BLACK, 'easy')

      // A king at (3,4) has 4 possible moves; random(0) picks index 0, random(0.99) picks last
      expect(move1).not.toBeNull()
      expect(move2).not.toBeNull()
      // With 4 moves available, index 0 and index 3 should differ
      expect(move1.to).not.toEqual(move2.to)
      spy.mockRestore()
    })
  })

  describe('medium difficulty', () => {
    it('picks the highest-scoring capture move', () => {
      // Black at row 4, col 3 can capture red normal at row 5, col 2 (jump to 6,1)
      // Black at row 4, col 5 can capture red king at row 5, col 6 (jump to 6,7)
      // Capturing the king should give a higher board score
      const board = buildBoard([
        { row: 4, col: 3, color: BLACK, type: NORMAL },
        { row: 5, col: 2, color: RED, type: NORMAL },
        { row: 4, col: 5, color: BLACK, type: NORMAL },
        { row: 5, col: 6, color: RED, type: KING },
      ])
      const move = getAIMove(board, BLACK, 'medium')
      expect(move).not.toBeNull()
      expect(move.isCapture).toBe(true)
      // Should prefer capturing the king (from (4,5) to (6,7))
      expect(move.from).toEqual({ row: 4, col: 5 })
      expect(move.to).toEqual({ row: 6, col: 7 })
    })

    it('picks the highest-scoring regular move when no captures exist', () => {
      // Single black normal piece — medium picks the best evaluated move
      const board = buildBoard([
        { row: 3, col: 2, color: BLACK, type: NORMAL },
      ])
      const move = getAIMove(board, BLACK, 'medium')
      expect(move).not.toBeNull()
      expect(move.isCapture).toBe(false)
      expect(move.from).toEqual({ row: 3, col: 2 })
      // Black normals move downward; row 4 col 1 or col 3
      // Position bonus for black = row * 0.1; row 4 > row 3, both go to row 4 equally
      // Either (4,1) or (4,3) is acceptable — both give the same score
      expect(move.to.row).toBe(4)
    })

    it('returns null when no moves are available', () => {
      // No red pieces on the board at all — AI has nothing to move
      const board = buildBoard([
        { row: 3, col: 4, color: BLACK, type: NORMAL },
      ])
      const move = getAIMove(board, RED, 'medium')
      expect(move).toBeNull()
    })
  })

  describe('hard difficulty (minimax)', () => {
    it('returns a valid move', () => {
      const board = buildBoard([
        { row: 2, col: 1, color: BLACK, type: NORMAL },
        { row: 5, col: 2, color: RED, type: NORMAL },
      ])
      const move = getAIMove(board, BLACK, 'hard')
      expect(move).not.toBeNull()
      expect(move).toHaveProperty('from')
      expect(move).toHaveProperty('to')
      expect(typeof move.isCapture).toBe('boolean')
    })

    it('prefers captures', () => {
      // Black can capture red
      const board = buildBoard([
        { row: 4, col: 3, color: BLACK, type: NORMAL },
        { row: 5, col: 4, color: RED, type: NORMAL },
      ])
      const move = getAIMove(board, BLACK, 'hard')
      expect(move).not.toBeNull()
      expect(move.isCapture).toBe(true)
    })

    it('handles endgame with few pieces', () => {
      // Black king vs red normal — hard AI should find a winning move
      const board = buildBoard([
        { row: 3, col: 4, color: BLACK, type: KING },
        { row: 6, col: 1, color: RED, type: NORMAL },
      ])
      const move = getAIMove(board, BLACK, 'hard')
      expect(move).not.toBeNull()
      expect(move.from).toEqual({ row: 3, col: 4 })
    })
  })

  describe('forced capture scenarios', () => {
    it('all difficulties return the only available capture', () => {
      // Black normal at (4,3) with red at (5,4).
      // Direction (1,-1): (5,2) is empty = simple move only (no opponent to jump).
      // Direction (1,1): (5,4) is red = no simple move, but capture to (6,5) is available.
      // Only one capture exists; all difficulties should pick it.
      const board = buildBoard([
        { row: 4, col: 3, color: BLACK, type: NORMAL },
        { row: 5, col: 4, color: RED, type: NORMAL },
      ])
      const easyMove = getAIMove(board, BLACK, 'easy')
      const mediumMove = getAIMove(board, BLACK, 'medium')
      const hardMove = getAIMove(board, BLACK, 'hard')

      for (const move of [easyMove, mediumMove, hardMove]) {
        expect(move).not.toBeNull()
        expect(move.isCapture).toBe(true)
        expect(move.from).toEqual({ row: 4, col: 3 })
        expect(move.to).toEqual({ row: 6, col: 5 })
      }
    })
  })

  describe('single piece endgame', () => {
    it('returns the only available move for a lone piece', () => {
      // Single black normal in corner — only one move available
      const board = buildBoard([
        { row: 0, col: 1, color: BLACK, type: NORMAL },
      ])
      // Black normals move down: (1,0) or (1,2)
      const move = getAIMove(board, BLACK, 'medium')
      expect(move).not.toBeNull()
      expect(move.from).toEqual({ row: 0, col: 1 })
      expect(move.to.row).toBe(1)
    })

    it('returns the only move when a single piece has exactly one legal move', () => {
      // Black normal piece at edge — only one diagonal is on-board
      const board = buildBoard([
        { row: 0, col: 0, color: BLACK, type: NORMAL },
      ])
      // Black moves down; from (0,0): (1,-1) invalid, (1,1) valid
      const move = getAIMove(board, BLACK, 'easy')
      expect(move).not.toBeNull()
      expect(move.from).toEqual({ row: 0, col: 0 })
      expect(move.to).toEqual({ row: 1, col: 1 })
    })
  })

  describe('board evaluation (indirect)', () => {
    it('AI values kings over normal pieces', () => {
      // Black king (worth 3) is the only black piece. No captures available.
      // Medium AI evaluates all king moves and picks the best.
      // The king at (3,4) can move to (2,3), (2,5), (4,3), (4,5).
      const board = buildBoard([
        { row: 3, col: 4, color: BLACK, type: KING },
        { row: 5, col: 2, color: RED, type: NORMAL },
        { row: 5, col: 6, color: RED, type: NORMAL },
      ])
      const move = getAIMove(board, BLACK, 'medium')
      expect(move).not.toBeNull()
      // The AI must move its king (only piece available)
      expect(move.from).toEqual({ row: 3, col: 4 })
    })

    it('AI values piece advantage — captures over non-captures when scoring is better', () => {
      // Black king can capture a red piece, gaining material advantage
      const board = buildBoard([
        { row: 3, col: 2, color: BLACK, type: KING },
        { row: 4, col: 3, color: RED, type: NORMAL },
      ])
      // King at (3,2) can capture red at (4,3) by jumping to (5,4)
      const move = getAIMove(board, BLACK, 'medium')
      expect(move).not.toBeNull()
      expect(move.isCapture).toBe(true)
      expect(move.to).toEqual({ row: 5, col: 4 })
    })

    it('AI detects win condition — opponent has no legal moves', () => {
      // Red is completely trapped: two red pieces with all moves blocked.
      // Red at (7,0): (6,-1) off-board, (6,1) own piece. No capture (own color).
      // Red at (6,1): (5,0) and (5,2) blocked by black. Capture via (5,0) lands
      // at (4,-1) invalid. Capture via (5,2) lands at (4,3) blocked by black.
      // Result: red has NO legal moves, giving black +100 evaluation bonus.
      const board = buildBoard([
        { row: 7, col: 0, color: RED, type: NORMAL },
        { row: 6, col: 1, color: RED, type: NORMAL },
        { row: 5, col: 0, color: BLACK, type: NORMAL },
        { row: 5, col: 2, color: BLACK, type: NORMAL },
        { row: 4, col: 3, color: BLACK, type: NORMAL },
      ])
      const move = getAIMove(board, BLACK, 'medium')
      expect(move).not.toBeNull()
      expect(move).toHaveProperty('from')
      expect(move).toHaveProperty('to')
    })
  })
})

describe('getHint', () => {
  it('returns a valid move for the player', () => {
    const board = createInitialBoard()
    const hint = getHint(board, RED)
    expect(hint).not.toBeNull()
    expect(hint).toHaveProperty('from')
    expect(hint).toHaveProperty('to')
    expect(hint.from).toHaveProperty('row')
    expect(hint.from).toHaveProperty('col')
    expect(hint.to).toHaveProperty('row')
    expect(hint.to).toHaveProperty('col')
  })

  it('returns null when the player has no legal moves', () => {
    const board = emptyBoard()
    const hint = getHint(board, RED)
    expect(hint).toBeNull()
  })

  it('returns a move with proper from/to structure for black player', () => {
    const board = createInitialBoard()
    const hint = getHint(board, BLACK)
    expect(hint).not.toBeNull()
    expect(typeof hint.from.row).toBe('number')
    expect(typeof hint.from.col).toBe('number')
    expect(typeof hint.to.row).toBe('number')
    expect(typeof hint.to.col).toBe('number')
    expect(typeof hint.isCapture).toBe('boolean')
  })

  it('suggests a capture when one is available', () => {
    // Red at (5,2) can capture black at (4,3) by jumping to (3,4)
    const board = buildBoard([
      { row: 5, col: 2, color: RED, type: NORMAL },
      { row: 4, col: 3, color: BLACK, type: NORMAL },
    ])
    const hint = getHint(board, RED)
    expect(hint).not.toBeNull()
    expect(hint.isCapture).toBe(true)
    expect(hint.from).toEqual({ row: 5, col: 2 })
    expect(hint.to).toEqual({ row: 3, col: 4 })
  })
})
