import { describe, expect, it } from 'vitest'
import {
  PLAYER_COLORS,
  PIECE_TYPES,
  GAME_MODES,
  GAME_STATES,
  AI_DIFFICULTY,
  BOARD_SIZE,
  SQUARE_COLORS,
  PIECE_COLORS,
  createInitialBoard,
} from './index.js'

describe('constants', () => {
  it('PLAYER_COLORS has RED and BLACK', () => {
    expect(PLAYER_COLORS.RED).toBe('red')
    expect(PLAYER_COLORS.BLACK).toBe('black')
  })

  it('PIECE_TYPES has NORMAL and KING', () => {
    expect(PIECE_TYPES.NORMAL).toBe('normal')
    expect(PIECE_TYPES.KING).toBe('king')
  })

  it('GAME_MODES has HUMAN_VS_HUMAN and HUMAN_VS_COMPUTER', () => {
    expect(GAME_MODES.HUMAN_VS_HUMAN).toBe('human-vs-human')
    expect(GAME_MODES.HUMAN_VS_COMPUTER).toBe('human-vs-computer')
  })

  it('GAME_STATES has SETUP, PLAYING, and ENDED', () => {
    expect(GAME_STATES.SETUP).toBe('setup')
    expect(GAME_STATES.PLAYING).toBe('playing')
    expect(GAME_STATES.ENDED).toBe('ended')
  })

  it('AI_DIFFICULTY has EASY, MEDIUM, and HARD', () => {
    expect(AI_DIFFICULTY.EASY).toBe('easy')
    expect(AI_DIFFICULTY.MEDIUM).toBe('medium')
    expect(AI_DIFFICULTY.HARD).toBe('hard')
  })

  it('BOARD_SIZE is 8', () => {
    expect(BOARD_SIZE).toBe(8)
  })

  it('SQUARE_COLORS has LIGHT and DARK', () => {
    expect(SQUARE_COLORS.LIGHT).toBe('#fef3c7')
    expect(SQUARE_COLORS.DARK).toBe('#86efac')
  })

  it('PIECE_COLORS has all four values', () => {
    expect(PIECE_COLORS.RED).toBe('#ef4444')
    expect(PIECE_COLORS.RED_LIGHT).toBe('#fca5a5')
    expect(PIECE_COLORS.BLACK).toBe('#1f2937')
    expect(PIECE_COLORS.BLACK_LIGHT).toBe('#6b7280')
  })
})

describe('createInitialBoard', () => {
  it('returns an 8x8 grid', () => {
    const board = createInitialBoard()
    expect(board).toHaveLength(8)
    board.forEach(row => expect(row).toHaveLength(8))
  })

  it('places 12 black pieces in rows 0-2', () => {
    const board = createInitialBoard()
    let count = 0
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) {
          expect(board[row][col].color).toBe('black')
          count++
        }
      }
    }
    expect(count).toBe(12)
  })

  it('places 12 red pieces in rows 5-7', () => {
    const board = createInitialBoard()
    let count = 0
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) {
          expect(board[row][col].color).toBe('red')
          count++
        }
      }
    }
    expect(count).toBe(12)
  })

  it('leaves rows 3-4 empty', () => {
    const board = createInitialBoard()
    for (let row = 3; row <= 4; row++) {
      for (let col = 0; col < 8; col++) {
        expect(board[row][col]).toBeNull()
      }
    }
  })

  it('places pieces only on dark squares (odd parity)', () => {
    const board = createInitialBoard()
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) {
          expect((row + col) % 2).toBe(1)
        }
      }
    }
  })

  it('all pieces start as NORMAL type', () => {
    const board = createInitialBoard()
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) {
          expect(board[row][col].type).toBe('normal')
        }
      }
    }
  })

  it('light squares are all null', () => {
    const board = createInitialBoard()
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 0) {
          expect(board[row][col]).toBeNull()
        }
      }
    }
  })

  it('returns a fresh board each call', () => {
    const board1 = createInitialBoard()
    const board2 = createInitialBoard()
    expect(board1).not.toBe(board2)
    expect(board1[0]).not.toBe(board2[0])
  })
})
