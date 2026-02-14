import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../hooks/useGameState'
import {
  PLAYER_COLORS,
  PIECE_TYPES,
  GAME_MODES,
  AI_DIFFICULTY,
  BOARD_SIZE,
} from '../constants'

export const RED = PLAYER_COLORS.RED
export const BLACK = PLAYER_COLORS.BLACK
export const KING = PIECE_TYPES.KING
export const NORMAL = PIECE_TYPES.NORMAL

export function piece(color, type = NORMAL) {
  return { color, type }
}

export function emptyBoard() {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null))
}

export function buildBoard(pieces) {
  const board = emptyBoard()
  for (const { row, col, color, type = NORMAL } of pieces) {
    board[row][col] = piece(color, type)
  }
  return board
}

export function renderCheckersHook() {
  return renderHook(() => useGameState())
}

export async function startPvPGame(result) {
  await act(async () => {
    result.current.startGame(
      GAME_MODES.HUMAN_VS_HUMAN,
      PLAYER_COLORS.RED,
      AI_DIFFICULTY.MEDIUM
    )
  })
}

export async function startPvCGame(
  result,
  color = PLAYER_COLORS.RED,
  difficulty = AI_DIFFICULTY.MEDIUM
) {
  await act(async () => {
    result.current.startGame(
      GAME_MODES.HUMAN_VS_COMPUTER,
      color,
      difficulty
    )
  })
}
