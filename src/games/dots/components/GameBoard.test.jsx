import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameBoard from './GameBoard.jsx'

const defaultProps = {
  players: [
    { name: 'Alice', isComputer: false, color: '#3B82F6' },
    { name: 'Bob', isComputer: false, color: '#EF4444' },
  ],
  boardSize: 3,
  currentPlayerIndex: 0,
  lines: {},
  boxes: {},
  onLineClick: vi.fn(),
  onUndo: vi.fn(),
  lastMove: null,
  darkMode: false,
}

describe('GameBoard', () => {
  describe('basic rendering', () => {
    it('renders an SVG element', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('renders correct number of dots for boardSize 3 (3x3 = 9 circles)', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      const circles = container.querySelectorAll('circle')
      expect(circles).toHaveLength(9)
    })

    it('renders correct number of dots for boardSize 4 (4x4 = 16 circles)', () => {
      const { container } = render(<GameBoard {...defaultProps} boardSize={4} />)
      const circles = container.querySelectorAll('circle')
      expect(circles).toHaveLength(16)
    })

    it('renders current player turn badge with player name', () => {
      render(<GameBoard {...defaultProps} />)
      expect(screen.getByText("Alice's Turn")).toBeInTheDocument()
    })

    it('shows second player name in badge when it is their turn', () => {
      render(<GameBoard {...defaultProps} currentPlayerIndex={1} />)
      expect(screen.getByText("Bob's Turn")).toBeInTheDocument()
    })

    it('shows "(Computer)" in turn badge for AI player', () => {
      const aiPlayers = [
        { name: 'Alice', isComputer: false, color: '#3B82F6' },
        { name: 'Bot', isComputer: true, color: '#EF4444' },
      ]
      render(<GameBoard {...defaultProps} players={aiPlayers} currentPlayerIndex={1} />)
      expect(screen.getByText("Bot's Turn (Computer)")).toBeInTheDocument()
    })

    it('renders score cards for all players', () => {
      render(<GameBoard {...defaultProps} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })

  describe('undo button', () => {
    it('renders undo button text', () => {
      render(<GameBoard {...defaultProps} />)
      expect(screen.getByText(/Undo Last Move/)).toBeInTheDocument()
    })

    it('is disabled when no lastMove', () => {
      render(<GameBoard {...defaultProps} lastMove={null} />)
      const button = screen.getByText(/Undo Last Move/)
      expect(button).toBeDisabled()
    })

    it('is enabled when lastMove exists and both players are human', () => {
      render(
        <GameBoard
          {...defaultProps}
          lastMove={{ previousPlayerIndex: 1 }}
        />
      )
      const button = screen.getByText(/Undo Last Move/)
      expect(button).not.toBeDisabled()
    })

    it('is disabled when current player is computer', () => {
      const aiPlayers = [
        { name: 'Alice', isComputer: false, color: '#3B82F6' },
        { name: 'Bot', isComputer: true, color: '#EF4444' },
      ]
      render(
        <GameBoard
          {...defaultProps}
          players={aiPlayers}
          currentPlayerIndex={1}
          lastMove={{ previousPlayerIndex: 0 }}
        />
      )
      const button = screen.getByText(/Undo Last Move/)
      expect(button).toBeDisabled()
    })

    it('calls onUndo when clicked while enabled', () => {
      const onUndo = vi.fn()
      render(
        <GameBoard
          {...defaultProps}
          onUndo={onUndo}
          lastMove={{ previousPlayerIndex: 1 }}
        />
      )
      fireEvent.click(screen.getByText(/Undo Last Move/))
      expect(onUndo).toHaveBeenCalledOnce()
    })
  })

  describe('lines', () => {
    it('renders dashed placeholder lines for undrawn positions', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      // For boardSize=3: horizontal lines = 3 rows * 2 cols = 6, vertical lines = 2 rows * 3 cols = 6
      // Total undrawn lines = 12, each has a dashed line (strokeDasharray="4,4")
      const dashedLines = container.querySelectorAll('line[stroke-dasharray="4,4"]')
      expect(dashedLines.length).toBe(12)
    })

    it('renders solid lines for drawn positions with player color', () => {
      const linesMap = { '0,0,h': 0 } // Alice owns the top-left horizontal line
      const { container } = render(<GameBoard {...defaultProps} lines={linesMap} />)
      // The drawn line should have Alice's color
      const allLines = container.querySelectorAll('line')
      const drawnLine = Array.from(allLines).find(
        (line) => line.getAttribute('stroke') === '#3B82F6'
      )
      expect(drawnLine).toBeTruthy()
    })

    it('renders transparent hitbox rects for undrawn lines', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      // 12 undrawn lines = 12 hitboxes
      expect(hitboxes.length).toBe(12)
    })

    it('does not render hitbox rects for drawn lines', () => {
      // Draw all 12 lines
      const linesMap = {}
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          linesMap[`${row},${col},h`] = 0
        }
      }
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          linesMap[`${row},${col},v`] = 0
        }
      }
      const { container } = render(<GameBoard {...defaultProps} lines={linesMap} />)
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      expect(hitboxes.length).toBe(0)
    })
  })

  describe('boxes', () => {
    it('renders filled rect when a box is completed', () => {
      const boxesMap = { '0,0': 0 }
      const { container } = render(<GameBoard {...defaultProps} boxes={boxesMap} />)
      // The box rect is rendered inside the SVG <g> with player color fill
      const svgRects = container.querySelectorAll('svg rect')
      const filledRect = Array.from(svgRects).find(
        (r) => r.getAttribute('fill') === '#3B82F6' && r.getAttribute('opacity') === '0.3'
      )
      expect(filledRect).toBeTruthy()
    })

    it('shows player initial text in completed box', () => {
      const boxesMap = { '0,0': 0 }
      const { container } = render(<GameBoard {...defaultProps} boxes={boxesMap} />)
      const textEl = container.querySelector('svg text')
      expect(textEl).toBeTruthy()
      expect(textEl.textContent).toBe('A')
    })

    it('colors completed box with correct player color for player 2', () => {
      const boxesMap = { '0,1': 1 }
      const { container } = render(<GameBoard {...defaultProps} boxes={boxesMap} />)
      const svgRects = container.querySelectorAll('svg rect')
      const filledRect = Array.from(svgRects).find(
        (r) => r.getAttribute('fill') === '#EF4444' && r.getAttribute('opacity') === '0.3'
      )
      expect(filledRect).toBeTruthy()
      const textEl = container.querySelector('svg text')
      expect(textEl.textContent).toBe('B')
    })
  })

  describe('interaction', () => {
    it('calls onLineClick when clicking undrawn hitbox rect', () => {
      const onLineClick = vi.fn()
      const { container } = render(
        <GameBoard {...defaultProps} onLineClick={onLineClick} />
      )
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      expect(hitboxes.length).toBeGreaterThan(0)
      fireEvent.click(hitboxes[0])
      expect(onLineClick).toHaveBeenCalled()
    })

    it('does not call onLineClick when current player is computer', () => {
      const onLineClick = vi.fn()
      const aiPlayers = [
        { name: 'Bot', isComputer: true, color: '#3B82F6' },
        { name: 'Bob', isComputer: false, color: '#EF4444' },
      ]
      const { container } = render(
        <GameBoard
          {...defaultProps}
          players={aiPlayers}
          currentPlayerIndex={0}
          onLineClick={onLineClick}
        />
      )
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      expect(hitboxes.length).toBeGreaterThan(0)
      fireEvent.click(hitboxes[0])
      expect(onLineClick).not.toHaveBeenCalled()
    })

    it('shows hover preview (player color line) on mouseEnter of hitbox', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      expect(hitboxes.length).toBeGreaterThan(0)
      fireEvent.mouseEnter(hitboxes[0])
      // After hover, the corresponding <line> in the same <g> should have player color
      const parentG = hitboxes[0].closest('g')
      const line = parentG.querySelector('line')
      expect(line.getAttribute('stroke')).toBe('#3B82F6')
    })

    it('clears hover on mouseLeave', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      fireEvent.mouseEnter(hitboxes[0])
      fireEvent.mouseLeave(hitboxes[0])
      // After leaving, the undrawn line should be transparent again
      const parentG = hitboxes[0].closest('g')
      const line = parentG.querySelector('line')
      expect(line.getAttribute('stroke')).toBe('transparent')
    })
  })

  describe('scores', () => {
    it('shows score 0 for all players initially (no boxes)', () => {
      render(<GameBoard {...defaultProps} />)
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBe(2)
    })

    it('shows correct score from box ownership', () => {
      const boxesMap = { '0,0': 0, '0,1': 0, '1,0': 1 }
      render(<GameBoard {...defaultProps} boxes={boxesMap} />)
      // Alice has 2 boxes, Bob has 1
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('dark mode', () => {
    it('applies light theme dot color when darkMode false', () => {
      const { container } = render(<GameBoard {...defaultProps} darkMode={false} />)
      const circle = container.querySelector('circle')
      // Light theme dotColor: #374151
      expect(circle.getAttribute('fill')).toBe('#374151')
    })

    it('applies dark theme dot color when darkMode true', () => {
      const { container } = render(<GameBoard {...defaultProps} darkMode={true} />)
      const circle = container.querySelector('circle')
      // Dark theme dotColor: #e5e5e5
      expect(circle.getAttribute('fill')).toBe('#e5e5e5')
    })
  })

  describe('other', () => {
    it('renders instruction text', () => {
      render(<GameBoard {...defaultProps} />)
      expect(
        screen.getByText(/Click on the dashed lines to draw/)
      ).toBeInTheDocument()
    })

    it('hitbox cursor is pointer for human player', () => {
      const { container } = render(<GameBoard {...defaultProps} />)
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      expect(hitboxes[0].getAttribute('cursor')).toBe('pointer')
    })

    it('hitbox cursor is default for computer player', () => {
      const aiPlayers = [
        { name: 'Bot', isComputer: true, color: '#3B82F6' },
        { name: 'Bob', isComputer: false, color: '#EF4444' },
      ]
      const { container } = render(
        <GameBoard {...defaultProps} players={aiPlayers} currentPlayerIndex={0} />
      )
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      expect(hitboxes[0].getAttribute('cursor')).toBe('default')
    })

    it('does not hover when current player is computer', () => {
      const aiPlayers = [
        { name: 'Bot', isComputer: true, color: '#3B82F6' },
        { name: 'Bob', isComputer: false, color: '#EF4444' },
      ]
      const { container } = render(
        <GameBoard {...defaultProps} players={aiPlayers} currentPlayerIndex={0} />
      )
      const hitboxes = container.querySelectorAll('rect[fill="transparent"]')
      fireEvent.mouseEnter(hitboxes[0])
      // Hover should not activate — line stays transparent
      const parentG = hitboxes[0].closest('g')
      const line = parentG.querySelector('line')
      expect(line.getAttribute('stroke')).toBe('transparent')
    })
  })
})
