import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameBoard from './GameBoard.jsx'
import { createInitialBoard } from '../constants/index.js'

const defaultProps = {
  board: createInitialBoard(),
  selectedPiece: null,
  validMoves: [],
  onSquareClick: vi.fn(),
  lastMove: null,
  currentHint: null,
  darkMode: false,
}

describe('GameBoard', () => {
  describe('rendering', () => {
    it('renders 64 squares', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      const grid = container.querySelector('[style*="grid-template-columns"]')
      expect(grid.children).toHaveLength(64)
    })

    it('renders checker pieces on the board', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      // Initial board has 24 pieces (12 red + 12 black)
      const pieces = container.querySelectorAll('.rounded-full')
      expect(pieces).toHaveLength(24)
    })
  })

  describe('square click', () => {
    it('calls onSquareClick with row and col', () => {
      const onSquareClick = vi.fn()
      const { container } = render(
        <GameBoard {...defaultProps} onSquareClick={onSquareClick} />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      // Click the first square (0,0)
      fireEvent.click(grid.children[0])
      expect(onSquareClick).toHaveBeenCalledWith(0, 0)
    })

    it('calls onSquareClick with correct indices for other squares', () => {
      const onSquareClick = vi.fn()
      const { container } = render(
        <GameBoard {...defaultProps} onSquareClick={onSquareClick} />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      // Click square at position (1,3) = index 11
      fireEvent.click(grid.children[11])
      expect(onSquareClick).toHaveBeenCalledWith(1, 3)
    })
  })

  describe('selection highlighting', () => {
    it('highlights selected piece square with yellow overlay', () => {
      const { container } = render(
        <GameBoard {...defaultProps} selectedPiece={{ row: 5, col: 2 }} />
      )
      const overlay = container.querySelector('.bg-yellow-400')
      expect(overlay).toBeTruthy()
    })

    it('does not show overlay when no piece selected', () => {
      const { container } = render(
        <GameBoard {...defaultProps} selectedPiece={null} />
      )
      const overlay = container.querySelector('.bg-yellow-400')
      expect(overlay).toBeNull()
    })
  })

  describe('valid move indicators', () => {
    it('renders blue dot for non-capture valid move', () => {
      const validMoves = [{ row: 4, col: 3, isCapture: false }]
      const { container } = render(
        <GameBoard {...defaultProps} validMoves={validMoves} selectedPiece={{ row: 5, col: 2 }} />
      )
      const blueDot = container.querySelector('.bg-blue-500')
      expect(blueDot).toBeTruthy()
    })

    it('renders red dot for mandatory capture move', () => {
      const validMoves = [{ row: 3, col: 4, isCapture: true }]
      const { container } = render(
        <GameBoard {...defaultProps} validMoves={validMoves} selectedPiece={{ row: 5, col: 2 }} />
      )
      const redDot = container.querySelector('.bg-red-500')
      expect(redDot).toBeTruthy()
    })

    it('does not render dots when no valid moves', () => {
      const { container } = render(
        <GameBoard {...defaultProps} validMoves={[]} />
      )
      const blueDot = container.querySelector('.bg-blue-500')
      const redDot = container.querySelector('.bg-red-500')
      expect(blueDot).toBeNull()
      expect(redDot).toBeNull()
    })
  })

  describe('last move highlighting', () => {
    it('highlights last move squares with gold background', () => {
      const { container } = render(
        <GameBoard
          {...defaultProps}
          lastMove={{ from: { row: 5, col: 2 }, to: { row: 4, col: 3 } }}
        />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      // Square at (5,2) = index 42, should have #fbbf24 bg
      const fromSquare = grid.children[42]
      expect(fromSquare.style.backgroundColor).toBe('rgb(251, 191, 36)')
      // Square at (4,3) = index 35
      const toSquare = grid.children[35]
      expect(toSquare.style.backgroundColor).toBe('rgb(251, 191, 36)')
    })

    it('does not highlight when lastMove is null', () => {
      const { container } = render(
        <GameBoard {...defaultProps} lastMove={null} />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      // Check that no square has the gold highlight (checking a dark square)
      const square = grid.children[1] // (0,1) is dark square with piece
      expect(square.style.backgroundColor).not.toBe('rgb(251, 191, 36)')
    })
  })

  describe('hint highlighting', () => {
    it('highlights hint squares with purple', () => {
      const { container } = render(
        <GameBoard
          {...defaultProps}
          currentHint={{ from: { row: 5, col: 2 }, to: { row: 4, col: 3 } }}
        />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      const hintSquare = grid.children[42] // (5,2)
      expect(hintSquare.style.backgroundColor).toBe('rgb(167, 139, 250)')
    })

    it('does not highlight when currentHint is null', () => {
      const { container } = render(
        <GameBoard {...defaultProps} currentHint={null} />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      const square = grid.children[42]
      expect(square.style.backgroundColor).not.toBe('rgb(167, 139, 250)')
    })
  })

  describe('dark mode', () => {
    it('applies dark mode board background', () => {
      const { container } = render(
        <GameBoard {...defaultProps} darkMode={true} />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      expect(grid.style.background).toBe('rgb(34, 43, 58)')
    })

    it('applies light mode board background by default', () => {
      const { container } = render(
        <GameBoard {...defaultProps} darkMode={false} />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      const bg = grid.style.background
      expect(bg === 'rgb(255, 255, 255)' || bg === '#fff').toBe(true)
    })
  })

  describe('drag and drop', () => {
    it('drag start on piece triggers onSquareClick', () => {
      const onSquareClick = vi.fn()
      const { container } = render(
        <GameBoard {...defaultProps} onSquareClick={onSquareClick} />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      // (0,1) has a black piece — find the draggable div
      const square = grid.children[1]
      const draggable = square.querySelector('[draggable="true"]')
      expect(draggable).toBeTruthy()
      fireEvent.dragStart(draggable, {
        dataTransfer: { setData: vi.fn(), effectAllowed: 'move' },
      })
      expect(onSquareClick).toHaveBeenCalledWith(0, 1)
    })

    it('drop on valid move square triggers onSquareClick', () => {
      const onSquareClick = vi.fn()
      const validMoves = [{ row: 4, col: 3, isCapture: false }]
      const { container } = render(
        <GameBoard
          {...defaultProps}
          onSquareClick={onSquareClick}
          validMoves={validMoves}
          selectedPiece={{ row: 5, col: 2 }}
        />
      )
      const grid = container.querySelector('[style*="grid-template-columns"]')
      const targetSquare = grid.children[35] // (4,3)
      fireEvent.drop(targetSquare, {
        preventDefault: vi.fn(),
        dataTransfer: { getData: vi.fn() },
      })
      expect(onSquareClick).toHaveBeenCalledWith(4, 3)
    })
  })
})
